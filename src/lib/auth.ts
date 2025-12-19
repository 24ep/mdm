import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { query } from "@/lib/db"

// Simple in-memory cache
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
let ssoConfigCache: { data: any, timestamp: number } | null = null
let sessionTimeoutCache: { data: number, timestamp: number } | null = null

async function checkUserEmailExists(email: string): Promise<boolean> {
  try {
    const { rows } = await query(
      'SELECT id FROM public.users WHERE email = $1 LIMIT 1',
      [email],
      30000,
      { skipTracing: true }
    )
    return rows && Array.isArray(rows) && rows.length > 0
  } catch (error: any) {
    // Silently return false if database query fails
    // This prevents authentication from failing if DB isn't ready
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error checking user email:', error?.message)
    }
    return false
  }
}

async function getOrCreateSSOUser(email: string, name: string, provider: string) {
  try {
    const { rows: existingUsers } = await query(
      'SELECT id, email, name, role FROM public.users WHERE email = $1 LIMIT 1',
      [email],
      30000,
      { skipTracing: true }
    )
    if (existingUsers && Array.isArray(existingUsers) && existingUsers.length > 0) {
      return {
        id: existingUsers[0].id,
        email: existingUsers[0].email,
        name: existingUsers[0].name || name,
        role: existingUsers[0].role,
      }
    }
    return null
  } catch (error: any) {
    // Silently return null if database query fails
    // This prevents SSO authentication from crashing if DB isn't ready
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error getting/creating SSO user:', error?.message)
    }
    return null
  }
}

async function getSSOConfig() {
  // Check cache first
  const now = Date.now()
  if (ssoConfigCache && (now - ssoConfigCache.timestamp < CACHE_TTL_MS)) {
    return ssoConfigCache.data
  }

  try {
    const { rows } = await query(
      "SELECT key, value FROM system_settings WHERE key LIKE 'sso_%'",
      [],
      30000,
      { skipTracing: true }
    )
    const config: any = {
      googleEnabled: false,
      azureEnabled: false,
      googleClientId: '',
      googleClientSecret: '',
      azureTenantId: '',
      azureClientId: '',
      azureClientSecret: ''
    }
    
    const { getSecretsManager } = await import('@/lib/secrets-manager')
    const { decryptApiKey } = await import('@/lib/encryption')
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    const sensitiveFields = ['googleClientSecret', 'azureClientSecret']
    
    if (rows && Array.isArray(rows)) {
      for (const row of rows) {
        const key = row.key.replace('sso_', '')
        let value: any
        
        try {
          value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
        } catch {
          value = row.value === 'true' || row.value === true ? true : row.value
        }
        
        // Decrypt sensitive fields if they're encrypted
        if (sensitiveFields.includes(key) && value) {
          if (useVault && typeof value === 'string' && value.startsWith('vault://')) {
            // Value is stored in Vault, retrieve it
            try {
              const vaultPath = value.replace('vault://', '')
              const secret = await secretsManager.getSecret(`sso/${vaultPath}`)
              if (secret) {
                config[key] = secret[key] || secret.value || ''
              } else {
                config[key] = '' // Empty if retrieval fails
              }
            } catch (error) {
              console.warn(`Failed to retrieve ${key} from Vault:`, error)
              config[key] = '' // Empty if retrieval fails
            }
          } else if (typeof value === 'string' && value.length > 0) {
            // Try to decrypt if it's encrypted
            const decrypted = decryptApiKey(value)
            if (decrypted && decrypted !== value) {
              config[key] = decrypted
            } else {
              config[key] = value
            }
          } else {
            config[key] = value
          }
        } else {
          config[key] = value
        }
      }
    }

    // Update cache
    ssoConfigCache = { data: config, timestamp: now }
    return config
  } catch (error: any) {
    // Silently fall back to environment variables if database query fails
    // This prevents NextAuth initialization from failing if DB isn't ready
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not load SSO config from database, using environment variables:', error?.message)
    }
    return {
      googleEnabled: false,
      azureEnabled: false,
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      azureTenantId: process.env.AZURE_AD_TENANT_ID || '',
      azureClientId: process.env.AZURE_AD_CLIENT_ID || '',
      azureClientSecret: process.env.AZURE_AD_CLIENT_SECRET || ''
    }
  }
}

// Read session timeout (in hours) from system settings or ENV fallback
// Supports both sessionPolicy.timeout (structured) and sessionTimeout (flat) formats
async function getSessionTimeoutSeconds(): Promise<number> {
  // Check cache
  const now = Date.now()
  if (sessionTimeoutCache && (now - sessionTimeoutCache.timestamp < CACHE_TTL_MS)) {
    return sessionTimeoutCache.data
  }

  let timeout: number = 24 * 3600 // Default

  try {
    // First, try to get sessionPolicy (structured format from SecurityFeatures)
    const { rows: policyRows } = await query(
      "SELECT value FROM system_settings WHERE key = 'sessionPolicy' LIMIT 1",
      [],
      30000,
      { skipTracing: true }
    )
    let found = false
    if (policyRows && Array.isArray(policyRows) && policyRows[0]?.value) {
      try {
        const policy = typeof policyRows[0].value === 'string' 
          ? JSON.parse(policyRows[0].value) 
          : policyRows[0].value
        if (policy?.timeout) {
          const hours = Number(policy.timeout)
          if (!Number.isNaN(hours) && hours > 0) {
            timeout = hours * 3600
            found = true
          }
        }
      } catch {
        // If JSON parse fails, continue to flat format
      }
    }
    
    if (!found) {
      // Fall back to flat sessionTimeout format (from SystemSettings)
      const { rows } = await query(
        "SELECT value FROM system_settings WHERE key = 'sessionTimeout' LIMIT 1",
        [],
        30000,
        { skipTracing: true }
      )
      if (rows && Array.isArray(rows) && rows[0]?.value) {
        const hours = Number(rows[0].value)
        if (!Number.isNaN(hours) && hours > 0) {
          timeout = hours * 3600
        }
      }
    }
  } catch (err: any) {
    // Silently fall back to env/default if database query fails
    // This prevents NextAuth initialization from failing if DB isn't ready
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not load session timeout from database, using default:', err?.message)
    }
    const envHours = Number(process.env.SESSION_TIMEOUT_HOURS || 24)
    timeout = (Number.isNaN(envHours) || envHours <= 0 ? 24 : envHours) * 3600
  }

  // Update Cache
  sessionTimeoutCache = { data: timeout, timestamp: now }
  return timeout
}

