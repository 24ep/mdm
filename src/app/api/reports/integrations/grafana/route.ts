import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id')

    const sql = `
      SELECT * FROM report_integrations
      WHERE source = 'grafana' 
        AND created_by = $1 
        AND deleted_at IS NULL
        ${spaceId ? 'AND space_id = $2' : ''}
      ORDER BY created_at DESC
    `

    const params = spaceId ? [session.user.id, spaceId] : [session.user.id]
    const result = await query<any>(sql, params)
    
    return NextResponse.json({ configs: result.rows || [] })
  } catch (error) {
    console.error('Error fetching Grafana configs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      name,
      access_type,
      api_url,
      api_key,
      embed_url,
      public_link,
      is_active,
      space_id
    } = body

    if (!name || !access_type) {
      return NextResponse.json({ error: 'Name and access_type are required' }, { status: 400 })
    }

    const config = {
      api_url,
      api_key,
      embed_url,
      public_link
    }

    const sql = `
      INSERT INTO report_integrations (
        name, source, access_type, config, is_active, space_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const result = await query<any>(sql, [
      name,
      'grafana',
      access_type,
      JSON.stringify(config),
      is_active !== false,
      space_id || null,
      session.user.id
    ])

    return NextResponse.json({ config: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating Grafana config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      id,
      name,
      access_type,
      api_url,
      api_key,
      embed_url,
      public_link,
      is_active
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const config = {
      api_url,
      api_key,
      embed_url,
      public_link
    }

    const sql = `
      UPDATE report_integrations
      SET name = $1, access_type = $2, config = $3, is_active = $4, updated_at = NOW()
      WHERE id = $5 AND created_by = $6
      RETURNING *
    `

    const result = await query<any>(sql, [
      name,
      access_type,
      JSON.stringify(config),
      is_active !== false,
      id,
      session.user.id
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    return NextResponse.json({ config: result.rows[0] })
  } catch (error) {
    console.error('Error updating Grafana config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

