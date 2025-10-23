import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const connections = await prisma.externalConnection.findMany({
      include: {
        space: {
          select: {
            id: true,
            name: true
          }
        },
        dataModels: {
          select: {
            id: true,
            name: true,
            description: true,
            tableName: true
          }
        }
      }
    })

    const formattedConnections = connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      spaceId: conn.spaceId,
      spaceName: conn.space.name,
      type: conn.dbType,
      host: conn.host,
      port: conn.port || 5432,
      database: conn.database,
      username: conn.username,
      isActive: conn.isActive,
      status: 'connected', // This would be determined by actual connection testing
      lastConnected: conn.updatedAt,
      connectionPool: {
        min: 1,
        max: 10,
        current: 2,
        idle: 1
      },
      dataModels: conn.dataModels
    }))

    return NextResponse.json({ connections: formattedConnections })
  } catch (error) {
    console.error('Error fetching database connections:', error)
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, spaceId, type, host, port, database, username, password } = body

    const connection = await prisma.externalConnection.create({
      data: {
        name,
        spaceId,
        dbType: type,
        host,
        port: port || 5432,
        database,
        username,
        password,
        isActive: true
      },
      include: {
        space: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ 
      connection: {
        id: connection.id,
        name: connection.name,
        spaceId: connection.spaceId,
        spaceName: connection.space.name,
        type: connection.dbType,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        isActive: connection.isActive,
        status: 'connected',
        lastConnected: connection.createdAt,
        connectionPool: {
          min: 1,
          max: 10,
          current: 1,
          idle: 0
        },
        dataModels: []
      }
    })
  } catch (error) {
    console.error('Error creating database connection:', error)
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 })
  }
}
