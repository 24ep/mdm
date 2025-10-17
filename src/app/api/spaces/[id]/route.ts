import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

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

    // Get space details with member information
    const space = await query(`
      SELECT 
        s.id, s.name, s.description, s.is_default, s.is_active, s.created_by, s.created_at, s.updated_at, s.deleted_at, s.slug,
        s.icon, s.logo_url, s.features,
        u.name as created_by_name,
        sm.role as user_role
      FROM spaces s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN space_members sm ON s.id = sm.space_id AND sm.user_id = $2
      WHERE s.id = $1 AND s.deleted_at IS NULL
    `, [spaceId, session.user.id])

    if (space.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    const spaceData = space.rows[0]

    // Check if user has access to this space
    if (!spaceData.user_role) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get space members
    const members = await query(`
      SELECT 
        sm.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_system_role
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1
      ORDER BY sm.role DESC, u.name ASC
    `, [spaceId])

    return NextResponse.json({
      space: spaceData,
      members: members.rows
    })
  } catch (error) {
    console.error('Error fetching space:', error)
    return NextResponse.json(
      { error: 'Failed to fetch space' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id
    const body = await request.json()
    const { name, description, is_default, slug, icon, logo_url, features, sidebar_config } = body
    const iconProvided = Object.prototype.hasOwnProperty.call(body, 'icon')
    const logoProvided = Object.prototype.hasOwnProperty.call(body, 'logo_url')
    const featuresProvided = Object.prototype.hasOwnProperty.call(body, 'features')
    const sidebarProvided = Object.prototype.hasOwnProperty.call(body, 'sidebar_config')

    // Check if user has permission to update this space
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update the space
    const result = await query(`
      UPDATE spaces 
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        is_default = COALESCE($4, is_default),
        slug = COALESCE($5, slug),
        icon = CASE WHEN $8 THEN $6 ELSE icon END,
        logo_url = CASE WHEN $9 THEN $7 ELSE logo_url END,
        features = CASE WHEN $10 THEN COALESCE($11, features) ELSE features END,
        sidebar_config = CASE WHEN $12 THEN COALESCE($13, sidebar_config) ELSE sidebar_config END,
        updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, [spaceId, name?.trim(), description?.trim(), is_default, slug?.trim(), icon ?? null, logo_url ?? null, iconProvided, logoProvided, featuresProvided, features ?? null, sidebarProvided, sidebar_config ?? null])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    return NextResponse.json({
      space: result.rows[0],
      message: 'Space updated successfully'
    })
  } catch (error) {
    console.error('Error updating space:', error)
    return NextResponse.json(
      { error: 'Failed to update space' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id

    // Check if user is owner of this space
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'owner') {
      return NextResponse.json({ error: 'Only space owners can delete spaces' }, { status: 403 })
    }

    // Check if this is the default space
    const spaceCheck = await query(`
      SELECT is_default FROM spaces WHERE id = $1
    `, [spaceId])

    if (spaceCheck.rows[0]?.is_default) {
      return NextResponse.json({ error: 'Cannot delete default space' }, { status: 400 })
    }

    // Soft delete the space
    await query(`
      UPDATE spaces 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [spaceId])

    return NextResponse.json({
      message: 'Space deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting space:', error)
    return NextResponse.json(
      { error: 'Failed to delete space' },
      { status: 500 }
    )
  }
}
