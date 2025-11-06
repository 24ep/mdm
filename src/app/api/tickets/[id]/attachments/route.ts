import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachments = await db.ticketAttachment.findMany({
      where: {
        ticketId: params.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Check if ticket exists
    const ticket = await db.ticket.findUnique({
      where: { id: params.id },
      include: { spaces: true }
    })

    if (!ticket || ticket.deletedAt) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'tickets', params.id)
    await mkdir(uploadsDir, { recursive: true })
    
    // Save file
    const filePath = join(uploadsDir, uniqueFileName)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, fileBuffer)

    // Save attachment record
    const attachment = await db.ticketAttachment.create({
      data: {
        ticketId: params.id,
        fileName: file.name,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: session.user.id
      }
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachmentId')

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachmentId is required' }, { status: 400 })
    }

    const attachment = await db.ticketAttachment.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment || attachment.ticketId !== params.id) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Only allow deletion by uploader or ticket owner
    const ticket = await db.ticket.findUnique({
      where: { id: params.id }
    })

    if (attachment.uploadedBy !== session.user.id && ticket?.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await db.ticketAttachment.delete({
      where: { id: attachmentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

