import { NextRequest, NextResponse } from 'next/server'
// import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  console.log('[SSO-Providers] Starting request...')
  
  try {
    // Dynamic import to prevent init crashes
    const { query } = await import('@/lib/db')
    
    // Get SSO configuration from system_settings
    console.log('[SSO-Providers] Querying system_settings...')
    const { rows } = await query(
      "SELECT key, value FROM system_settings WHERE key LIKE 'sso_%' ORDER BY key ASC",
      [],
      30000,
      { skipTracing: true }
    )
    console.log(`[SSO-Providers] Query success, rows: ${rows?.length || 0}`)

    const config: any = {
      googleEnabled: false,
      azureEnabled: false
    }

    if (rows && Array.isArray(rows)) {
      rows.forEach((row: any) => {
        const key = row.key.replace('sso_', '')
        if (key === 'googleEnabled' || key === 'azureEnabled') {
          try {
            const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
            config[key] = value === true || value === 'true'
          } catch {
            config[key] = row.value === 'true' || row.value === true
          }
        }
      })
    }

    // Also check env vars as fallback
    if (!config.googleEnabled && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      config.googleEnabled = true
    }
    if (!config.azureEnabled && process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
      config.azureEnabled = true
    }

    console.log('[SSO-Providers] Returning config:', config)
    return NextResponse.json({
      google: config.googleEnabled,
      azure: config.azureEnabled
    })
  } catch (error: any) {
    console.error('[SSO-Providers] CRITICAL ERROR:', error)
    // Return defaults on error
    console.warn('[SSO-Providers] Returning fallback defaults due to error')
    return NextResponse.json({
      google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      azure: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID),
      error: error.message // Include error for debugging
    })
  }
}
