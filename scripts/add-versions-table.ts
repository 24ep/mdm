import { PrismaClient } from '@prisma/client'
import { runPluginMigration } from '../src/lib/plugin-schema-utils'

const prisma = new PrismaClient()

async function migrate() {
    console.log('🚀 Adding missing versions table to Knowledge Base schema...')

    const slug = 'knowledge-base'

    try {
        const migrationSql = `
            CREATE TABLE IF NOT EXISTS knowledge_document_versions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                content_html TEXT,
                created_by UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `

        console.log(`  📦 Running migration for ${slug}...`)
        await runPluginMigration(slug, migrationSql)
        console.log('  ✅ Table knowledge_document_versions created successfully')

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

migrate()
