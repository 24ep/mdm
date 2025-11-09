import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/signin?error=Unauthorized', request.url))
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/reports/integrations?source=power-bi&error=${error}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/reports/integrations?source=power-bi&error=missing_params', request.url))
    }

    // Decode state
    let stateData: any
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(new URL('/reports/integrations?source=power-bi&error=invalid_state', request.url))
    }

    // Exchange code for tokens
    const clientId = process.env.POWER_BI_CLIENT_ID || ''
    const clientSecret = process.env.POWER_BI_CLIENT_SECRET || ''
    const tenantId = process.env.POWER_BI_TENANT_ID || ''
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reports/integrations/power-bi/oauth/callback`

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'https://analysis.windows.net/powerbi/api/Report.Read.All offline_access'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/reports/integrations?source=power-bi&error=token_exchange_failed', request.url))
    }

    const tokens = await tokenResponse.json()

    // Save tokens to integration config
    const config = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      tenant_id: tenantId
    }

    // Check if integration exists
    const existing = await query(
      'SELECT * FROM report_integrations WHERE source = $1 AND created_by = $2 AND space_id = $3 AND deleted_at IS NULL',
      ['power-bi', session.user.id, stateData.spaceId || null]
    )

    if (existing.rows.length > 0) {
      // Update existing
      await query(
        'UPDATE report_integrations SET config = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(config), existing.rows[0].id]
      )
    } else {
      // Create new
      await query(
        'INSERT INTO report_integrations (name, source, access_type, config, is_active, space_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['Power BI OAuth', 'power-bi', 'API', JSON.stringify(config), true, stateData.spaceId || null, session.user.id]
      )
    }

    return NextResponse.redirect(new URL('/reports/integrations?source=power-bi&success=connected', request.url))
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.redirect(new URL('/reports/integrations?source=power-bi&error=callback_failed', request.url))
  }
}

