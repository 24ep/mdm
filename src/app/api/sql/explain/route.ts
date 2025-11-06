import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPlanAnalyzer } from '@/lib/query-plan'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error: any) {
    console.error('Error getting execution plan:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get execution plan', 
        details: error.message,
        hint: 'Make sure the query is valid and you have permission to execute EXPLAIN'
      },
      { status: 500 }
    )
  }
}

