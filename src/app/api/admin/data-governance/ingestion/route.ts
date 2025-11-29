import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
async function getHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // TODO: Load from OpenMetadata
    const pipelines: any[] = []

    return NextResponse.json({ pipelines })
  } catch (error) {
    console.error('Error loading ingestion pipelines:', error)
    return NextResponse.json(
      { error: 'Failed to load ingestion pipelines' },
      { status: 500 }
    )
  }
}





export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/data-governance/ingestion')
export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\data-governance\ingestion\route.ts')
async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\admin\data-governance\ingestion\route.ts')

    const body = await request.json()

    // TODO: Create in OpenMetadata
    const pipeline = {
      id: `pipeline_${Date.now()}`,
      ...body,
      status: 'idle',
      createdAt: new Date()
    }

    return NextResponse.json({ pipeline })
  } catch (error) {
    console.error('Error creating ingestion pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to create ingestion pipeline' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/admin/data-governance/ingestion')

