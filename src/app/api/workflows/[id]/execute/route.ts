import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeWorkflow } from '@/lib/workflow-executor'

export const runtime = 'nodejs' // Required for workflow-executor (uses fs, path, os, url modules)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workflowId = params.id

    // Execute workflow using the executor
    const result = await executeWorkflow(workflowId)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Workflow execution failed' 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Workflow executed successfully',
      execution_id: result.execution_id,
      records_processed: result.records_processed,
      records_updated: result.records_updated
    })

  } catch (error) {
    console.error('Error executing workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
