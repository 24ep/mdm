import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dataModelId = params.id
    // Check if the new columns exist
    let hasNewColumns = false
    try {
      await query(`
        SELECT data_entity_model_id 
        FROM public.data_model_attributes 
        LIMIT 1
      `)
      hasNewColumns = true
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
              validation as validation_rules,
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
        WHERE data_model_id = $1
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
    const dataModelId = params.id
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
      'json': 'JSON'
    }
    const type = typeMapping[data_type?.toLowerCase()] || data_type?.toUpperCase() || 'TEXT'

    // Check if the new columns exist by trying a simple query first
    let hasNewColumns = false
    try {
      await query(`
        SELECT data_entity_model_id 
        FROM public.data_model_attributes 
        LIMIT 1
      `)
      hasNewColumns = true
    } catch (error) {
      // Columns don't exist yet, use the old schema
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
