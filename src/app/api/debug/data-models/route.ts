import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const spaceId = searchParams.get('space_id')
    
    // Validate that spaceId is a valid UUID format if provided
    if (spaceId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(spaceId)) {
        return NextResponse.json({ 
          error: 'Invalid space ID format',
          details: 'Space ID must be a valid UUID'
        }, { status: 400 })
      }
    }
    
    const rows = await query<any>(
      `SELECT dm.id, dm.name, dm.display_name, dm.space_id FROM data_models dm
       WHERE ($1 IS NULL OR dm.space_id = $1)
       ORDER BY dm.created_at ASC`,
      [spaceId]
    )
    return NextResponse.json({ models: rows.rows })
  } catch (e) {
    console.error('debug data-models error', e)
    return NextResponse.json({ error: 'debug failed' }, { status: 500 })
  }
}


