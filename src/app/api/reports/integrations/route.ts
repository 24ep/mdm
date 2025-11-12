import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sql = `
      SELECT * FROM report_integrations
      WHERE created_by = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `

    const result = await query(sql, [session.user.id])
    return NextResponse.json({ integrations: result.rows || [] })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

