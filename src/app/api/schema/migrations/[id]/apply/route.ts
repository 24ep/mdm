import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { schemaMigration } from '@/lib/schema-migration'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await schemaMigration.initialize()
    const result = await schemaMigration.applyMigration(id, session.user.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error applying migration:', error)
    return NextResponse.json(
      { error: 'Failed to apply migration', details: error.message },
      { status: 500 }
    )
  }
}

