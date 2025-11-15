import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get('collectionId')

    const requests = await prisma.apiRequest.findMany({
      where: {
        ...(collectionId && { collectionId }),
        createdBy: session.user.id,
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
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

    const body = await request.json()
    const {
      collectionId,
      name,
      method,
      url,
      headers,
      params,
      body: requestBody,
      bodyType,
      authType,
      authConfig,
      preRequestScript,
      testScript,
      requestType,
      graphqlQuery,
      graphqlVariables,
      order,
    } = body

    const apiRequest = await prisma.apiRequest.create({
      data: {
        collectionId,
        name,
        method: method || 'GET',
        url,
        headers: headers || [],
        params: params || [],
        body: requestBody,
        bodyType,
        authType: authType || 'none',
        authConfig,
        preRequestScript,
        testScript,
        requestType: requestType || 'REST',
        graphqlQuery,
        graphqlVariables,
        order: order || 0,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ request: apiRequest })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}

