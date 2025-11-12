import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query integrations from database
    const sql = `
      SELECT 
        id,
        name,
        type,
        status,
        config,
        is_enabled as "isEnabled",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM platform_integrations
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `

    const result = await query(sql)
    
    return NextResponse.json({ 
      integrations: result.rows || [] 
    })
  } catch (error: any) {
    console.error('Error fetching integrations list:', error)
    
    // If table doesn't exist, return empty array (graceful degradation)
    if (error.message?.includes('does not exist') || error.code === '42P01' || error.meta?.code === '42P01') {
      return NextResponse.json({ integrations: [] })
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch integrations',
      details: error.message 
    }, { status: 500 })
  }
}

