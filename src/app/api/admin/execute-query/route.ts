import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { sqlLinter } from '@/lib/sql-linter'
import { auditLogger } from '@/lib/db-audit'
import { dataMasking } from '@/lib/data-masking'
import { queryPerformanceTracker } from '@/lib/query-performance'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let userId: string | null = null
  let userName: string | null = null
  let userEmail: string | null = null
  let userRole: string | null = null

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    userId = session.user.id
    userName = session.user.name || null
    userEmail = session.user.email || null
    userRole = session.user.role || null

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { query: sqlQuery, spaceId, skipLint, skipMasking } = await request.json()

    if (!sqlQuery || !sqlQuery.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const trimmedQuery = sqlQuery.trim()

    // SQL Linting
    let lintResult = null
    if (!skipLint) {
      lintResult = sqlLinter.lint(trimmedQuery)
      
      // Block execution if there are errors
      if (!lintResult.valid) {
        await auditLogger.log({
          userId,
          userName,
          userEmail,
          action: 'EXECUTE_QUERY',
          resourceType: 'query',
          sqlQuery: trimmedQuery,
          spaceId,
          success: false,
          errorMessage: 'Query blocked by linting rules',
          executionTime: Date.now() - startTime,
          metadata: { lintResult }
        })

        return NextResponse.json({
          success: false,
          error: 'Query validation failed',
          lintResult,
          results: [],
          columns: [],
          executionTime: Date.now() - startTime,
          status: 'error'
        }, { status: 400 })
      }
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    try {
      // Execute the query
      const result = await query(trimmedQuery)
      const executionTime = Date.now() - startTime

      // Get column names from the first row or from the query result
      const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : []

      // Apply data masking if enabled
      let maskedResults = result.rows
      if (!skipMasking) {
        const maskingContext = {
          userId,
          userRole,
          spaceId,
          environment: process.env.NODE_ENV as 'production' | 'development' | 'staging'
        }
        maskedResults = dataMasking.maskResultSet(result.rows, undefined, maskingContext)
      }

      // Audit logging
      await auditLogger.log({
        userId,
        userName,
        userEmail,
        action: 'EXECUTE_QUERY',
        resourceType: 'query',
        sqlQuery: trimmedQuery,
        spaceId,
        success: true,
        executionTime,
        rowCount: result.rows.length,
        ipAddress,
        userAgent,
        metadata: {
          columnCount: columns.length,
          lintResult: lintResult ? {
            score: lintResult.score,
            summary: lintResult.summary
          } : null
        }
      })

      // Performance tracking
      await queryPerformanceTracker.recordQueryExecution({
        query: trimmedQuery,
        executionTime,
        rowCount: result.rows.length,
        timestamp: new Date(),
        userId,
        userName,
        spaceId,
        status: 'success'
      }).catch(err => {
        console.error('Failed to record query performance:', err)
        // Don't fail the request if performance tracking fails
      })

      return NextResponse.json({
        success: true,
        results: maskedResults,
        columns,
        executionTime,
        status: 'success',
        lintResult: lintResult ? {
          score: lintResult.score,
          summary: lintResult.summary,
          issues: lintResult.issues
        } : null
      })
    } catch (dbError: any) {
      const executionTime = Date.now() - startTime
      
      // Audit logging for failed query
      await auditLogger.log({
        userId,
        userName,
        userEmail,
        action: 'EXECUTE_QUERY',
        resourceType: 'query',
        sqlQuery: trimmedQuery,
        spaceId,
        success: false,
        errorMessage: dbError.message,
        executionTime,
        ipAddress,
        userAgent
      })

      return NextResponse.json({
        success: false,
        results: [],
        columns: [],
        executionTime,
        status: 'error',
        error: dbError.message,
        lintResult: lintResult ? {
          score: lintResult.score,
          summary: lintResult.summary
        } : null
      })
    }
  } catch (error: any) {
    const executionTime = Date.now() - startTime
    
    // Audit logging for system error
    if (userId) {
      await auditLogger.log({
        userId,
        userName,
        userEmail,
        action: 'EXECUTE_QUERY',
        resourceType: 'query',
        success: false,
        errorMessage: error.message || 'Unknown error',
        executionTime
      })
    }

    console.error('Error executing query:', error)
    return NextResponse.json(
      { error: 'Failed to execute query', details: error.message },
      { status: 500 }
    )
  }
}
