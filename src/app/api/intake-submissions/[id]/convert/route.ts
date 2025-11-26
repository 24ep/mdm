import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

const convertSchema = z.object({
  spaceId: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const bodyValidation = await validateBody(request, convertSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const submission = await db.intakeSubmission.findUnique({
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

    if (!spaceMember && !isSpaceOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Extract title and description from submission data
    const submissionData = submission.data as any
    const title = bodyValidation.data.title || submissionData.title || submissionData.subject || submissionData.name || 'Ticket from Intake Form'
    const description = bodyValidation.data.description || submissionData.description || submissionData.message || JSON.stringify(submissionData, null, 2)

    // Create ticket
    const ticket = await db.ticket.create({
      data: {
        title,
        description,
        status: bodyValidation.data.status || 'BACKLOG',
        priority: bodyValidation.data.priority || 'MEDIUM',
        createdBy: session.user.id,
        spaces: {
          create: {
            spaceId: bodyValidation.data.spaceId || submission.form.spaceId,
          }
        },
        // Store submission reference in metadata
        metadata: {
          intakeSubmissionId: submission.id,
          intakeFormId: submission.formId,
          ...submissionData
        } as any
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Update submission to CONVERTED and link ticket
    await db.intakeSubmission.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        ticketId: ticket.id
      }
    })

    return NextResponse.json({
      success: true,
      ticket,
      message: 'Submission converted to ticket successfully'
    })
  } catch (error: any) {
    console.error('Error converting submission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to convert submission' },
      { status: 500 }
    )
  }
}

