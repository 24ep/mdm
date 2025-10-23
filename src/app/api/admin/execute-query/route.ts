import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { query: sqlQuery, spaceId } = await request.json()

    if (!sqlQuery || !sqlQuery.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const startTime = Date.now()
    
    try {
      // Execute the query
      const result = await query(sqlQuery.trim())
      const executionTime = Date.now() - startTime

      // Get column names from the first row or from the query result
      const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : []

      return NextResponse.json({
        results: result.rows,
        columns,
        executionTime,
        status: 'success'
      })
    } catch (dbError: any) {
      const executionTime = Date.now() - startTime
      return NextResponse.json({
        results: [],
        columns: [],
        executionTime,
        status: 'error',
        error: dbError.message
      })
    }
  } catch (error) {
    console.error('Error executing query:', error)
    return NextResponse.json(
      { error: 'Failed to execute query' },
      { status: 500 }
    )
  }
}
