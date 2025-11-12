import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/database'

// GET /api/spaces/[id]/layout/versions/[versionId] - Get a specific version
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId, versionId } = await params
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

    // Get the specific version
    const versionResult = await query(
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
       WHERE lv.id = $1::uuid AND lv.space_id = $2::uuid`,
      [versionId, spaceId]
    )

    if (versionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    return NextResponse.json({
      version: versionResult.rows[0]
    })

  } catch (error) {
    console.error('Error fetching layout version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/spaces/[id]/layout/versions/[versionId] - Delete a version
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId, versionId } = await params
    const userId = session.user.id

    // Check if user has admin/owner access to this space
    const accessResult = await query(
      `SELECT s.id, s.name
       FROM spaces s
       JOIN space_members sm ON s.id = sm.space_id
       WHERE s.id = $1::uuid AND sm.user_id = $2::uuid AND sm.role IN ('owner', 'admin')`,
      [spaceId, userId]
    )

    if (accessResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or insufficient permissions' }, { status: 403 })
    }

    // Prevent deleting current version
    const versionResult = await query(
      'SELECT is_current FROM layout_versions WHERE id = $1::uuid AND space_id = $2::uuid',
      [versionId, spaceId]
    )

    if (versionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    if (versionResult.rows[0].is_current) {
      return NextResponse.json({ error: 'Cannot delete current version' }, { status: 400 })
    }

    // Delete the version
    await query(
      'DELETE FROM layout_versions WHERE id = $1::uuid AND space_id = $2::uuid',
      [versionId, spaceId]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting layout version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

