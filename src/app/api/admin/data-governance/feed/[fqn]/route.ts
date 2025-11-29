import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ fqn: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

    const { fqn: fqnParam } = await params
    const fqn = decodeURIComponent(fqnParam)

    // TODO: Load from OpenMetadata
    const threads: any[] = []

    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Error loading feed:', error)
    return NextResponse.json(
      { error: 'Failed to load activity feed' },
      { status: 500 }
    )
  }
}



export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\data-governance\feed\[fqn]\route.ts')
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ fqn: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\admin\data-governance\feed\[fqn]\route.ts')

    const { fqn: fqnParam } = await params
    const fqn = decodeURIComponent(fqnParam)
    const body = await request.json()

    // TODO: Create thread in OpenMetadata
    const thread = {
      id: `thread_${Date.now()}`,
      ...body,
      createdBy: {
        id: session.user.id,
        name: session.user.name || session.user.email || 'Unknown',
        displayName: session.user.name
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      posts: [],
      resolved: false
    }

    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
}

