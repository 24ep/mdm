import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Folder model doesn't exist in Prisma schema
    return NextResponse.json(
      { error: 'Folder model not implemented' },
      { status: 501 }
    )
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/folders/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Folder model doesn't exist in Prisma schema
    return NextResponse.json(
      { error: 'Folder model not implemented' },
      { status: 501 }
    )
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/folders/[id]')
