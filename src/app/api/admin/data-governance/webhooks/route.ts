import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
async function getHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // TODO: Load from OpenMetadata
    const webhooks: any[] = []

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error('Error loading webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to load webhooks' },
      { status: 500 }
    )
  }
}





export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/data-governance/webhooks')
export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\data-governance\webhooks\route.ts')
async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\admin\data-governance\webhooks\route.ts')

    const body = await request.json()

    // TODO: Create in OpenMetadata
    const webhook = {
      id: `webhook_${Date.now()}`,
      ...body,
      status: 'active',
      successCount: 0,
      failureCount: 0,
      createdAt: new Date()
    }

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/admin/data-governance/webhooks')

