import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

// GET: Get all spaces associated with a data model
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rows: spaces } = await query(`
      SELECT s.id, s.name, s.slug, dms.created_at
      FROM spaces s
      JOIN data_model_spaces dms ON dms.space_id = s.id
      WHERE dms.data_model_id = $1::uuid AND s.deleted_at IS NULL
      ORDER BY s.name
    `, [params.id])

    return NextResponse.json({ spaces })
  } catch (error) {
    console.error('Error fetching data model spaces:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update space associations for a data model
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { space_ids } = body

    if (!Array.isArray(space_ids)) {
      return NextResponse.json({ error: 'space_ids must be an array' }, { status: 400 })
    }

    // Check if user has access to all spaces
    if (space_ids.length > 0) {
      const placeholders = space_ids.map((_, i) => `$${i + 1}`).join(',')
      const { rows: spaceAccess } = await query(
        `SELECT space_id, role FROM space_members WHERE space_id IN (${placeholders}) AND user_id = $${space_ids.length + 1}::uuid`,
        [...space_ids, session.user.id]
      )

      if (spaceAccess.length !== space_ids.length) {
        return NextResponse.json({ error: 'Access denied to one or more spaces' }, { status: 403 })
      }
    }

    // Remove all existing associations
    await query(
      'DELETE FROM data_model_spaces WHERE data_model_id = $1::uuid',
      [params.id]
    )

    // Add new associations
    for (const spaceId of space_ids) {
      await query(
        'INSERT INTO data_model_spaces (data_model_id, space_id, created_by) VALUES ($1::uuid, $2::uuid, $3::uuid)',
        [params.id, spaceId, session.user.id]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating data model spaces:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
