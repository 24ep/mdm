import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
async function getHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // TODO: Load from OpenMetadata
    const testSuites: any[] = []

    return NextResponse.json({ testSuites })
  } catch (error) {
    console.error('Error loading test suites:', error)
    return NextResponse.json(
      { error: 'Failed to load test suites' },
      { status: 500 }
    )
  }
}





export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/data-governance/test-suites')
export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\data-governance\test-suites\route.ts')
async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\admin\data-governance\test-suites\route.ts')

    const body = await request.json()

    // TODO: Create in OpenMetadata
    const testSuite = {
      id: `suite_${Date.now()}`,
      ...body,
      testCases: [],
      createdAt: new Date()
    }

    return NextResponse.json({ testSuite })
  } catch (error) {
    console.error('Error creating test suite:', error)
    return NextResponse.json(
      { error: 'Failed to create test suite' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/admin/data-governance/test-suites')

