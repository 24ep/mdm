import { db, query } from './db'

/**
 * Utility functions for managing isolated PostgreSQL schemas for plugins
 */

/**
 * Generates a consistent schema name for a plugin slug
 */
export function getPluginSchemaName(slug: string): string {
    // Sanitize slug to ensure it's a valid PostgreSQL schema name
    const sanitized = slug.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    return `plugin_${sanitized}`
}

/**
 * Creates a new schema for a plugin if it doesn't exist
 */
export async function createPluginSchema(slug: string): Promise<string> {
    const schemaName = getPluginSchemaName(slug)

    console.log(`[PluginSchema] Creating schema: ${schemaName}`)

    // Use raw SQL to create the schema safely
    // Note: We use double quotes for schema name to handle any reserved words or special chars
    await query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)

    return schemaName
}

/**
 * Drops a plugin schema and all its contents
 */
export async function dropPluginSchema(slug: string): Promise<void> {
    const schemaName = getPluginSchemaName(slug)

    console.log(`[PluginSchema] Dropping schema: ${schemaName}`)

    // Use CASCADE to remove all tables, views, etc.
    await query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
}

/**
 * Executes a SQL migration script within a specific plugin's schema
 * 
 * Sets the search_path to the plugin's schema before running the script
 */
export async function runPluginMigration(slug: string, sqlScript: string): Promise<void> {
    const schemaName = getPluginSchemaName(slug)

    if (!sqlScript || sqlScript.trim() === '') {
        return
    }

    console.log(`[PluginSchema] Running migration for ${slug} in schema ${schemaName}`)

    // Split script by semicolons if needed, or run as one block if supported
    // For safety and search_path management, we'll run it within a transaction block if possible
    // However, Prisma doesn't support nested transactions well with raw SQL search_path changes

    try {
        // 1. Set search_path
        await query(`SET search_path TO "${schemaName}", public`)

        // 2. Run the script
        // Prisma $queryRawUnsafe doesn't support multiple statements in one call
        // We split by semicolon and filter out empty statements
        const statements = sqlScript
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0)

        for (const statement of statements) {
            await query(statement)
        }

        // 3. Reset search_path (optional but good practice)
        await query(`SET search_path TO public`)

        console.log(`[PluginSchema] Migration successful for ${slug}`)
    } catch (error) {
        console.error(`[PluginSchema] Migration failed for ${slug}:`, error)
        // Always try to reset search_path on error
        try { await query(`SET search_path TO public`) } catch (e) { }
        throw error
    }
}
