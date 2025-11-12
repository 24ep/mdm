import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const { id } = await params

    const attachments = await db.ticketAttachment.findMany({
      where: {
        ticketId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(createSuccessResponse({ attachments }))
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(createErrorResponse('File is required', 'VALIDATION_ERROR'), { status: 400 })
    }

    // Check if ticket exists
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!ticket || ticket.deletedAt) {
      return NextResponse.json(createErrorResponse('Ticket not found', 'NOT_FOUND'), { status: 404 })
    }

    // Note: Tickets use local file system storage instead of AttachmentStorageService
    // because tickets may not be associated with a space, and local storage is simpler
    // for ticket-specific attachments. This is an intentional design decision.

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'tickets', id)
    await mkdir(uploadsDir, { recursive: true })
    
    // Save file
    const filePath = join(uploadsDir, uniqueFileName)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, fileBuffer)

    // Save attachment record
    const attachment = await db.ticketAttachment.create({
      data: {
        ticketId: id,
        fileName: file.name,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: session.user.id
      }
    })

    return NextResponse.json(createSuccessResponse({ attachment }), { status: 201 })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachmentId')

    if (!attachmentId) {
      return NextResponse.json(createErrorResponse('attachmentId is required', 'VALIDATION_ERROR'), { status: 400 })
    }

    const attachment = await db.ticketAttachment.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment || attachment.ticketId !== id) {
      return NextResponse.json(createErrorResponse('Attachment not found', 'NOT_FOUND'), { status: 404 })
    }

    // Only allow deletion by uploader or ticket owner
    const ticket = await db.ticket.findUnique({
      where: { id }
    })

    if (attachment.uploadedBy !== session.user.id && ticket?.createdBy !== session.user.id) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'FORBIDDEN'), { status: 403 })
    }

    await db.ticketAttachment.delete({
      where: { id: attachmentId }
    })

    return NextResponse.json(createSuccessResponse({ deleted: true }))
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}

