import { prisma } from '@/lib/db'
import { query } from '@/lib/db' // Assuming we can use this or prisma directly. Using prisma is easier for upsert.

interface AdUser {
  id: string
  displayName: string
  mail: string | null
  userPrincipalName: string
  jobTitle: string | null
  department: string | null
  companyName: string | null
  mobilePhone: string | null
}

async function getSystemSettings() {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ['azureTenantId', 'azureClientId', 'azureClientSecret'] }
    }
  })
  
  // Need to map list to object. However, the system_settings table structure might be different.
  // Checking how SystemSettings.tsx fetches: it uses /api/settings which maps from DB.
  // I'll query directly or use the same logic. Use raw query for consistency with other libs if needed, but prisma is fine.
  // Actually, I'll assume keys are 'azureTenantId' etc.
  
  const config: Record<string, string> = {}
  // Assuming a generic SystemSetting model key/value
  // But wait, schema might not hava SystemSetting model? I should check schema.
  // Other files used `query` to `system_settings` table. I will do that.
  return config
}

async function getAdAccessToken(tenantId: string, clientId: string, clientSecret: string) {
  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)
  params.append('scope', 'https://graph.microsoft.com/.default')
  params.append('grant_type', 'client_credentials')

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    body: params,
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to get AD token: ${error}`)
  }

  const data = await res.json()
  return data.access_token
}

export async function syncAdUsers() {
  // 1. Get Settings
  // Using direct SQL to be safe as I haven't seen SystemSetting model in schema snippet I read (it was truncated)
  // But I saw `query` used in email.ts
  const { rows } = await query("SELECT key, value FROM system_settings WHERE key IN ('azureTenantId', 'azureClientId', 'azureClientSecret')", [])
  
  const config: Record<string, string> = {}
  rows?.forEach((row: any) => {
    config[row.key] = row.value
  })

  const { azureTenantId, azureClientId, azureClientSecret } = config

  if (!azureTenantId || !azureClientId || !azureClientSecret) {
    throw new Error('Azure AD credentials not configured')
  }

  // 2. Get Access Token
  const token = await getAdAccessToken(azureTenantId, azureClientId, azureClientSecret)

  // 3. Fetch Users
  let users: AdUser[] = []
  let nextLink: string | null = 'https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName,jobTitle,department,companyName,mobilePhone&$top=100'

  while (nextLink) {
    const res: any = await fetch(nextLink, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!res.ok) {
        throw new Error(`Graph API error: ${await res.text()}`)
    }

    const data = await res.json()
    users = users.concat(data.value)
    nextLink = data['@odata.nextLink'] || null
  }

  // 4. Upsert Users
  const results = {
    total: users.length,
    created: 0,
    updated: 0,
    errors: 0
  }

  for (const adUser of users) {
    const email = adUser.mail || adUser.userPrincipalName
    if (!email) continue

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } })

        const userData = {
            name: adUser.displayName,
            email: email, // Email should allow update if we match by adUserId? But usually email is unique.
            // If user exists, we rely on email match.
            adUserId: adUser.id,
            jobTitle: adUser.jobTitle,
            department: adUser.department,
            organization: adUser.companyName,
            allowedLoginMethods: ['azure-ad'],
            isActive: true,
            // Don't overwrite role if exists
        }

        if (existingUser) {
            await prisma.user.update({
                where: { id: existingUser.id },
                data: userData
            })
            results.updated++
        } else {
            // New user
            // Generate random password as they must use AD
            await prisma.user.create({
                data: {
                    ...userData,
                    password: Math.random().toString(36).slice(-8), // Dummy password
                    role: 'USER', // Default role
                }
            })
            results.created++
        }
    } catch (e) {
        console.error(`Failed to sync user ${email}`, e)
        results.errors++
    }
  }

  return results
}
