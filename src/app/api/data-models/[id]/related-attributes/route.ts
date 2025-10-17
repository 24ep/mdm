import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const dataModelId = params.id

    // Get all related data models and their attributes
    const { data: relations, error: relationsError } = await supabase
      .from('data_model_relations')
      .select(`
        id,
        related_data_model_id,
        relation_type,
        related_data_model:related_data_model_id (
          id,
          name,
          display_name
        )
      `)
      .eq('data_model_id', dataModelId)

    if (relationsError) {
      console.error('Error fetching relations:', relationsError)
      return NextResponse.json({ error: 'Failed to fetch relations' }, { status: 500 })
    }

    if (!relations || relations.length === 0) {
      return NextResponse.json({ 
        relatedAttributes: [],
        count: 0
      })
    }

    // Get attributes for all related data models
    const relatedModelIds = relations.map(r => r.related_data_model_id)
    const { data: relatedAttributes, error: attributesError } = await supabase
      .from('data_model_attributes')
      .select(`
        id,
        name,
        display_name,
        data_type,
        is_required,
        is_unique,
        default_value,
        validation_rules,
        options,
        order_index,
        data_model_id,
        created_at,
        updated_at
      `)
      .in('data_model_id', relatedModelIds)
      .order('order_index', { ascending: true })

    if (attributesError) {
      console.error('Error fetching related attributes:', attributesError)
      return NextResponse.json({ error: 'Failed to fetch related attributes' }, { status: 500 })
    }

    // Add related model information to each attribute
    const attributesWithModel = (relatedAttributes || []).map(attr => {
      const relation = relations.find(r => r.related_data_model_id === attr.data_model_id)
      return {
        ...attr,
        related_model: relation?.related_data_model?.display_name || relation?.related_data_model?.name,
        relation_type: relation?.relation_type
      }
    })

    return NextResponse.json({ 
      relatedAttributes: attributesWithModel,
      count: attributesWithModel.length
    })

  } catch (error) {
    console.error('Error in related attributes API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
