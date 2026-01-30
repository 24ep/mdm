
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function query(sql: string, params: any[] = []) {
  try {
    return await prisma.$queryRawUnsafe(sql, ...params)
  } catch (e) {
    console.error('Query Failed:', sql)
    throw e
  }
}

async function main() {
  try {
    console.log('Testing GET /api/spaces logic...')

    // 1. Simulate Tag Column Check
    console.log('Checking tags column...')
    const tagsCheckSql = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'spaces' 
        AND column_name = 'tags'
      ) as exists
    `
    const tagsCheckResult: any = await query(tagsCheckSql)
    console.log('Tags check result:', tagsCheckResult)
    const tagsColumnExists = tagsCheckResult[0]?.exists || false
    console.log('Tags column exists:', tagsColumnExists)

    // 2. Simulate Main Query
    const limit = 10
    const offset = 0
    console.log('Running main list query...')
    
    // Exact SQL from route.ts (simplified slightly for the script but keeping core structure)
    const listSql = tagsColumnExists
    ? `
        SELECT s.id, s.name, s.description, s.slug, s.is_default, s.is_active, 
               s.icon, s.logo_url, s.created_at, s.updated_at, s.deleted_at,
               COALESCE(s.tags, '[]'::jsonb) as tags,
               (SELECT COUNT(*)::int FROM space_members sm WHERE sm.space_id::uuid = s.id::uuid) as member_count
        FROM spaces s
        ORDER BY s.is_default DESC, s.deleted_at NULLS LAST, s.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    : `
        SELECT s.id, s.name, s.description, s.slug, s.is_default, s.is_active, 
               s.icon, s.logo_url, s.created_at, s.updated_at, s.deleted_at,
               '[]'::jsonb as tags,
               (SELECT COUNT(*)::int FROM space_members sm WHERE sm.space_id::uuid = s.id::uuid) as member_count
        FROM spaces s
        ORDER BY s.is_default DESC, s.deleted_at NULLS LAST, s.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `

    const spaces = await query(listSql)
    console.log(`Found ${Array.isArray(spaces) ? spaces.length : 0} spaces.`)
    console.log('First space:', spaces[0])

    const countSql = `
      SELECT COUNT(*)::int AS total 
      FROM spaces s
    `
    const countResult: any = await query(countSql)
    console.log('Total count:', countResult[0]?.total)

  } catch (error) {
    console.error('Error in debug script:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
