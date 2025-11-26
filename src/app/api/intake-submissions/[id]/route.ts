import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

const updateSubmissionSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CONVERTED']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const submission = await db.intakeSubmission.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            space: {
              select: { id: true, name: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check access
    const spaceMember = await db.spaceMember.findFirst({
      where: { spaceId: submission.form.spaceId, userId: session.user.id },
    })
    const isSpaceOwner = await db.space.findFirst({
      where: { id: submission.form.spaceId, createdBy: session.user.id },
    })

    if (!spaceMember && !isSpaceOwner && submission.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ submission })
  } catch (error: any) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const bodyValidation = await validateBody(request, updateSubmissionSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const existingSubmission = await db.intakeSubmission.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            space: {
              select: { id: true }
            }
          }
        }
      }
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check access (only space members/owners can update)
    const spaceMember = await db.spaceMember.findFirst({
      where: { spaceId: existingSubmission.form.spaceId, userId: session.user.id },
    })
    const isSpaceOwner = await db.space.findFirst({
      where: { id: existingSubmission.form.spaceId, createdBy: session.user.id },
    })

    if (!spaceMember && !isSpaceOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}
    if (bodyValidation.data.status !== undefined) {
      updateData.status = bodyValidation.data.status
    }

    const updatedSubmission = await db.intakeSubmission.update({
      where: { id },
      data: updateData,
      include: {
        form: true,
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    return NextResponse.json({ success: true, submission: updatedSubmission })
  } catch (error: any) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update submission' },
      { status: 500 }
    )
  }
}

