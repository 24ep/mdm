import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// Helper to extract spaceId from request
function getSpaceId(request: NextRequest): string | null {
  const searchParams = request.nextUrl.searchParams
  return searchParams.get('space_id') || request.headers.get('x-space-id')
}
import { 
  createServiceDeskJob, 
  getServiceDeskJobs, 
  getServiceDeskJob,
  updateServiceDeskJob 
} from '@/lib/servicedesk-job-queue'
import { checkServiceDeskRateLimit, getServiceDeskRateLimitConfig } from '@/lib/servicedesk-rate-limiter'

/**
 * GET - List jobs for a space
 * POST - Create a new job
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = getSpaceId(request)
    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const jobId = searchParams.get('job_id')

    if (jobId) {
      // Get specific job
      const job = await getServiceDeskJob(jobId)
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      // Check access
      if (job.spaceId !== spaceId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return NextResponse.json({ job })
    }

    // List jobs
    const jobs = await getServiceDeskJobs(spaceId, session.user.id, limit)
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('GET /integrations/manageengine-servicedesk/jobs error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const spaceId = getSpaceId(request)
    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { jobType, payload } = body

    if (!jobType || !payload) {
      return NextResponse.json(
        { error: 'jobType and payload are required' },
        { status: 400 }
      )
    }

    // Rate limiting check
    const rateLimitConfig = await getServiceDeskRateLimitConfig(spaceId)
    const rateLimitResult = await checkServiceDeskRateLimit(spaceId, session.user.id, rateLimitConfig)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: rateLimitResult.reason,
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      )
    }

    // Create job
    const jobId = await createServiceDeskJob(spaceId, session.user.id, jobType, payload)

    // Trigger job processing (async)
    if (process.env.NEXT_PUBLIC_APP_URL) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/manageengine-servicedesk/jobs/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      }).catch(err => console.error('Failed to trigger job processing:', err))
    }

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('POST /integrations/manageengine-servicedesk/jobs error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

