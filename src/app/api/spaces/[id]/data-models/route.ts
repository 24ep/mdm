import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let spaceId: string | undefined
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    spaceId = id

    if (spaceId === 'all') {
      // Get all data models across all spaces
      const listSql = `
        SELECT DISTINCT dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
               dm.is_active, dm.sort_order, dm.created_by,
               ARRAY_AGG(s.id) as space_ids,
               ARRAY_AGG(s.name) as space_names,
               ARRAY_AGG(s.slug) as space_slugs
        FROM public.data_models dm
        JOIN data_model_spaces dms ON dms.data_model_id::uuid = dm.id
        JOIN spaces s ON s.id = dms.space_id::uuid
        WHERE dm.deleted_at IS NULL AND s.deleted_at IS NULL
        GROUP BY dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
                 dm.is_active, dm.sort_order, dm.created_by
        ORDER BY dm.sort_order ASC, dm.created_at DESC
      `
      
      const { rows: dataModels } = await query(listSql, [])
      
      // Transform the data to match the expected format
      const transformedDataModels = dataModels.map((dm: any) => ({
        ...dm,
        spaces: dm.space_ids?.map((id: string, index: number) => ({
          space: {
            id: id,
            name: dm.space_names?.[index] || '',
            slug: dm.space_slugs?.[index] || ''
          }
        })) || []
      }))
      
      return NextResponse.json({ dataModels: transformedDataModels })
    } else {
      // Validate that spaceId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(spaceId)) {
        return NextResponse.json({ 
          error: 'Invalid space ID format',
          details: 'Space ID must be a valid UUID'
        }, { status: 400 })
      }

      // Get data models for specific space
      const listSql = `
        SELECT DISTINCT dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
               dm.is_active, dm.sort_order, dm.created_by,
               ARRAY_AGG(s.id) as space_ids,
               ARRAY_AGG(s.name) as space_names,
               ARRAY_AGG(s.slug) as space_slugs
        FROM public.data_models dm
        JOIN data_model_spaces dms ON dms.data_model_id::uuid = dm.id
        JOIN spaces s ON s.id = dms.space_id::uuid
        WHERE dm.deleted_at IS NULL AND s.deleted_at IS NULL AND dms.space_id = $1
        GROUP BY dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
                 dm.is_active, dm.sort_order, dm.created_by
        ORDER BY dm.sort_order ASC, dm.created_at DESC
      `
      
      const { rows: dataModels } = await query(listSql, [spaceId])
      
      // Transform the data to match the expected format
      const transformedDataModels = dataModels.map((dm: any) => ({
        ...dm,
        spaces: dm.space_ids?.map((id: string, index: number) => ({
          space: {
            id: id,
            name: dm.space_names?.[index] || '',
            slug: dm.space_slugs?.[index] || ''
          }
        })) || []
      }))
      
      return NextResponse.json({ dataModels: transformedDataModels })
    }
  } catch (error) {
    console.error('Error fetching data models:', error)
    console.error('SpaceId:', spaceId)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch data models',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

