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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isPublic = searchParams.get('public') === 'true'

    const templates = await prisma.apiClientTemplate.findMany({
      where: {
        ...(category && { category }),
        ...(isPublic ? { isPublic: true } : {})
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error loading templates:', error)
    return NextResponse.json(
      { error: 'Failed to load templates' },
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

    const {
      name,
      description,
      category,
      method,
      url,
      headers,
      auth,
      body,
      preRequestScript,
      tests,
      tags,
      isPublic
    } = await request.json()

    const template = await prisma.apiClientTemplate.create({
      data: {
        name,
        description,
        category: category || 'REST',
        method,
        url,
        headers: headers || [],
        auth,
        body,
        preRequestScript,
        tests: tests || [],
        tags: tags || [],
        isPublic: isPublic || false
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

