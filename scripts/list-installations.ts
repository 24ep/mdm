import { query } from '../src/lib/db'

async function listInstallations() {
    console.log('--- Listing All Service Installations ---')
    const sql = `
        SELECT sr.slug, si.space_id, si.db_schema, si.status, si.deleted_at
        FROM service_installations si
        JOIN service_registry sr ON sr.id::text = si.service_id::text
        ORDER BY sr.slug, si.space_id
    `
    const result = await query(sql)
    console.table(result.rows)
}

listInstallations().catch(console.error)
