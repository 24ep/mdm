import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const dataModelId = formData.get('dataModelId') as string
    const mapping = JSON.parse(formData.get('mapping') as string || '{}')
    const spaceId = formData.get('spaceId') as string | null

    if (!file || !dataModelId) {
      return NextResponse.json(
        { error: 'File and data model are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and Excel files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Create import job
    const importJob = await db.importJob.create({
      data: {
        dataModelId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        status: 'PENDING',
        mapping: mapping || {},
        createdBy: session.user.id,
        spaceId: spaceId || null
      }
    })

    // TODO: In a production system, you would:
    // 1. Upload the file to storage (S3, MinIO, etc.)
    // 2. Queue a background job to process the import
    // 3. Process the file and import data into the data model
    // For now, we just create the job record

    return NextResponse.json({ 
      job: importJob,
      message: 'Import job created. Processing will begin shortly.'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating import job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const dataModelId = searchParams.get('dataModelId')
    const spaceId = searchParams.get('spaceId')

    const where: any = {
      OR: [
        { createdBy: session.user.id },
        { space: { members: { some: { userId: session.user.id } } } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (dataModelId) {
      where.dataModelId = dataModelId
    }

    if (spaceId) {
      where.spaceId = spaceId
    }

    const [importJobs, total] = await Promise.all([
      db.importJob.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      db.importJob.count({ where })
    ])

    return NextResponse.json({ 
      importJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching import jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
