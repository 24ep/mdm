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
    if (!spaceId) return NextResponse.json({ error: 'space_id is required' }, { status: 400 })

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [spaceId, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { rows } = await query(
      `SELECT * FROM public.external_connections 
       WHERE space_id = $1::uuid AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [spaceId]
    )
    return NextResponse.json({ connections: rows })
  } catch (error) {
    console.error('GET /external-connections error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { 
      space_id, name, connection_type = 'database', db_type, host, port, database, username, password, options, is_active,
      // API fields
      api_url, api_method, api_headers, api_auth_type, api_auth_token, api_auth_username, api_auth_password,
      api_auth_apikey_name, api_auth_apikey_value, api_body, api_response_path, api_pagination_type, api_pagination_config
    } = body

    if (!space_id || !name) {
      return NextResponse.json({ error: 'space_id and name are required' }, { status: 400 })
    }

    // Validate based on connection type
    if (connection_type === 'api') {
      if (!api_url) {
        return NextResponse.json({ error: 'api_url is required for API connections' }, { status: 400 })
      }
    } else {
      if (!db_type || !host) {
        return NextResponse.json({ error: 'db_type and host are required for database connections' }, { status: 400 })
      }
    }

    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [space_id, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (connection_type === 'api') {
      // Insert API connection
      const { rows } = await query(
        `INSERT INTO public.external_connections
          (space_id, name, connection_type, db_type, api_url, api_method, api_headers, api_auth_type, 
           api_auth_token, api_auth_username, api_auth_password, api_auth_apikey_name, api_auth_apikey_value,
           api_body, api_response_path, api_pagination_type, api_pagination_config, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING *`,
        [
          space_id, name, connection_type, db_type || 'api', api_url, api_method || 'GET',
          api_headers ? JSON.stringify(api_headers) : null, api_auth_type || 'none',
          api_auth_token || null, api_auth_username || null, api_auth_password || null,
          api_auth_apikey_name || null, api_auth_apikey_value || null,
          api_body || null, api_response_path || null, api_pagination_type || null,
          api_pagination_config ? JSON.stringify(api_pagination_config) : null, is_active ?? true
        ]
      )
      return NextResponse.json({ connection: rows[0] }, { status: 201 })
    } else {
      // Insert database connection
      const { rows } = await query(
        `INSERT INTO public.external_connections
          (space_id, name, connection_type, db_type, host, port, database, username, password, options, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [space_id, name, connection_type, db_type, host, port ?? null, database ?? null, username ?? null, password ?? null, options ? JSON.stringify(options) : null, is_active ?? true]
      )
      return NextResponse.json({ connection: rows[0] }, { status: 201 })
    }
  } catch (error) {
    console.error('POST /external-connections error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, space_id, ...updates } = body
    if (!id || !space_id) return NextResponse.json({ error: 'id and space_id are required' }, { status: 400 })

    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [space_id, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const fields: string[] = []
    const params: any[] = []
    let idx = 1
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${idx++}`)
      params.push(value)
    }
    params.push(id)

    const { rows } = await query(
      `UPDATE public.external_connections SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING *`,
      params
    )
    return NextResponse.json({ connection: rows[0] })
  } catch (error) {
    console.error('PUT /external-connections error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const spaceId = searchParams.get('space_id')
    if (!id || !spaceId) return NextResponse.json({ error: 'id and space_id are required' }, { status: 400 })

    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [spaceId, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await query(
      `UPDATE public.external_connections SET deleted_at = NOW()
       WHERE id = $1::uuid`,
      [id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /external-connections error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


