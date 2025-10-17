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

    // Get layout data for models in the space
    const layoutSql = `
      SELECT 
        dm.id,
        dm.name,
        dm.display_name,
        dm.erd_position_x,
        dm.erd_position_y
      FROM public.data_models dm
      JOIN public.data_model_spaces dms ON dms.data_model_id = dm.id
      WHERE dms.space_id = $1 
        AND dm.deleted_at IS NULL
      ORDER BY dm.name
    `

    const { rows } = await query(layoutSql, [spaceId])

    const layout = {
      models: rows.map(row => ({
        id: row.id,
        name: row.name,
        display_name: row.display_name,
        position: {
          x: row.erd_position_x || 100,
          y: row.erd_position_y || 100
        }
      })),
      relationships: [] // Relationships are derived from foreign keys
    }

    return NextResponse.json({ layout })
  } catch (error) {
    console.error('Error fetching layout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { models, relationships, space_id } = body

    if (!space_id) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }

    // Update model positions
    if (models && Array.isArray(models)) {
      for (const model of models) {
        if (model.id && model.position) {
          await query(
            `UPDATE public.data_models 
             SET erd_position_x = $1, erd_position_y = $2, updated_at = NOW()
             WHERE id = $3 AND deleted_at IS NULL`,
            [model.position.x, model.position.y, model.id]
          )
        }
      }
    }

    // Note: Relationships are currently derived from foreign keys in attributes
    // If you want to store custom relationships, you'd need a separate table

    return NextResponse.json({ message: 'Layout saved successfully' })
  } catch (error) {
    console.error('Error saving layout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
