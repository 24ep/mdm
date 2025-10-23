import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const dataModels = await prisma.dataModel.findMany({
      include: {
        attributes: true,
        dataRecords: true
      }
    })

    const tables = dataModels.map(model => ({
      name: model.tableName,
      rows: model.dataRecords.length,
      size: Math.floor(Math.random() * 1000000), // Mock size
      indexes: model.attributes.length,
      lastAnalyzed: new Date(),
      isPartitioned: false,
      columns: model.attributes.map(attr => ({
        name: attr.name,
        type: attr.dataType,
        nullable: !attr.isRequired,
        defaultValue: attr.defaultValue,
        isPrimaryKey: attr.isPrimaryKey,
        isForeignKey: false
      }))
    }))

    return NextResponse.json({ tables })
  } catch (error) {
    console.error('Error fetching database tables:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}
