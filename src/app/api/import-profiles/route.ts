import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dataModel = searchParams.get('dataModel')
    const isPublic = searchParams.get('isPublic')
    const importType = searchParams.get('importType')

    // Build where clause for filtering using Prisma
    const where: any = {}
    
    if (dataModel) {
      where.dataModel = dataModel
    }
    
    if (isPublic !== null) {
      where.isPublic = isPublic === 'true'
    }
    
    if (importType) {
      where.importType = importType
    }

    // Get import profiles using Prisma
    const profiles = await db.importProfile.findMany({
      where,
      include: {
        importProfileSharing: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Error in GET /api/import-profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      dataModel, 
      fileTypes, 
      headerRow, 
      dataStartRow, 
      chunkSize, 
      maxItems, 
      importType, 
      primaryKeyAttribute, 
      dateFormat, 
      timeFormat, 
      booleanFormat, 
      attributeMapping, 
      attributeOptions, 
      isPublic, 
      sharing 
    } = body

    // Validate required fields
    if (!name || !dataModel || !fileTypes || fileTypes.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate import type
    if (!['insert', 'upsert', 'delete'].includes(importType)) {
      return NextResponse.json({ error: 'Invalid import type' }, { status: 400 })
    }

    // Create the import profile using Prisma
    const profile = await db.importProfile.create({
      data: {
        name,
        description,
        dataModel: dataModel,
        fileTypes: fileTypes,
        headerRow: headerRow || 1,
        dataStartRow: dataStartRow || 2,
        chunkSize: chunkSize || 1000,
        maxItems: maxItems || null,
        importType: importType,
        primaryKeyAttribute: primaryKeyAttribute || null,
        dateFormat: dateFormat || 'YYYY-MM-DD',
        timeFormat: timeFormat || 'HH:mm:ss',
        booleanFormat: booleanFormat || 'true/false',
        attributeMapping: attributeMapping || {},
        attributeOptions: attributeOptions || {},
        isPublic: isPublic || false,
        createdBy: session.user.id
      }
    })

    // Create sharing configurations if provided using Prisma
    if (sharing && sharing.length > 0) {
      const sharingData = sharing.map((share: any) => ({
        profileId: profile.id,
        sharingType: share.type,
        targetId: share.targetId || null,
        targetGroup: share.targetGroup || null
      }))

      try {
        await db.importProfileSharing.createMany({
          data: sharingData
        })
      } catch (sharingError) {
        console.error('Error creating sharing configurations:', sharingError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/import-profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
