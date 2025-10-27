import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dataModelId = params.id

    // Get all related data models and their attributes using Prisma
    const relations = await db.dataModelRelation.findMany({
      where: { dataModelId: dataModelId },
      include: {
        relatedDataModel: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    })

    if (!relations || relations.length === 0) {
      return NextResponse.json({ 
        relatedAttributes: [],
        count: 0
      })
    }

    // Get attributes for all related data models using Prisma
    const relatedModelIds = relations.map(r => r.relatedDataModelId)
    const relatedAttributes = await db.dataModelAttribute.findMany({
      where: { dataModelId: { in: relatedModelIds } },
      orderBy: { orderIndex: 'asc' }
    })

    // Add related model information to each attribute
    const attributesWithModel = relatedAttributes.map(attr => {
      const relation = relations.find(r => r.relatedDataModelId === attr.dataModelId)
      return {
        id: attr.id,
        name: attr.name,
        display_name: attr.displayName,
        data_type: attr.dataType,
        is_required: attr.isRequired,
        is_unique: attr.isUnique,
        default_value: attr.defaultValue,
        validation_rules: attr.validationRules,
        options: attr.options,
        order_index: attr.orderIndex,
        data_model_id: attr.dataModelId,
        created_at: attr.createdAt,
        updated_at: attr.updatedAt,
        related_model: relation?.relatedDataModel?.displayName || relation?.relatedDataModel?.name,
        relation_type: relation?.relationType
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
