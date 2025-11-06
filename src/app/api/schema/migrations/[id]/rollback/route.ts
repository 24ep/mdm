import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { schemaMigration } from '@/lib/schema-migration'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await schemaMigration.initialize()
    const result = await schemaMigration.rollbackMigration(params.id, session.user.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error rolling back migration:', error)
    return NextResponse.json(
      { error: 'Failed to rollback migration', details: error.message },
      { status: 500 }
    )
  }
}

