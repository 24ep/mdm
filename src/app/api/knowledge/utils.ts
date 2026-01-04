import { query } from '@/lib/db'

/**
 * Gets the isolated schema name for the Knowledge Base plugin
 */
export async function getKnowledgeSchema(spaceId?: string | null): Promise<string> {
    // 1. Try to get space-specific installation
    if (spaceId) {
        const spaceResult = await query(
            `SELECT si.db_schema FROM service_installations si 
             JOIN service_registry sr ON sr.id::text = si.service_id::text 
             WHERE sr.slug = 'knowledge-base' AND si.space_id::text = $1 AND si.deleted_at IS NULL`,
            [spaceId]
        )
        if (spaceResult.rows.length > 0) {
            const schema = spaceResult.rows[0].db_schema
            return schema === 'public' ? 'public' : `"${schema}"`
        }
    }

    // 2. Fallback to global (null space) installation
    const globalResult = await query(
        `SELECT si.db_schema FROM service_installations si 
         JOIN service_registry sr ON sr.id::text = si.service_id::text 
         WHERE sr.slug = 'knowledge-base' AND si.space_id IS NULL AND si.deleted_at IS NULL`
    )

    const schema = globalResult.rows[0]?.db_schema || 'plugin_knowledge_base'
    return schema === 'public' ? 'public' : `"${schema}"`
}

/**
 * Validates if a string is a valid UUID
 */
export function isValidUUID(id: string | null | undefined): boolean {
    if (!id) return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
}
