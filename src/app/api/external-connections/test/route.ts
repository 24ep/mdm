import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createExternalClient } from '@/lib/external-db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { space_id, db_type, host, port, database, username, password } = body
    if (!space_id || !db_type || !host) {
      return NextResponse.json({ error: 'space_id, db_type, host required' }, { status: 400 })
    }

    // Access check
    const { rows: access } = await query('SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2', [space_id, session.user.id])
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const client = await createExternalClient({
      id: 'temp', db_type, host, port, database, username, password, options: null,
    })
    try {
      // Fetch schemas and tables
      let schemas: string[] = []
      let tablesBySchema: Record<string, string[]> = {}
      if (db_type === 'postgres') {
        const { rows: schemaRows } = await client.query(`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`)
        schemas = schemaRows.map((r: any) => r.schema_name)
        for (const s of schemas) {
          const { rows: tableRows } = await client.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`, [s]
          )
          tablesBySchema[s] = tableRows.map((r: any) => r.table_name)
        }
      } else {
        const { rows: tableRows } = await client.query(`SELECT table_schema, table_name FROM information_schema.tables ORDER BY table_schema, table_name`)
        for (const r of tableRows as any[]) {
          tablesBySchema[r.table_schema] = tablesBySchema[r.table_schema] || []
          tablesBySchema[r.table_schema].push(r.table_name)
        }
        schemas = Object.keys(tablesBySchema)
      }
      return NextResponse.json({ ok: true, schemas, tablesBySchema })
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('Test connection error:', error)
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id')
    const dbType = searchParams.get('db_type')
    const host = searchParams.get('host')
    const port = searchParams.get('port') ? Number(searchParams.get('port')) : undefined
    const database = searchParams.get('database') || undefined
    const username = searchParams.get('username') || undefined
    const password = searchParams.get('password') || undefined
    const schema = searchParams.get('schema') || undefined
    const table = searchParams.get('table') || undefined

    if (!spaceId || !dbType || !host || !schema || !table) {
      return NextResponse.json({ error: 'space_id, db_type, host, schema, table required' }, { status: 400 })
    }

    const { rows: access } = await query('SELECT 1 FROM space_members WHERE space_id = $1 AND user_id = $2', [spaceId, session.user.id])
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const client = await createExternalClient({ id: 'temp', db_type: dbType as any, host: host!, port, database, username, password, options: null })
    try {
      // Columns
      let columns: Array<{ name: string; data_type: string; is_nullable: boolean; is_primary_key: boolean }>
      if (dbType === 'postgres') {
        const { rows } = await client.query(
          `SELECT column_name as name, data_type, is_nullable = 'YES' as is_nullable
           FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
          [schema, table]
        )
        // Primary keys
        const { rows: pkRows } = await client.query(
          `SELECT a.attname as name
           FROM   pg_index i
           JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
           WHERE  i.indrelid = $1::regclass AND i.indisprimary`,
          [`${schema}.${table}`]
        )
        const pks = new Set(pkRows.map((r: any) => r.name))
        columns = rows.map((r: any) => ({ ...r, is_primary_key: pks.has(r.name) }))
      } else {
        const { rows } = await client.query(
          `SELECT COLUMN_NAME as name, DATA_TYPE as data_type, IS_NULLABLE = 'YES' as is_nullable
           FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
          [schema, table]
        )
        // Approximate PK info for MySQL (additional query would be needed for exact PK)
        columns = (rows as any[]).map((r: any) => ({ ...r, is_primary_key: false }))
      }
      return NextResponse.json({ ok: true, columns })
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('Metadata fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 })
  }
}


