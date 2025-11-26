import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

const submissionSchema = z.object({
  data: z.record(z.any()),
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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const form = await db.intakeForm.findUnique({
      where: { id },
      select: { spaceId: true }
    })

    if (!form) {
      return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
    }

    // Check access
    const spaceMember = await db.spaceMember.findFirst({
      where: { spaceId: form.spaceId, userId: session.user.id },
    })
    const isSpaceOwner = await db.space.findFirst({
      where: { id: form.spaceId, createdBy: session.user.id },
    })

    if (!spaceMember && !isSpaceOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where: any = { formId: id }
    if (status) {
      where.status = status
    }

    const submissions = await db.intakeSubmission.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ submissions })
  } catch (error: any) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

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
    const bodyValidation = await validateBody(request, submissionSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const form = await db.intakeForm.findUnique({
      where: { id, isActive: true }
    })

    if (!form) {
      return NextResponse.json({ error: 'Intake form not found or inactive' }, { status: 404 })
    }

    const submission = await db.intakeSubmission.create({
      data: {
        formId: id,
        userId: session.user.id,
        data: bodyValidation.data.data as any,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    return NextResponse.json({ success: true, submission }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create submission' },
      { status: 500 }
    )
  }
}

