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

    const body = await request.json()
    const {
      dataModelId,
      format = 'xlsx',
      filters = {},
      columns = [],
    } = body

    if (!dataModelId) {
      return NextResponse.json(
        { error: 'Data model is required' },
        { status: 400 }
      )
    }

    // Create export job
    const exportJob = await db.exportJob.create({
      data: {
        dataModelId,
        format,
        status: 'PENDING',
        filters: filters || {},
        columns: columns || [],
        createdBy: session.user.id,
        spaceId: body.spaceId || null
      }
    })

    // TODO: In a production system, you would:
    // 1. Queue a background job to process the export
    // 2. Fetch data from the data model based on filters
    // 3. Format data according to the specified format
    // 4. Upload the file to storage and update the job with fileUrl
    // For now, we just create the job record

    return NextResponse.json({ 
      job: exportJob,
      message: 'Export job created. Processing will begin shortly.'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating export job:', error)
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

    const [exportJobs, total] = await Promise.all([
      db.exportJob.findMany({
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
      db.exportJob.count({ where })
    ])

    return NextResponse.json({ 
      exportJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching export jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
