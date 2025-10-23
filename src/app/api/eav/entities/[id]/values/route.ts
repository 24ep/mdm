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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get all values for this entity
    const { rows } = await query(`
      SELECT 
        ev.*,
        ea.name as attribute_name,
        ea.display_name as attribute_display_name,
        ea.data_type,
        ea.is_required,
        ea.is_unique,
        ea.cardinality,
        ea.scope,
        ag.name as attribute_group_name,
        ag.display_name as attribute_group_display_name
      FROM public.eav_values ev
      LEFT JOIN public.eav_attributes ea ON ea.id = ev.attribute_id
      LEFT JOIN public.attribute_groups ag ON ag.id = ea.attribute_group_id
      WHERE ev.entity_id = $1
      ORDER BY ea.sort_order ASC, ea.name ASC
    `, [id])

    return NextResponse.json({ 
      values: rows,
      count: rows.length 
    })

  } catch (error) {
    console.error('Error fetching entity values:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { values } = body

    if (!Array.isArray(values)) {
      return NextResponse.json({ error: 'Values must be an array' }, { status: 400 })
    }

    // Check if entity exists
    const { rows: entity } = await query(
      'SELECT id FROM public.eav_entities WHERE id = $1 AND is_active = TRUE',
      [id]
    )

    if (entity.length === 0) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Insert or update values
    const results = []
    for (const value of values) {
      if (!value.attributeId) {
        continue
      }

      const { rows } = await query(`
        INSERT INTO public.eav_values (
          entity_id, attribute_id, text_value, number_value, boolean_value,
          date_value, datetime_value, json_value, blob_value
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (entity_id, attribute_id) 
        DO UPDATE SET
          text_value = EXCLUDED.text_value,
          number_value = EXCLUDED.number_value,
          boolean_value = EXCLUDED.boolean_value,
          date_value = EXCLUDED.date_value,
          datetime_value = EXCLUDED.datetime_value,
          json_value = EXCLUDED.json_value,
          blob_value = EXCLUDED.blob_value,
          updated_at = NOW()
        RETURNING *
      `, [
        id,
        value.attributeId,
        value.textValue || null,
        value.numberValue || null,
        value.booleanValue || null,
        value.dateValue || null,
        value.datetimeValue || null,
        value.jsonValue ? JSON.stringify(value.jsonValue) : null,
        value.blobValue || null
      ])

      results.push(rows[0])
    }

    return NextResponse.json({ 
      values: results,
      count: results.length 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating/updating entity values:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { values } = body

    if (!Array.isArray(values)) {
      return NextResponse.json({ error: 'Values must be an array' }, { status: 400 })
    }

    // Check if entity exists
    const { rows: entity } = await query(
      'SELECT id FROM public.eav_entities WHERE id = $1 AND is_active = TRUE',
      [id]
    )

    if (entity.length === 0) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Update values
    const results = []
    for (const value of values) {
      if (!value.attributeId) {
        continue
      }

      const { rows } = await query(`
        UPDATE public.eav_values SET
          text_value = $3,
          number_value = $4,
          boolean_value = $5,
          date_value = $6,
          datetime_value = $7,
          json_value = $8,
          blob_value = $9,
          updated_at = NOW()
        WHERE entity_id = $1 AND attribute_id = $2
        RETURNING *
      `, [
        id,
        value.attributeId,
        value.textValue || null,
        value.numberValue || null,
        value.booleanValue || null,
        value.dateValue || null,
        value.datetimeValue || null,
        value.jsonValue ? JSON.stringify(value.jsonValue) : null,
        value.blobValue || null
      ])

      if (rows.length > 0) {
        results.push(rows[0])
      }
    }

    return NextResponse.json({ 
      values: results,
      count: results.length 
    })

  } catch (error) {
    console.error('Error updating entity values:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
