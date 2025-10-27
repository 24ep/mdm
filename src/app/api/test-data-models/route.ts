import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // First, let's check if the data_models table exists and has any data
    const dataModels = await prisma.dataModel.findMany({
      take: 5, // Just get first 5 records
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true
      }
    })

    // Also check the data_model_spaces table
    const dataModelSpaces = await prisma.dataModelSpace.findMany({
      take: 5,
      include: {
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      dataModels,
      dataModelSpaces,
      totalDataModels: await prisma.dataModel.count(),
      totalDataModelSpaces: await prisma.dataModelSpace.count()
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