const providers: any[] = []

providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      name: { label: "Name", type: "text" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }
      try {
        const { rows } = await query(
          'SELECT id, email, name, password, role, is_active, requires_password_change, lockout_until FROM public.users WHERE email = $1 LIMIT 1',
          [credentials.email],
          30000,
          { skipTracing: true }
        )
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
          return null
        }
        const user = rows[0]
        
        // Check if user exists and has a password
        if (!user || !user.password) {
          return null
        }

        // 1. Check if account is locked out
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
          throw new Error("Account is temporarily locked. Please try again later.")
        }

        // 2. Check if account is active
        if (user.is_active === false) {
           throw new Error("Account is disabled. Please contact your administrator.")
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        
        if (!isPasswordValid) {
          // TODO: Increment failed login attempts here if we want to implement lockout
          return null
        }

        // 3. Check if password change is required
        if (user.requires_password_change) {
          // We can't easily force a redirect here in NextAuth credentials flow without a custom error or callback handling
          // For now, we allow login but the UI should handle this state if we pass it in the session
          // Or we can throw an error to block login until reset (if we have a forgotten password flow)
          // Let's pass it in the user object to the session
        }

        return { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          requiresPasswordChange: user.requires_password_change
        }
      } catch (error: any) {
        // Log the actual error
        console.error('Auth Error:', error.message)
        
        // Throw known errors so they can be displayed
        if (error.message.includes("Account is")) {
            throw error
        }

        // Silently return null if database query fails
        // This prevents authentication from crashing if DB isn't ready
        if (process.env.NODE_ENV === 'development') {
          console.warn('Authorization error:', error?.message)
        }
        return null
      }
    }
  })
)

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })
  )
}

if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
  providers.push(
    AzureADProvider({ clientId: process.env.AZURE_AD_CLIENT_ID, clientSecret: process.env.AZURE_AD_CLIENT_SECRET, tenantId: process.env.AZURE_AD_TENANT_ID })
  )
}

// Validate required environment variables
// Generate a temporary secret if not set (allows build to complete)
// In production, you should set NEXTAUTH_SECRET via environment variables
let nextAuthSecret = process.env.NEXTAUTH_SECRET

if (!nextAuthSecret) {
  // Always generate a temporary secret if not set to allow builds to complete
  // This is safe because the secret is only used at runtime, and you should
  // set NEXTAUTH_SECRET in your production environment
  nextAuthSecret = crypto.randomBytes(32).toString('base64')
  
  // Only log warnings in development to avoid build noise
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  NEXTAUTH_SECRET is not set in environment variables!')
    console.warn('Available env vars starting with NEXTAUTH:', 
      Object.keys(process.env).filter(k => k.startsWith('NEXTAUTH')).join(', ') || 'none')
    console.warn('Available env vars starting with AUTH:', 
      Object.keys(process.env).filter(k => k.startsWith('AUTH')).join(', ') || 'none')
    console.warn('⚠️  Generated temporary NEXTAUTH_SECRET for development:', nextAuthSecret.substring(0, 20) + '...')
    console.warn('⚠️  WARNING: This secret will change on each restart. Add NEXTAUTH_SECRET to .env.local for a persistent secret.')
  }
}

// Ensure we have at least one provider
if (providers.length === 0) {
  console.warn('Warning: No authentication providers configured. At least one provider is required.')
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  providers: providers.length > 0 ? providers : [
    // Fallback: provide a minimal credentials provider if none are configured
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        return null // Always fail - this is just to prevent NextAuth from crashing
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        if (!user.email) return false
        
        // Optimally, fetch SSO Config first
        const ssoConfig = await getSSOConfig()
        
        if (account.provider === 'google' && !ssoConfig.googleEnabled) return false
        if (account.provider === 'azure-ad' && !ssoConfig.azureEnabled) return false
        
        // Then check user existence
        const userExists = await checkUserEmailExists(user.email)
        if (!userExists) return false
        
        // Finally get/create SSO user
        const ssoUser = await getOrCreateSSOUser(user.email, user.name || profile?.name || '', account.provider)
        if (ssoUser) { (user as any).id = ssoUser.id; (user as any).role = ssoUser.role }
        return true
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).role = (user as any).role
        // Set token expiration based on system setting at login/refresh
        const timeoutSeconds = await getSessionTimeoutSeconds()
        const nowSeconds = Math.floor(Date.now() / 1000)
        ;(token as any).exp = nowSeconds + timeoutSeconds
        ;(token as any).iat = nowSeconds
      } else {
        // If exp was set previously, leave it; NextAuth will call authorized in middleware
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        ;(session.user as any).id = token.sub!
        ;(session.user as any).role = (token as any).role
        ;(session as any).exp = (token as any).exp
      }
      return session
    },
  },
  pages: { signIn: "/auth/signin" },
}
