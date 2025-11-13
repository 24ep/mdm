import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params

    // Get space statistics
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        members: true,
        dataModels: {
          include: {
            dataModel: {
              include: {
                dataRecords: true
              }
            }
          }
        },
        attachmentStorage: true
      }
    })

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    const totalRecords = space.dataModels.reduce((sum, dm) => sum + dm.dataModel.dataRecords.length, 0)
    const storageUsed = space.attachmentStorage.reduce((sum, att) => sum + att.fileSize, 0)

    const stats = {
      totalUsers: space.members.length,
      totalDataModels: space.dataModels.length,
      totalRecords,
      storageUsed,
      lastActivity: space.updatedAt
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching space stats:', error)
    return NextResponse.json({ error: 'Failed to fetch space stats' }, { status: 500 })
  }
}
