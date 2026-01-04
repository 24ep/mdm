
import { query } from './lib/db'

async function testSearch() {
    const spaceId = 'e24399dc-7777-49f8-9577-d7ca196ba988' // Replace with a valid spaceId from your DB
    const searchQuery = 'test'

    console.log(`Testing search for spaceId: ${spaceId} with query: ${searchQuery}`)

    const response = await fetch(`http://localhost:3000/api/knowledge/search?q=${searchQuery}&spaceId=${spaceId}`, {
        headers: {
            'Cookie': 'next-auth.session-token=...' // You'd need a valid token here to test via HTTP
        }
    })

    // Alternatively, test the logic directly if possible, or just check if it crashes
}

// Since I can't easily get a session token, I'll just check if the schema resolution works via a diagnostic script
async function diagnoseSchema() {
    const spaceId = 'e24399dc-7777-49f8-9577-d7ca196ba988'

    const existingQuery = `SELECT si.db_schema FROM service_installations si 
       JOIN service_registry sr ON sr.id::text = si.service_id::text 
       WHERE sr.slug = 'knowledge-base' AND si.space_id::text = $1 AND si.deleted_at IS NULL`

    const result = await query(existingQuery, [spaceId])
    console.log('Schema for space:', result.rows[0]?.db_schema)
}

diagnoseSchema().catch(console.error)
