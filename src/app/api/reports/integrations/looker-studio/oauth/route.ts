import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('space_id')
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reports/integrations/looker-studio/oauth/callback`

  // Google OAuth configuration for Looker Studio
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''

  if (!clientId) {
    return NextResponse.json({ 
      error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable.' 
    }, { status: 400 })
  }

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({ 
      userId: session.user.id, 
      spaceId,
      timestamp: Date.now() 
    })).toString('base64')

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/bigquery.readonly https://www.googleapis.com/auth/cloud-platform.read-only')}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`

  return NextResponse.json({ authUrl, state })
}

export const GET = withErrorHandling(getHandler, 'GET /api/reports/integrations/looker-studio/oauth')










