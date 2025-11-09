import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { config_id } = body

    if (!config_id) {
      return NextResponse.json({ error: 'config_id is required' }, { status: 400 })
    }

    const configResult = await query<any>(
      'SELECT * FROM report_integrations WHERE id = $1 AND created_by = $2',
      [config_id, session.user.id]
    )

    if (configResult.rows.length === 0) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    const config = configResult.rows[0]
    const configData = typeof config.config === 'string' ? JSON.parse(config.config) : config.config

    // TODO: Implement actual Grafana API connection test
    let success = false
    if (config.access_type === 'SDK') {
      success = !!(configData.api_url && configData.api_key)
    } else if (config.access_type === 'EMBED') {
      success = !!configData.embed_url
    } else if (config.access_type === 'PUBLIC') {
      success = !!configData.public_link
    }

    return NextResponse.json({ success, message: success ? 'Connection successful' : 'Connection failed' })
  } catch (error) {
    console.error('Error testing Grafana connection:', error)
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 })
  }
}

