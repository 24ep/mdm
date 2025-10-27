import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const COMP_PREFIX = 'freq:companies:'
const IND_PREFIX = 'freq:industries:'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const compKey = `${COMP_PREFIX}${session.user.id}`
    const indKey = `${IND_PREFIX}${session.user.id}`

    const [compRow, indRow] = await Promise.all([
      db.systemSetting.findUnique({
        where: { key: compKey },
        select: { value: true }
      }),
      db.systemSetting.findUnique({
        where: { key: indKey },
        select: { value: true }
      })
    ])

    return NextResponse.json({
      companies: (compRow?.value as Record<string, number>) || {},
      industries: (indRow?.value as Record<string, number>) || {},
    })
  } catch (error) {
    console.error('GET /api/user-frequencies error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const companies: string[] = Array.isArray(body?.companies) ? body.companies : []
    const industries: string[] = Array.isArray(body?.industries) ? body.industries : []

    const compKey = `${COMP_PREFIX}${session.user.id}`
    const indKey = `${IND_PREFIX}${session.user.id}`

    // Load existing using Prisma
    const [compRow, indRow] = await Promise.all([
      db.systemSetting.findUnique({
        where: { key: compKey },
        select: { value: true }
      }),
      db.systemSetting.findUnique({
        where: { key: indKey },
        select: { value: true }
      })
    ])

    const compMap: Record<string, number> = (compRow?.value as any) || {}
    const indMap: Record<string, number> = (indRow?.value as any) || {}

    for (const name of companies) {
      if (!name) continue
      compMap[name] = (compMap[name] || 0) + 1
    }
    for (const name of industries) {
      if (!name) continue
      indMap[name] = (indMap[name] || 0) + 1
    }

    if (companies.length > 0) {
      await db.systemSetting.upsert({
        where: { key: compKey },
        update: { value: compMap, updatedAt: new Date() },
        create: { key: compKey, value: compMap }
      })
    }
    if (industries.length > 0) {
      await db.systemSetting.upsert({
        where: { key: indKey },
        update: { value: indMap, updatedAt: new Date() },
        create: { key: indKey, value: indMap }
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/user-frequencies error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


