import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id')

    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }

    // Get relationships from data model attributes that are foreign keys
    const relationshipsSql = `
      SELECT 
        dm1.id as from_model_id,
        dm1.name as from_model_name,
        dm1.display_name as from_model_display_name,
        dma1.id as from_attribute_id,
        dma1.name as from_attribute_name,
        dma1.display_name as from_attribute_display_name,
        dm2.id as to_model_id,
        dm2.name as to_model_name,
        dm2.display_name as to_model_display_name,
        dma2.id as to_attribute_id,
        dma2.name as to_attribute_name,
        dma2.display_name as to_attribute_display_name,
        dma1.referenced_table,
        dma1.referenced_column,
        'one-to-many' as relationship_type
      FROM public.data_model_attributes dma1
      JOIN public.data_models dm1 ON dm1.id::uuid = dma1.data_model_id::uuid
      JOIN public.data_model_spaces dms1 ON dms1.data_model_id::uuid = dm1.id::uuid
      LEFT JOIN public.data_models dm2 ON LOWER(dm2.name) = LOWER(dma1.referenced_table)
      LEFT JOIN public.data_model_spaces dms2 ON dms2.data_model_id::uuid = dm2.id::uuid
      LEFT JOIN public.data_model_attributes dma2 ON dma2.data_model_id::uuid = dm2.id::uuid 
        AND (LOWER(dma2.name) = LOWER(dma1.referenced_column) OR dma2.is_primary_key = TRUE)
      WHERE dma1.is_foreign_key = TRUE 
        AND dma1.is_active = TRUE
        AND dm1.deleted_at IS NULL
        AND dms1.space_id = $1
        AND (dm2.id IS NULL OR (dm2.deleted_at IS NULL AND dms2.space_id = $1))
      ORDER BY dm1.name, dma1.name
    `

    const { rows } = await query(relationshipsSql, [spaceId])

    const relationships = rows.map((row, index) => ({
      id: `rel-${index}`,
      fromModel: row.from_model_id,
      fromModelName: row.from_model_name,
      fromModelDisplayName: row.from_model_display_name,
      fromAttribute: row.from_attribute_id,
      fromAttributeName: row.from_attribute_name,
      fromAttributeDisplayName: row.from_attribute_display_name,
      toModel: row.to_model_id,
      toModelName: row.to_model_name,
      toModelDisplayName: row.to_model_display_name,
      toAttribute: row.to_attribute_id,
      toAttributeName: row.to_attribute_name,
      toAttributeDisplayName: row.to_attribute_display_name,
      type: row.relationship_type,
      label: `${row.from_model_display_name} → ${row.to_model_display_name}`
    }))

    return NextResponse.json({ relationships })
  } catch (error) {
    console.error('Error fetching relationships:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { 
      fromModel, 
      toModel, 
      fromAttribute, 
      toAttribute, 
      type, 
      label 
    } = body

    if (!fromModel || !toModel || !fromAttribute || !toAttribute) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    // For now, we'll just return the relationship data
    // In a full implementation, you might want to store relationships in a separate table
    const relationship = {
      id: `rel-${Date.now()}`,
      fromModel,
      toModel,
      fromAttribute,
      toAttribute,
      type: type || 'one-to-many',
      label: label || ''
    }

    return NextResponse.json({ relationship }, { status: 201 })
  } catch (error) {
    console.error('Error creating relationship:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, type, label } = body

    if (!id) {
      return NextResponse.json({ error: 'Relationship ID is required' }, { status: 400 })
    }

    // For now, we'll just return the updated relationship data
    // In a full implementation, you might want to update relationships in a separate table
    const relationship = {
      id,
      type: type || 'one-to-many',
      label: label || ''
    }

    return NextResponse.json({ relationship })
  } catch (error) {
    console.error('Error updating relationship:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const relationshipId = searchParams.get('id')

    if (!relationshipId) {
      return NextResponse.json({ error: 'Relationship ID is required' }, { status: 400 })
    }

    // For now, we'll just return success
    // In a full implementation, you might want to delete relationships from a separate table
    return NextResponse.json({ message: 'Relationship deleted successfully' })
  } catch (error) {
    console.error('Error deleting relationship:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
