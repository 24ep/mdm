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
      'SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { rows } = await query(
      `SELECT * FROM public.external_connections 
       WHERE space_id = $1 AND deleted_at IS NULL
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
    const { space_id, name, db_type, host, port, database, username, password, options, is_active } = body

    if (!space_id || !name || !db_type || !host) {
      return NextResponse.json({ error: 'space_id, name, db_type, host are required' }, { status: 400 })
    }

    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2',
      [space_id, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { rows } = await query(
      `INSERT INTO public.external_connections
        (space_id, name, db_type, host, port, database, username, password, options, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [space_id, name, db_type, host, port ?? null, database ?? null, username ?? null, password ?? null, options ?? null, is_active ?? true]
    )
    return NextResponse.json({ connection: rows[0] }, { status: 201 })
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
      'SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2',
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
      'SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await query(
      `UPDATE public.external_connections SET deleted_at = NOW()
       WHERE id = $1`,
      [id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /external-connections error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


