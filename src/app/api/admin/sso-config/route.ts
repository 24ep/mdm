import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { createAuditContext } from '@/lib/audit-context-helper'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get SSO configuration from system_settings
    const { rows } = await query(
      "SELECT key, value FROM system_settings WHERE key LIKE 'sso_%' ORDER BY key ASC"
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

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    // List of sensitive fields that should be encrypted
    const sensitiveFields = ['googleClientSecret', 'azureClientSecret']
    
    // Process rows and decrypt sensitive fields
    for (const row of rows) {
      const key = row.key.replace('sso_', '')
      let value: any
      
      try {
        value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
      } catch {
        value = row.value
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
              config[key] = value // Keep reference if retrieval fails
            }
          } catch (error) {
            // If Vault retrieval fails, keep the reference (will be handled on next save)
            console.warn(`Failed to retrieve ${key} from Vault:`, error)
            config[key] = value
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

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching SSO config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'SSO configuration object is required' },
        { status: 400 }
      )
    }

    // Get current settings for audit log
    const currentSettingsResult = await query(
      "SELECT key, value FROM system_settings WHERE key LIKE 'sso_%'"
    )
    const currentSettings = (currentSettingsResult.rows || []).reduce(
      (acc: Record<string, any>, setting: any) => {
        acc[setting.key] = setting.value
        return acc
      },
      {}
    )

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    const auditContext = createAuditContext(request, session.user, 'SSO configuration update')
    
    // List of sensitive fields that should be encrypted
    const sensitiveFields = ['googleClientSecret', 'azureClientSecret']
    
    // Save each SSO setting
    const updatedSettings: Record<string, any> = {}
    for (const [key, value] of Object.entries(config)) {
      const settingKey = `sso_${key}`
      let valueToStore: any = value
      
      // Encrypt sensitive fields
      if (sensitiveFields.includes(key) && value && String(value).trim() !== '') {
        if (useVault) {
          // Store in Vault
          try {
            await secretsManager.storeSecret(
              `sso/${key}`,
              { value: String(value) },
              undefined,
              auditContext
            )
            // Store reference in database
            valueToStore = `vault://${key}`
          } catch (error) {
            console.error(`Failed to store ${key} in Vault:`, error)
            // Fallback to database encryption
            valueToStore = encryptApiKey(String(value))
          }
        } else {
          // Use database encryption
          valueToStore = encryptApiKey(String(value))
        }
      } else {
        // Non-sensitive fields stored as-is
        valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value)
      }
      
      const upsertSql = `
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        RETURNING value
      `
      const res = await query(upsertSql, [settingKey, valueToStore])
      updatedSettings[settingKey] = res.rows[0]?.value
    }

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'SSOConfiguration',
      entityId: 'system',
      oldValue: currentSettings,
      newValue: updatedSettings,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Providers read config dynamically in callbacks; no cache clear needed here

    return NextResponse.json({ 
      success: true,
      message: 'SSO configuration saved successfully'
    })
  } catch (error) {
    console.error('Error updating SSO config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
