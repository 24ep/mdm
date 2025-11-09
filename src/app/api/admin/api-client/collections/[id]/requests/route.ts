import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collectionId = params.id
    const apiRequest = await request.json()

    // Verify collection exists and belongs to user
    const collection = await prisma.apiClientCollection.findFirst({
      where: {
        id: collectionId,
        userId: session.user.id
      }
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Create request in collection
    const newRequest = await prisma.apiClientRequest.create({
      data: {
        collectionId,
        userId: session.user.id,
        name: apiRequest.name,
        method: apiRequest.method,
        url: apiRequest.url,
        headers: apiRequest.headers || [],
        auth: apiRequest.auth,
        body: apiRequest.body,
        preRequestScript: apiRequest.preRequestScript,
        tests: apiRequest.tests || [],
        description: apiRequest.description,
        tags: apiRequest.tags || []
      }
    })

    return NextResponse.json({ request: newRequest })
  } catch (error) {
    console.error('Error adding request to collection:', error)
    return NextResponse.json(
      { error: 'Failed to add request to collection' },
      { status: 500 }
    )
  }
}

