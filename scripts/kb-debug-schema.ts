import { query } from '../src/lib/db'
import { getKnowledgeSchema } from '../src/app/api/knowledge/utils'

async function debugSchema(spaceId: string) {
    console.log(`--- Debugging Schema for Space: ${spaceId} ---`)

    try {
        // 1. Get the schema via the utility
        const schemaWithQuotes = await getKnowledgeSchema(spaceId)
        const schema = schemaWithQuotes.replace(/"/g, '')

        console.log(`✅ Resolved schema: "${schema}"`)

        // 2. Check if the schema exists in Postgres
        const schemaExistsQuery = `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`
        const schemaExistsResult = await query(schemaExistsQuery, [schema])

        if (schemaExistsResult.rows.length === 0) {
            console.log(`❌ Schema "${schema}" DOES NOT EXIST in the database.`)
            return
        }
        console.log(`✅ Schema "${schema}" exists.`)

        // 3. Check if knowledge_presence table exists in that schema
        const tableExistsQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'knowledge_presence'
        `
        const tableExistsResult = await query(tableExistsQuery, [schema])

        if (tableExistsResult.rows.length === 0) {
            console.log(`❌ Table "knowledge_presence" DOES NOT EXIST in schema "${schema}".`)
            return
        }
        console.log(`✅ Table "knowledge_presence" exists in schema "${schema}".`)

        // 4. Try a simple count
        const countQuery = `SELECT COUNT(*) FROM "${schema}".knowledge_presence`
        const countResult = await query(countQuery)
        console.log(`ℹ️ Current presence count: ${countResult.rows[0].count}`)

    } catch (error) {
        console.error('❌ Error during diagnostics:', error)
    }
}

// Use the spaceId from browser logs
const targetSpaceId = '75f16f00-3bc6-4566-a18c-ee49024dba8e'
debugSchema(targetSpaceId).catch(console.error)
