import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

// Get ticket templates for a space
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

    // Get templates
    const { rows } = await query(
      `SELECT id, name, description, template_config, created_at, updated_at
       FROM servicedesk_ticket_templates
       WHERE space_id = $1::uuid AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [space_id]
    )

    return NextResponse.json({
      templates: rows
    })
  } catch (error) {
    console.error('GET /integrations/manageengine-servicedesk/templates error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create or update ticket template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { space_id, name, description, template_config, template_id } = body

    if (!space_id || !name || !template_config) {
      return NextResponse.json(
        { error: 'space_id, name, and template_config are required' },
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

    if (template_id) {
      // Update existing
      await query(
        `UPDATE servicedesk_ticket_templates SET
         name = $1,
         description = $2,
         template_config = $3::jsonb,
         updated_at = NOW()
         WHERE id = $4::uuid`,
        [name, description || null, JSON.stringify(template_config), template_id]
      )
    } else {
      // Create new
      await query(
        `INSERT INTO servicedesk_ticket_templates
         (space_id, name, description, template_config, created_at, updated_at)
         VALUES ($1::uuid, $2, $3, $4::jsonb, NOW(), NOW())`,
        [space_id, name, description || null, JSON.stringify(template_config)]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template saved successfully'
    })
  } catch (error) {
    console.error('POST /integrations/manageengine-servicedesk/templates error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const template_id = searchParams.get('template_id')
    const space_id = searchParams.get('space_id')

    if (!template_id || !space_id) {
      return NextResponse.json(
        { error: 'template_id and space_id are required' },
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
      `UPDATE servicedesk_ticket_templates SET deleted_at = NOW()
       WHERE id = $1::uuid AND space_id = $2::uuid`,
      [template_id, space_id]
    )

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /integrations/manageengine-servicedesk/templates error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

