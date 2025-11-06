import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get SSO configuration from system_settings
    const { rows } = await query(
      "SELECT key, value FROM system_settings WHERE key LIKE 'sso_%' ORDER BY key ASC"
    )

    const config: any = {
      googleEnabled: false,
      azureEnabled: false,
      ldapEnabled: false
    }

    rows.forEach((row: any) => {
      const key = row.key.replace('sso_', '')
      if (key === 'googleEnabled' || key === 'azureEnabled' || key === 'ldapEnabled') {
        try {
          const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
          config[key] = value === true || value === 'true'
        } catch {
          config[key] = row.value === 'true' || row.value === true
        }
      }
    })

    // Also check env vars as fallback
    if (!config.googleEnabled && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      config.googleEnabled = true
    }
    if (!config.azureEnabled && process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
      config.azureEnabled = true
    }

    return NextResponse.json({
      google: config.googleEnabled,
      azure: config.azureEnabled,
      ldap: config.ldapEnabled
    })
  } catch (error) {
    console.error('Error fetching SSO providers:', error)
    // Return defaults on error
    return NextResponse.json({
      google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      azure: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID),
      ldap: false
    })
  }
}
