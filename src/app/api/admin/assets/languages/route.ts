import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const languages = await prisma.language.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
    })

    return NextResponse.json(languages)
  } catch (error) {
    console.error('Error fetching languages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch languages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, nativeName, flag, isActive, isDefault, sortOrder } = body

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: code and name' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const language = await prisma.language.create({
      data: {
        code,
        name,
        nativeName: nativeName || name,
        flag,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json(language)
  } catch (error: any) {
    console.error('Error creating language:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Language code already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create language' },
      { status: 500 }
    )
  }
}

