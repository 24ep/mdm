import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { schemaMigration } from '@/lib/schema-migration'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await schemaMigration.initialize()
    const migrations = await schemaMigration.getMigrations()

    return NextResponse.json(migrations)
  } catch (error: any) {
    console.error('Error fetching migrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch migrations', details: error.message },
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
    await schemaMigration.initialize()
    const migrationId = await schemaMigration.createMigration(body)
    const migrations = await schemaMigration.getMigrations()
    const migration = migrations.find(m => m.id === migrationId)

    return NextResponse.json(migration, { status: 201 })
  } catch (error: any) {
    console.error('Error creating migration:', error)
    return NextResponse.json(
      { error: 'Failed to create migration', details: error.message },
      { status: 500 }
    )
  }
}

