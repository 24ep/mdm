import { query } from '@/lib/db'

export async function refreshPowerBIToken(integrationId: string) {
  try {
    // Get integration config
    const result = await query(
      'SELECT config FROM report_integrations WHERE id = $1',
      [integrationId]
    )

    if (result.rows.length === 0) {
      throw new Error('Integration not found')
    }

    const config = typeof result.rows[0].config === 'string' 
      ? JSON.parse(result.rows[0].config) 
      : result.rows[0].config

    if (!config.refresh_token) {
      throw new Error('No refresh token available')
    }

    // Get tenant ID from config or env
    const tenantId = config.tenant_id || process.env.POWER_BI_TENANT_ID
    const clientId = process.env.POWER_BI_CLIENT_ID
    const clientSecret = process.env.POWER_BI_CLIENT_SECRET

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Power BI OAuth not configured')
    }

    // Refresh token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: config.refresh_token,
        grant_type: 'refresh_token',
        scope: 'https://analysis.windows.net/powerbi/api/Report.Read.All offline_access'
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh token')
    }

    const tokens = await tokenResponse.json()

    // Update config
    const updatedConfig = {
      ...config,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || config.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
    }

    await query(
      'UPDATE report_integrations SET config = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedConfig), integrationId]
    )

    return updatedConfig
  } catch (error) {
    console.error('Error refreshing Power BI token:', error)
    throw error
  }
}

export async function refreshLookerStudioToken(integrationId: string) {
  try {
    // Get integration config
    const result = await query(
      'SELECT config FROM report_integrations WHERE id = $1',
      [integrationId]
    )

    if (result.rows.length === 0) {
      throw new Error('Integration not found')
    }

    const config = typeof result.rows[0].config === 'string' 
      ? JSON.parse(result.rows[0].config) 
      : result.rows[0].config

    if (!config.refresh_token) {
      throw new Error('No refresh token available')
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth not configured')
    }

    // Refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: config.refresh_token,
        grant_type: 'refresh_token'
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh token')
    }

    const tokens = await tokenResponse.json()

    // Update config
    const updatedConfig = {
      ...config,
      access_token: tokens.access_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
    }

    await query(
      'UPDATE report_integrations SET config = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedConfig), integrationId]
    )

    return updatedConfig
  } catch (error) {
    console.error('Error refreshing Looker Studio token:', error)
    throw error
  }
}

export async function checkAndRefreshToken(integrationId: string, source: string) {
  try {
    const result = await query(
      'SELECT config FROM report_integrations WHERE id = $1',
      [integrationId]
    )

    if (result.rows.length === 0) return null

    const config = typeof result.rows[0].config === 'string' 
      ? JSON.parse(result.rows[0].config) 
      : result.rows[0].config

    // Check if token is expired or will expire in next 5 minutes
    if (config.expires_at && config.expires_at < Date.now() + 5 * 60 * 1000) {
      if (source === 'power-bi') {
        return await refreshPowerBIToken(integrationId)
      } else if (source === 'looker-studio') {
        return await refreshLookerStudioToken(integrationId)
      }
    }

    return config
  } catch (error) {
    console.error('Error checking token:', error)
    return null
  }
}

