import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

const updateIntakeFormSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  formFields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'textarea', 'select', 'number', 'date', 'checkbox', 'user', 'email', 'url', 'file']),
    required: z.boolean().optional().default(false),
    options: z.array(z.string()).optional(),
    placeholder: z.string().optional(),
    validation: z.record(z.string(), z.any()).optional(),
  })).optional(),
  workflow: z.record(z.string(), z.any()).optional().nullable(),
  isActive: z.boolean().optional(),
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

    const form = await db.intakeForm.findUnique({
      where: { id },
      include: {
        space: {
          select: { id: true, name: true }
        },
        _count: {
          select: { submissions: true }
        }
      }
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

    return NextResponse.json({ form })
  } catch (error: any) {
    console.error('Error fetching intake form:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch intake form' },
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
    const bodyValidation = await validateBody(request, updateIntakeFormSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { name, description, formFields, workflow, isActive } = bodyValidation.data

    const existingForm = await db.intakeForm.findUnique({
      where: { id },
      include: { space: { select: { id: true } } }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
    }

    // Check access
    const spaceMember = await db.spaceMember.findFirst({
      where: { spaceId: existingForm.spaceId, userId: session.user.id },
    })
    const isSpaceOwner = await db.space.findFirst({
      where: { id: existingForm.spaceId, createdBy: session.user.id },
    })

    if (!spaceMember && !isSpaceOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (formFields !== undefined) updateData.formFields = formFields as any
    if (workflow !== undefined) updateData.workflow = workflow as any
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedForm = await db.intakeForm.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })

    return NextResponse.json({ success: true, form: updatedForm })
  } catch (error: any) {
    console.error('Error updating intake form:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update intake form' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingForm = await db.intakeForm.findUnique({
      where: { id },
      include: { space: { select: { id: true } } }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
    }

    // Check access
    const spaceMember = await db.spaceMember.findFirst({
      where: { spaceId: existingForm.spaceId, userId: session.user.id },
    })
    const isSpaceOwner = await db.space.findFirst({
      where: { id: existingForm.spaceId, createdBy: session.user.id },
    })

    if (!spaceMember && !isSpaceOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.intakeForm.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Intake form deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting intake form:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete intake form' },
      { status: 500 }
    )
  }
}

