import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized'  })

    const { id } = await params

    const profile = await db.importProfile.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { createdBy: session.user.id },
          { space: { members: { some: { userId: session.user.id } } } }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        jobs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            status: true,
            progress: true,
            createdAt: true
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Import profile not found'  })

    return NextResponse.json({ profile })



export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\import-profiles\[id]\route.ts')
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized'  })

    const { id } = await params
    const body = await request.json()

    // Check if profile exists and user has access
    const existingProfile = await db.importProfile.findFirst({
      where: {
        id,
        deletedAt: null,
        createdBy: session.user.id
      }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Import profile not found or access denied'  })

    const { name, description, dataModelId, mapping, settings, spaceId } = body

    const updatedProfile = await db.importProfile.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(dataModelId && { dataModelId }),
        ...(mapping && { mapping }),
        ...(settings && { settings }),
        ...(spaceId !== undefined && { spaceId })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json({ profile: updatedProfile })



export const PUT = withErrorHandling(putHandler, 'PUT /api/src\app\api\import-profiles\[id]\route.ts')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/src\app\api\import-profiles\[id]\route.ts')

    const { id } = await params

    // Check if profile exists and user has access
    const existingProfile = await db.importProfile.findFirst({
      where: {
        id,
        deletedAt: null,
        createdBy: session.user.id
      }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Import profile not found or access denied'  })

    // Soft delete
    await db.importProfile.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ success: true })
