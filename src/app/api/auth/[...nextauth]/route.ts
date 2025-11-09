import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { query } from "@/lib/db"

async function checkUserEmailExists(email: string): Promise<boolean> {
  try {
    const { rows } = await query<any>(
      'SELECT id FROM public.users WHERE email = $1 LIMIT 1',
      [email]
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
    const { rows: existingUsers } = await query<any>(
      'SELECT id, email, name, role FROM public.users WHERE email = $1 LIMIT 1',
      [email]
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
  try {
    const { rows } = await query(
      "SELECT key, value FROM system_settings WHERE key LIKE 'sso_%'"
    )
    const config: any = {
      googleEnabled: false,
      azureEnabled: false,
      ldapEnabled: false,
      googleClientId: '',
      googleClientSecret: '',
      azureTenantId: '',
      azureClientId: '',
      azureClientSecret: '',
      ldapUrl: '',
      ldapBaseDn: '',
      ldapBindDn: '',
      ldapBindPassword: '',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: ''
    }
    
    const { getSecretsManager } = await import('@/lib/secrets-manager')
    const { decryptApiKey } = await import('@/lib/encryption')
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    const sensitiveFields = ['googleClientSecret', 'azureClientSecret', 'ldapBindPassword']
    
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
      ldapEnabled: false,
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      azureTenantId: process.env.AZURE_AD_TENANT_ID || '',
      azureClientId: process.env.AZURE_AD_CLIENT_ID || '',
      azureClientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      ldapUrl: '',
      ldapBaseDn: '',
      ldapBindDn: '',
      ldapBindPassword: '',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: ''
    }
  }
}

// Read session timeout (in hours) from system settings or ENV fallback
// Supports both sessionPolicy.timeout (structured) and sessionTimeout (flat) formats
async function getSessionTimeoutSeconds(): Promise<number> {
  try {
    // First, try to get sessionPolicy (structured format from SecurityFeatures)
    const { rows: policyRows } = await query<any>(
      "SELECT value FROM system_settings WHERE key = 'sessionPolicy' LIMIT 1"
    )
    if (policyRows && Array.isArray(policyRows) && policyRows[0]?.value) {
      try {
        const policy = typeof policyRows[0].value === 'string' 
          ? JSON.parse(policyRows[0].value) 
          : policyRows[0].value
        if (policy?.timeout) {
          const hours = Number(policy.timeout)
          if (!Number.isNaN(hours) && hours > 0) return hours * 3600
        }
      } catch {
        // If JSON parse fails, continue to flat format
      }
    }
    
    // Fall back to flat sessionTimeout format (from SystemSettings)
    const { rows } = await query<any>(
      "SELECT value FROM system_settings WHERE key = 'sessionTimeout' LIMIT 1"
    )
    if (rows && Array.isArray(rows) && rows[0]?.value) {
      const hours = Number(rows[0].value)
      if (!Number.isNaN(hours) && hours > 0) return hours * 3600
    }
  } catch (err: any) {
    // Silently fall back to env/default if database query fails
    // This prevents NextAuth initialization from failing if DB isn't ready
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not load session timeout from database, using default:', err?.message)
    }
  }
  const envHours = Number(process.env.SESSION_TIMEOUT_HOURS || 24)
  return (Number.isNaN(envHours) || envHours <= 0 ? 24 : envHours) * 3600
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
        const { rows } = await query<any>(
          'SELECT id, email, name, password, role FROM public.users WHERE email = $1 LIMIT 1',
          [credentials.email]
        )
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
          return null
        }
        const user = rows[0]
        if (!user || !user.password) {
          return null
        }
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          return null
        }
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      } catch (error: any) {
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

providers.push(
  CredentialsProvider({
    id: "ldap",
    name: "LDAP",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null
      try {
        const userExists = await checkUserEmailExists(credentials.email)
        if (!userExists) return null
        const ldapConfig = await getSSOConfig()
        if (!ldapConfig.ldapEnabled || !ldapConfig.ldapUrl || !ldapConfig.ldapBaseDn) return null
        const ldapModule: any = await import('ldapjs').catch(() => null)
        if (!ldapModule) return null
        const client = ldapModule.createClient({ url: ldapConfig.ldapUrl })
        return new Promise((resolve) => {
          client.bind(ldapConfig.ldapBindDn || '', ldapConfig.ldapBindPassword || '', async (err) => {
            if (err) { client.unbind(); return resolve(null) }
            const searchFilter = (ldapConfig.ldapSearchFilter || '(uid={{username}})')
              .replace('{{username}}', credentials.email.split('@')[0])
              .replace('{{email}}', credentials.email)
            const opts = { filter: searchFilter, scope: 'sub', attributes: ['dn', 'cn', 'mail', 'uid'] }
            client.search(ldapConfig.ldapSearchBase || ldapConfig.ldapBaseDn, opts, async (err, res) => {
              if (err) { client.unbind(); return resolve(null) }
              let userDn: string | null = null
              res.on('searchEntry', (entry) => { userDn = entry.dn.toString() })
              res.on('end', async () => {
                if (!userDn) { client.unbind(); return resolve(null) }
                const userClient = ldapModule.createClient({ url: ldapConfig.ldapUrl })
                userClient.bind(userDn, credentials.password, async (err) => {
                  if (err) { userClient.unbind(); return resolve(null) }
                  userClient.unbind()
                  const { rows } = await query<any>('SELECT id, email, name, role FROM public.users WHERE email = $1 LIMIT 1', [credentials.email])
                  if (!rows || !Array.isArray(rows) || rows.length === 0) return resolve(null)
                  const user = rows[0]
                  return resolve({ id: user.id, email: user.email, name: user.name, role: user.role })
                })
              })
              res.on('error', () => { client.unbind(); resolve(null) })
            })
          })
        })
      } catch (error) {
        console.error('LDAP authentication error:', error)
        return null
      }
    }
  })
)

// Validate required environment variables
// In development, generate a secret if not set (not recommended for production)
let nextAuthSecret = process.env.NEXTAUTH_SECRET

if (!nextAuthSecret) {
  if (process.env.NODE_ENV === 'development') {
    // Debug: Log available env vars
    console.warn('⚠️  NEXTAUTH_SECRET is not set in environment variables!')
    console.warn('Available env vars starting with NEXTAUTH:', 
      Object.keys(process.env).filter(k => k.startsWith('NEXTAUTH')).join(', ') || 'none')
    console.warn('Available env vars starting with AUTH:', 
      Object.keys(process.env).filter(k => k.startsWith('AUTH')).join(', ') || 'none')
    
    // Generate a temporary secret for development (will change on each restart)
    nextAuthSecret = crypto.randomBytes(32).toString('base64')
    console.warn('⚠️  Generated temporary NEXTAUTH_SECRET for development:', nextAuthSecret.substring(0, 20) + '...')
    console.warn('⚠️  WARNING: This secret will change on each restart. Add NEXTAUTH_SECRET to .env.local for a persistent secret.')
  } else {
    throw new Error(
      'Missing NEXTAUTH_SECRET environment variable. ' +
      'Please set it in your .env.local file and restart your dev server. ' +
      'You can generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    )
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
        const ssoConfig = await getSSOConfig()
        if (account.provider === 'google' && !ssoConfig.googleEnabled) return false
        if (account.provider === 'azure-ad' && !ssoConfig.azureEnabled) return false
        const userExists = await checkUserEmailExists(user.email)
        if (!userExists) return false
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

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
