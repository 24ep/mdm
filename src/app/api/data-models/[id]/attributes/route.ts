import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dataModelId = params.id
    
    // Validate that dataModelId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(dataModelId)) {
      return NextResponse.json({ 
        error: 'Invalid data model ID format',
        details: 'Data model ID must be a valid UUID'
      }, { status: 400 })
    }
    // Check if the new columns exist by querying information_schema
    let hasNewColumns = false
    try {
      const { rows } = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'data_model_attributes' 
        AND column_name = 'data_entity_model_id'
        AND table_schema = 'public'
      `)
      hasNewColumns = rows.length > 0
    } catch (error) {
      hasNewColumns = false
    }

    let selectFields = `id,
              name,
              display_name,
              type as data_type,
              type,
              is_required,
              is_unique,
              default_value,
              validation_rules as validation_rules,
              options,
              "order" as order_index,
              created_at,
              updated_at`

    if (hasNewColumns) {
      selectFields += `,
              data_entity_model_id,
              data_entity_attribute_id,
              is_auto_increment,
              auto_increment_prefix,
              auto_increment_suffix,
              auto_increment_start,
              auto_increment_padding,
              current_auto_increment_value`
    }

    const { rows } = await query<any>(
      `SELECT ${selectFields}
         FROM public.data_model_attributes
        WHERE data_model_id = $1::text
          AND (deleted_at IS NULL OR deleted_at IS NULL)
        ORDER BY "order" ASC, created_at ASC`,
      [dataModelId]
    )

    return NextResponse.json({ 
      attributes: rows || [],
      count: rows?.length || 0
    })

  } catch (error) {
    console.error('Error in attributes API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dataModelId = params.id

    // Check if user has permission to create attributes in this space
    const spaceCheck = await query(`
      SELECT sm.role, s.created_by
      FROM data_models dm
      JOIN data_model_spaces dms ON dm.id = dms.data_model_id::uuid
      JOIN spaces s ON s.id = dms.space_id::uuid
      LEFT JOIN space_members sm ON s.id = sm.space_id AND sm.user_id = $1
      WHERE dm.id = $2
    `, [session.user.id, dataModelId])

    if (spaceCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Data model not found' }, { status: 404 })
    }

    const spaceData = spaceCheck.rows[0]
    const userRole = spaceData.role
    const isOwner = spaceData.created_by === session.user.id
    const canCreate = userRole === 'ADMIN' || userRole === 'MEMBER' || isOwner

    if (!canCreate) {
      return NextResponse.json({ error: 'Insufficient permissions to create attributes' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      display_name,
      data_type,
      description,
      is_required = false,
      is_unique = false,
      min_length = 0,
      max_length = 0,
      default_value = null,
      tooltip = null,
      validation_rules = null,
      options = [],
      order_index = 0,
      data_entity_model_id = null,
      data_entity_attribute_id = null,
      is_auto_increment = false,
      auto_increment_prefix = '',
      auto_increment_suffix = '',
      auto_increment_start = 1,
      auto_increment_padding = 3,
    } = body

    if (!name || !display_name || !data_type) {
      return NextResponse.json({ error: 'name, display_name, and data_type are required' }, { status: 400 })
    }

    // Map data_type to type for database (convert to uppercase for enum)
    const typeMapping: Record<string, string> = {
      'text': 'TEXT',
      'number': 'NUMBER', 
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'email': 'EMAIL',
      'phone': 'PHONE',
      'url': 'URL',
      'select': 'SELECT',
      'multi_select': 'MULTI_SELECT',
      'textarea': 'TEXTAREA',
      'json': 'JSON',
      'user': 'USER',
      'user_multi': 'USER_MULTI'
    }
    const type = typeMapping[data_type?.toLowerCase()] || data_type?.toUpperCase() || 'TEXT'

    // Check if the new columns exist by querying information_schema
    let hasNewColumns = false
    try {
      const { rows } = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'data_model_attributes' 
        AND column_name = 'data_entity_model_id'
        AND table_schema = 'public'
      `)
      hasNewColumns = rows.length > 0
    } catch (error) {
      hasNewColumns = false
    }

    let insertSql: string
    let values: any[]

    if (hasNewColumns) {
      // Use the new schema with all columns
      insertSql = `
        INSERT INTO public.data_model_attributes (
          data_model_id,
          name,
          display_name,
          type,
          is_required,
          is_unique,
          default_value,
          options,
          validation,
          "order",
          data_entity_model_id,
          data_entity_attribute_id,
          is_auto_increment,
          auto_increment_prefix,
          auto_increment_suffix,
          auto_increment_start,
          auto_increment_padding,
          current_auto_increment_value
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        RETURNING *
      `

      values = [
        dataModelId,
        name,
        display_name,
        type,
        !!is_required,
        !!is_unique,
        default_value,
        options && options.length > 0 ? JSON.stringify(options) : null,
        validation_rules ? JSON.stringify(validation_rules) : null,
        Number(order_index) || 0,
        data_entity_model_id,
        data_entity_attribute_id,
        !!is_auto_increment,
        auto_increment_prefix || '',
        auto_increment_suffix || '',
        Number(auto_increment_start) || 1,
        Number(auto_increment_padding) || 3,
        Number(auto_increment_start) || 1, // Initialize current value to start value
      ]
    } else {
      // Use the old schema without the new columns
      insertSql = `
        INSERT INTO public.data_model_attributes (
          data_model_id,
          name,
          display_name,
          type,
          is_required,
          is_unique,
          default_value,
          options,
          validation,
          "order"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
        RETURNING *
      `

      values = [
        dataModelId,
        name,
        display_name,
        type,
        !!is_required,
        !!is_unique,
        default_value,
        options && options.length > 0 ? JSON.stringify(options) : null,
        validation_rules ? JSON.stringify(validation_rules) : null,
        Number(order_index) || 0,
      ]
    }

    const { rows } = await query<any>(insertSql, values)
    return NextResponse.json({ attribute: rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
