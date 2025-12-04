import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { queryPlanAnalyzer } from '@/lib/query-plan'

async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult


    const { query: sqlQuery, analyze = false } = await request.json()

    if (!sqlQuery || !sqlQuery.trim()) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 })
    }

    // Get execution plan
    const plan = await queryPlanAnalyzer.getExecutionPlan(sqlQuery.trim())

    // Analyze the plan
    const analysis = queryPlanAnalyzer.analyzePlan(plan.plan)
    const summary = queryPlanAnalyzer.getPlanSummary(plan.plan)

    return NextResponse.json({
      success: true,
      plan,
      analysis,
      summary
    })
  ,
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/sql/explain')



export const POST = withErrorHandling(postHandler, 'POST POST /api/sql\explain\route.ts')