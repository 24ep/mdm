import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collections = await prisma.apiClientCollection.findMany({
      where: { userId: session.user.id },
      include: {
        requests: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ collections })
  } catch (error) {
    console.error('Error loading collections:', error)
    return NextResponse.json(
      { error: 'Failed to load collections' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, requests } = await request.json()
    
    const collection = await prisma.apiClientCollection.create({
      data: {
        userId: session.user.id,
        name,
        description,
        requests: requests ? {
          create: requests.map((req: any) => ({
            userId: session.user.id,
            name: req.name,
            method: req.method,
            url: req.url,
            headers: req.headers || [],
            auth: req.auth,
            body: req.body,
            preRequestScript: req.preRequestScript,
            tests: req.tests || [],
            description: req.description,
            tags: req.tags || []
          }))
        } : undefined
      },
      include: {
        requests: true
      }
    })

    return NextResponse.json({ collection })
  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    )
  }
}

