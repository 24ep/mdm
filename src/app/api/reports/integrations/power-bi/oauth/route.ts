import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id')
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reports/integrations/power-bi/oauth/callback`

    // Power BI OAuth configuration
    const clientId = process.env.POWER_BI_CLIENT_ID || ''
    const tenantId = process.env.POWER_BI_TENANT_ID || ''

    if (!clientId || !tenantId) {
      return NextResponse.json({ 
        error: 'Power BI OAuth not configured. Please set POWER_BI_CLIENT_ID and POWER_BI_TENANT_ID environment variables.' 
      }, { status: 400 })
    }

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({ 
      userId: session.user.id, 
      spaceId,
      timestamp: Date.now() 
    })).toString('base64')

    // Store state in session/cookie (in production, use secure session storage)
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent('https://analysis.windows.net/powerbi/api/Report.Read.All offline_access')}&` +
      `state=${encodeURIComponent(state)}`

    return NextResponse.json({ authUrl, state })
  } catch (error) {
    console.error('Error initiating Power BI OAuth:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

