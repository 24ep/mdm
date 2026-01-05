import { NextRequest, NextResponse } from 'next/server'
// import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Dynamic import to prevent init crashes
    const { query } = await import('@/lib/db')
    
    // Config object with defaults
    const config: any = {
      googleEnabled: false,
      azureEnabled: false
    }

    // Track if we found explicit configuration
    let googleConfigFound = false
    let azureConfigFound = false

    // 1. Try to get from platform_integrations (New method)
    try {
        const { rows } = await query(
        "SELECT type, is_enabled FROM platform_integrations WHERE type IN ('azure-ad', 'google-auth') AND deleted_at IS NULL",
        [],
        30000,
        { skipTracing: true }
        )

        if (rows && Array.isArray(rows)) {
            rows.forEach((row: any) => {
                if (row.type === 'azure-ad') {
                    config.azureEnabled = row.is_enabled
                    azureConfigFound = true
                } else if (row.type === 'google-auth') {
                    config.googleEnabled = row.is_enabled
                    googleConfigFound = true
                }
            })
        }
    } catch (e) {
        console.warn('[SSO-Providers] Error querying platform_integrations:', e)
    }

    // 2. Fallback to system_settings (Legacy method) - Only if NOT found in platform_integrations
    if (!googleConfigFound || !azureConfigFound) {
         try {
            const { rows: settingsRows } = await query(
            "SELECT key, value FROM system_settings WHERE key LIKE 'sso_%'",
            [],
            30000,
            { skipTracing: true }
            )
            
            if (settingsRows && Array.isArray(settingsRows)) {
                settingsRows.forEach((row: any) => {
                    const key = row.key.replace('sso_', '')
                    // Only apply if we haven't found it yet
                    if (key === 'googleEnabled' && !googleConfigFound) {
                        try {
                             const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
                             config.googleEnabled = value === true || value === 'true'
                             googleConfigFound = true
                        } catch {
                             config.googleEnabled = row.value === 'true' || row.value === true
                             googleConfigFound = true
                        }
                    } else if (key === 'azureEnabled' && !azureConfigFound) {
                         try {
                             const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
                             config.azureEnabled = value === true || value === 'true'
                             azureConfigFound = true
                        } catch {
                             config.azureEnabled = row.value === 'true' || row.value === true
                             azureConfigFound = true
                        }
                    }
                })
            }
         } catch (e) {
             console.warn('[SSO-Providers] Error querying system_settings:', e)
         }
    }

    // 3. Fallback to Environment Variables - Only if NO configuration found in DB
    if (!googleConfigFound && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      config.googleEnabled = true
    }
    if (!azureConfigFound && process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
      config.azureEnabled = true
    }

    return NextResponse.json({
      google: config.googleEnabled,
      azure: config.azureEnabled
    })
  } catch (error: any) {
    console.error('[SSO-Providers] CRITICAL ERROR:', error)
    // Return defaults on error based on ENV only
    return NextResponse.json({
      google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      azure: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID),
      error: error.message 
    })
  }
}
