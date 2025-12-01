import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { createAuditContext } from '@/lib/audit-context-helper'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { rows } = await query(
      "SELECT key, value FROM system_settings WHERE key LIKE 'sso_%' ORDER BY key ASC"
    )

    const config: Record<string, any> = {
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
    const sensitiveFields = ['googleClientSecret', 'azureClientSecret']

    for (const row of rows) {
      const key = row.key.replace('sso_', '')
      let value: any

      try {
        value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
      } catch {
        value = row.value
      }

      if (sensitiveFields.includes(key) && value) {
        if (useVault && typeof value === 'string' && value.startsWith('vault://')) {
          try {
            const vaultPath = value.replace('vault://', '')
            const secret = await secretsManager.getSecret(`sso/${vaultPath}`)
            if (secret) {
              config[key] = secret[key] || secret.value || ''
            } else {
              config[key] = value
            }
          } catch (error) {
            console.warn(`Failed to retrieve ${key} from Vault:`, error)
            config[key] = value
          }
        } else if (typeof value === 'string' && value.length > 0) {
          const decrypted = decryptApiKey(value)
          config[key] = decrypted && decrypted !== value ? decrypted : value
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

async function putHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { config } = body as { config?: Record<string, any> }

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'SSO configuration object is required' },
        { status: 400 }
      )
    }

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
    const sensitiveFields = ['googleClientSecret', 'azureClientSecret']

    const updatedSettings: Record<string, any> = {}

    for (const [key, value] of Object.entries(config)) {
      const settingKey = `sso_${key}`
      let valueToStore: any = value

      if (sensitiveFields.includes(key) && value && String(value).trim() !== '') {
        if (useVault) {
          try {
            await secretsManager.storeSecret(
              `sso/${key}`,
              { value: String(value) },
              undefined,
              auditContext
            )
            valueToStore = `vault://${key}`
          } catch (error) {
            console.error(`Failed to store ${key} in Vault:`, error)
            valueToStore = encryptApiKey(String(value))
          }
        } else {
          valueToStore = encryptApiKey(String(value))
        }
      } else {
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

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'SSOConfiguration',
      entityId: 'system',
      oldValue: currentSettings,
      newValue: updatedSettings,
      userId: session.user.id,
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'SSO configuration saved successfully'
    })
  } catch (error) {
    console.error('Error updating SSO config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/sso-config')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/sso-config')

