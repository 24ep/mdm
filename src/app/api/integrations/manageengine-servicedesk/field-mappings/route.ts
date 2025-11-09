import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

// Get field mappings for a space
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const space_id = searchParams.get('space_id')

    if (!space_id) {
      return NextResponse.json({ error: 'space_id is required' }, { status: 400 })
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [space_id, session.user.id]
    )
    if (access.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get field mappings
    const { rows } = await query(
      `SELECT id, mapping_name, mappings, is_default, created_at, updated_at
       FROM servicedesk_field_mappings
       WHERE space_id = $1::uuid AND deleted_at IS NULL
       ORDER BY is_default DESC, created_at DESC`,
      [space_id]
    )

    return NextResponse.json({
      mappings: rows
    })
  } catch (error) {
    console.error('GET /integrations/manageengine-servicedesk/field-mappings error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create or update field mapping
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { space_id, mapping_name, mappings, is_default, mapping_id } = body

    if (!space_id || !mapping_name || !mappings) {
      return NextResponse.json(
        { error: 'space_id, mapping_name, and mappings are required' },
        { status: 400 }
      )
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [space_id, session.user.id]
    )
    if (access.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await query(
        `UPDATE servicedesk_field_mappings SET is_default = false
         WHERE space_id = $1::uuid AND deleted_at IS NULL`,
        [space_id]
      )
    }

    if (mapping_id) {
      // Update existing
      await query(
        `UPDATE servicedesk_field_mappings SET
         mapping_name = $1,
         mappings = $2::jsonb,
         is_default = $3,
         updated_at = NOW()
         WHERE id = $4::uuid`,
        [mapping_name, JSON.stringify(mappings), is_default || false, mapping_id]
      )
    } else {
      // Create new
      await query(
        `INSERT INTO servicedesk_field_mappings
         (space_id, mapping_name, mappings, is_default, created_at, updated_at)
         VALUES ($1::uuid, $2, $3::jsonb, $4, NOW(), NOW())`,
        [space_id, mapping_name, JSON.stringify(mappings), is_default || false]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Field mapping saved successfully'
    })
  } catch (error) {
    console.error('POST /integrations/manageengine-servicedesk/field-mappings error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete field mapping
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mapping_id = searchParams.get('mapping_id')
    const space_id = searchParams.get('space_id')

    if (!mapping_id || !space_id) {
      return NextResponse.json(
        { error: 'mapping_id and space_id are required' },
        { status: 400 }
      )
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [space_id, session.user.id]
    )
    if (access.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await query(
      `UPDATE servicedesk_field_mappings SET deleted_at = NOW()
       WHERE id = $1::uuid AND space_id = $2::uuid`,
      [mapping_id, space_id]
    )

    return NextResponse.json({
      success: true,
      message: 'Field mapping deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /integrations/manageengine-servicedesk/field-mappings error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

