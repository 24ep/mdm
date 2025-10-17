import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const spaceId = searchParams.get('space_id')
    const rows = await query<any>(
      `SELECT dm.id, dm.name, dm.display_name, dm.space_id FROM data_models dm
       WHERE ($1::uuid IS NULL OR dm.space_id = $1)
       ORDER BY dm.created_at ASC`,
      [spaceId]
    )
    return NextResponse.json({ models: rows.rows })
  } catch (e) {
    console.error('debug data-models error', e)
    return NextResponse.json({ error: 'debug failed' }, { status: 500 })
  }
}


