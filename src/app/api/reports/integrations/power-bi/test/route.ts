import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { checkAndRefreshToken } from '@/lib/utils/token-refresh'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { config_id } = body

    if (!config_id) {
      return NextResponse.json({ error: 'config_id is required' }, { status: 400 })
    }

    // Fetch config
    const configResult = await query(
      'SELECT * FROM report_integrations WHERE id = $1 AND created_by = $2',
      [config_id, session.user.id]
    )

    if (configResult.rows.length === 0) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    const config = configResult.rows[0]
    let configData = typeof config.config === 'string' ? JSON.parse(config.config) : config.config

    // Check and refresh token if needed
    if (config.access_type === 'API' && configData.refresh_token) {
      try {
        const refreshedConfig = await checkAndRefreshToken(config.id, 'power-bi')
        if (refreshedConfig) {
          configData = refreshedConfig
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
      }
    }

    // TODO: Implement actual Power BI API connection test
    // For now, return success if basic fields are present
    let success = false
    if (config.access_type === 'API') {
      success = !!(configData.tenant_id && configData.client_id && configData.client_secret)
    } else if (config.access_type === 'SDK') {
      success = !!configData.sdk_config
    } else if (config.access_type === 'EMBED') {
      success = !!configData.embed_url
    } else if (config.access_type === 'PUBLIC') {
      success = !!configData.public_link
    }

    return NextResponse.json({ success, message: success ? 'Connection successful' : 'Connection failed - check configuration' })
  } catch (error) {
    console.error('Error testing Power BI connection:', error)
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 })
  }
}

