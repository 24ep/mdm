import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/database'

// GET /api/spaces/[id]/layout/versions - List all versions for a space layout
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id
    const userId = session.user.id

    // Check if user has access to this space
    const accessResult = await query(
      `SELECT s.id, s.name
       FROM spaces s
       JOIN space_members sm ON s.id = sm.space_id
       WHERE s.id = $1::uuid AND sm.user_id = $2::uuid AND sm.role IN ('owner', 'admin', 'member')`,
      [spaceId, userId]
    )

    if (accessResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Get all versions for this space
    const versionsResult = await query(
      `SELECT 
        lv.id,
        lv.version_number,
        lv.layout_config,
        lv.change_description,
        lv.created_by,
        lv.created_at,
        lv.updated_at,
        lv.is_current,
        u.name as created_by_name,
        u.email as created_by_email
       FROM layout_versions lv
       LEFT JOIN users u ON lv.created_by = u.id
       WHERE lv.space_id = $1::uuid
       ORDER BY lv.version_number DESC`,
      [spaceId]
    )

    return NextResponse.json({
      versions: versionsResult.rows,
      count: versionsResult.rows.length
    })

  } catch (error) {
    console.error('Error fetching layout versions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/spaces/[id]/layout/versions - Create a new version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id
    const userId = session.user.id
    const { layoutConfig, changeDescription } = await request.json()

    if (!layoutConfig) {
      return NextResponse.json({ error: 'Layout config is required' }, { status: 400 })
    }

    // Check if user has access to this space
    const accessResult = await query(
      `SELECT s.id, s.name
       FROM spaces s
       JOIN space_members sm ON s.id = sm.space_id
       WHERE s.id = $1::uuid AND sm.user_id = $2::uuid AND sm.role IN ('owner', 'admin', 'member')`,
      [spaceId, userId]
    )

    if (accessResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Get next version number
    const versionResult = await query(
      'SELECT get_next_layout_version($1) as next_version',
      [spaceId]
    )
    const nextVersion = (versionResult.rows[0] as any).next_version

    // Mark all other versions as not current
    await query(
      'UPDATE layout_versions SET is_current = false WHERE space_id = $1::uuid',
      [spaceId]
    )

    // Create new version
    const insertResult = await query(
      `INSERT INTO layout_versions 
       (space_id, version_number, layout_config, change_description, created_by, is_current)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [spaceId, nextVersion, JSON.stringify(layoutConfig), changeDescription || `Version ${nextVersion}`, userId]
    )

    return NextResponse.json({
      version: insertResult.rows[0],
      success: true
    })

  } catch (error) {
    console.error('Error creating layout version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

