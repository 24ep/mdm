import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [ATTRIBUTES API] GET request for data model:', params.id)
    const dataModelId = params.id
    
    // Validate that dataModelId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(dataModelId)) {
      console.error('❌ [ATTRIBUTES API] Invalid UUID format:', dataModelId)
      return NextResponse.json({ 
        error: 'Invalid data model ID format',
        details: 'Data model ID must be a valid UUID'
      }, { status: 400 })
    }
    
    console.log('🔍 [ATTRIBUTES API] Fetching attributes using Prisma ORM for data_model_id:', dataModelId)
    
    // Use Prisma ORM - best practice, type-safe, handles UUIDs automatically
    try {
      const attributes = await db.attribute.findMany({
        where: {
          dataModelId: dataModelId,
          isActive: true,
          deletedAt: null
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ],
        take: 1000
      })
      
      console.log('✅ [ATTRIBUTES API] Found', attributes.length, 'attributes using Prisma ORM')
      
      // Transform to match expected API response format
      const rows = attributes.map(attr => ({
        id: attr.id,
        name: attr.name,
        display_name: attr.displayName,
        type: attr.type,
        is_required: attr.isRequired,
        is_unique: attr.isUnique,
        default_value: attr.defaultValue,
        options: attr.options,
        validation_rules: attr.validationRules,
        order_index: attr.order,
        created_at: attr.createdAt,
        updated_at: attr.updatedAt
      }))
      
      if (rows.length > 0) {
        console.log('✅ [ATTRIBUTES API] First attribute sample:', {
          id: rows[0].id,
          name: rows[0].name,
          display_name: rows[0].display_name,
          type: rows[0].type
        })
      } else {
        console.warn('⚠️ [ATTRIBUTES API] No attributes found for data model:', dataModelId)
      }
      
      const response = { 
        attributes: rows,
        count: rows.length
      }
      
      console.log('✅ [ATTRIBUTES API] Sending response')
      return NextResponse.json(response)
      
    } catch (queryError: any) {
      console.error('❌ [ATTRIBUTES API] Prisma query failed:', queryError.message)
      console.error('❌ [ATTRIBUTES API] Query error stack:', queryError.stack)
      
      // Return empty array on error
      return NextResponse.json({ 
        attributes: [],
        count: 0
      })
    }

  } catch (error) {
    console.error('❌ [ATTRIBUTES API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('❌ [ATTRIBUTES API] Error stack:', errorStack)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 })
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

    // Check if user has permission to create attributes in this space using Prisma ORM
    const dataModel = await db.dataModel.findFirst({
      where: {
        id: dataModelId,
        deletedAt: null
      },
      include: {
        spaces: {
          include: {
            space: {
              include: {
                members: {
                  where: {
                    userId: session.user.id
                  }
                },
                creator: true
              }
            }
          }
        }
      }
    })

    if (!dataModel || dataModel.spaces.length === 0) {
      return NextResponse.json({ error: 'Data model not found' }, { status: 404 })
    }

    const space = dataModel.spaces[0].space
    const userMembership = space.members[0]
    const userRole = userMembership?.role
    const isOwner = space.createdBy === session.user.id
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

    // Use Prisma ORM to create attribute - best practice, type-safe
    const attribute = await db.attribute.create({
      data: {
        dataModelId: dataModelId,
        name,
        displayName: display_name,
        type,
        description,
        isRequired: !!is_required,
        isUnique: !!is_unique,
        defaultValue: default_value,
        options: options && options.length > 0 ? options : null,
        validationRules: validation_rules ? validation_rules : null,
        order: Number(order_index) || 0,
        // Optional fields (will be null if columns don't exist - Prisma handles this)
        dataEntityModelId: data_entity_model_id || null,
        dataEntityAttributeId: data_entity_attribute_id || null,
        isAutoIncrement: !!is_auto_increment,
        autoIncrementPrefix: auto_increment_prefix || '',
        autoIncrementSuffix: auto_increment_suffix || '',
        autoIncrementStart: Number(auto_increment_start) || 1,
        autoIncrementPadding: Number(auto_increment_padding) || 3,
        currentAutoIncrementValue: Number(auto_increment_start) || 1
      }
    })
    
    // Transform to match expected API response format
    const response = {
      id: attribute.id,
      name: attribute.name,
      display_name: attribute.displayName,
      type: attribute.type,
      is_required: attribute.isRequired,
      is_unique: attribute.isUnique,
      default_value: attribute.defaultValue,
      options: attribute.options,
      validation_rules: attribute.validationRules,
      order_index: attribute.order,
      created_at: attribute.createdAt,
      updated_at: attribute.updatedAt
    }
    
    return NextResponse.json({ attribute: response }, { status: 201 })
  } catch (error) {
    console.error('Error creating attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
