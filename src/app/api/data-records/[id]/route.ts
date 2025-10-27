import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { isUuid } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const record = await db.dataRecord.findUnique({
      where: { id: params.id },
      include: {
        dataRecordValues: true
      }
    })

    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error fetching record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { values } = body

    if (!Array.isArray(values)) {
      return NextResponse.json({ error: 'values[] required' }, { status: 400 })
    }

    // Upsert values using Prisma
    if (values.length) {
      for (const v of values) {
        await db.dataRecordValue.upsert({
          where: {
            dataRecordId_attributeId: {
              dataRecordId: params.id,
              attributeId: v.attribute_id
            }
          },
          update: {
            value: v.value ?? null
          },
          create: {
            dataRecordId: params.id,
            attributeId: v.attribute_id,
            value: v.value ?? null
          }
        })
      }
    }

    const record = await db.dataRecord.findUnique({
      where: { id: params.id },
      include: {
        dataRecordValues: true
      }
    })

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'DataRecord',
      entityId: params.id,
      oldValue: null, // We don't have old values in this case
      newValue: record,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.dataRecord.update({
      where: { id: params.id },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


