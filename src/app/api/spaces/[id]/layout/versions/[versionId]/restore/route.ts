import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/database'

// POST /api/spaces/[id]/layout/versions/[versionId]/restore - Restore a version as current
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = params.id
    const versionId = params.versionId
    const userId = session.user.id
    const { createNewVersion = true } = await request.json().catch(() => ({ createNewVersion: true }))

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

    // Get the version to restore
    const versionResult = await query(
      `SELECT 
        lv.id,
        lv.version_number,
        lv.layout_config,
        lv.change_description,
        lv.is_current
       FROM layout_versions lv
       WHERE lv.id = $1::uuid AND lv.space_id = $2::uuid`,
      [versionId, spaceId]
    )

    if (versionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    const versionToRestore = versionResult.rows[0] as any

    if (createNewVersion) {
      // Create a new version from the restored one (preserves history)
      // Mark all versions as not current
      await query(
        'UPDATE layout_versions SET is_current = false WHERE space_id = $1::uuid',
        [spaceId]
      )

      // Get next version number
      const nextVersionResult = await query(
        'SELECT get_next_layout_version($1) as next_version',
        [spaceId]
      )
      const nextVersion = (nextVersionResult.rows[0] as any).next_version

      // Create new version with restored config
      const insertResult = await query(
        `INSERT INTO layout_versions 
         (space_id, version_number, layout_config, change_description, created_by, is_current)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [
          spaceId,
          nextVersion,
          versionToRestore.layout_config,
          `Restored from version ${versionToRestore.version_number}`,
          userId
        ]
      )

      return NextResponse.json({
        version: insertResult.rows[0],
        restored: true
      })
    } else {
      // Just mark this version as current (overwrites current)
      await query(
        'UPDATE layout_versions SET is_current = false WHERE space_id = $1::uuid',
        [spaceId]
      )

      await query(
        'UPDATE layout_versions SET is_current = true WHERE id = $1::uuid AND space_id = $2::uuid',
        [versionId, spaceId]
      )

      return NextResponse.json({
        version: versionToRestore,
        restored: true
      })
    }

  } catch (error) {
    console.error('Error restoring layout version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

