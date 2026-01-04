import { PrismaClient } from '@prisma/client'
import { createPluginSchema, runPluginMigration } from '@/lib/plugin-schema-utils'

const prisma = new PrismaClient()

async function migrate() {
    console.log('🚀 Starting Knowledge Base migration to isolated schema...')

    const slug = 'knowledge-base'
    const schemaName = 'plugin_knowledge_base'

    try {
        // 1. Create schema
        await createPluginSchema(slug)
        console.log(`  ✅ Schema created: ${schemaName}`)

        // 2. Define migrations (based on schema.prisma)
        const migrationSql = `
            CREATE TABLE IF NOT EXISTS knowledge_collections (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                color TEXT,
                is_private BOOLEAN DEFAULT false,
                space_id UUID,
                created_by UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                deleted_at TIMESTAMP WITH TIME ZONE
            );

            CREATE TABLE IF NOT EXISTS knowledge_collection_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                collection_id UUID NOT NULL REFERENCES knowledge_collections(id) ON DELETE CASCADE,
                user_id UUID NOT NULL,
                role TEXT DEFAULT 'viewer',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(collection_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS knowledge_documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                collection_id UUID NOT NULL REFERENCES knowledge_collections(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                content_html TEXT,
                parent_id UUID REFERENCES knowledge_documents(id),
                template_id UUID,
                is_template BOOLEAN DEFAULT false,
                is_public BOOLEAN DEFAULT false,
                is_pinned BOOLEAN DEFAULT false,
                published_at TIMESTAMP WITH TIME ZONE,
                archived_at TIMESTAMP WITH TIME ZONE,
                "order" INTEGER DEFAULT 0,
                created_by UUID NOT NULL,
                updated_by UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                deleted_at TIMESTAMP WITH TIME ZONE
            );

            CREATE TABLE IF NOT EXISTS knowledge_document_versions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                content_html TEXT,
                created_by UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS knowledge_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
                parent_id UUID REFERENCES knowledge_comments(id),
                content TEXT NOT NULL,
                content_html TEXT,
                resolved_at TIMESTAMP WITH TIME ZONE,
                resolved_by UUID,
                created_by UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                deleted_at TIMESTAMP WITH TIME ZONE
            );

            CREATE TABLE IF NOT EXISTS knowledge_shares (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
                collection_id UUID REFERENCES knowledge_collections(id) ON DELETE CASCADE,
                user_id UUID,
                team_id UUID,
                permission TEXT DEFAULT 'read',
                public_link TEXT UNIQUE,
                expires_at TIMESTAMP WITH TIME ZONE,
                created_by UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS knowledge_stars (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
                user_id UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(document_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS knowledge_mentions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
                user_id UUID NOT NULL,
                created_by UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(document_id, user_id, created_by)
            );

            CREATE TABLE IF NOT EXISTS knowledge_presence (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
                user_id UUID NOT NULL,
                cursor JSONB,
                selection JSONB,
                last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(document_id, user_id)
            );

            CREATE INDEX IF NOT EXISTS idx_knowledge_documents_collection ON knowledge_documents(collection_id);
            CREATE INDEX IF NOT EXISTS idx_knowledge_documents_parent ON knowledge_documents(parent_id);
            CREATE INDEX IF NOT EXISTS idx_knowledge_documents_deleted ON knowledge_documents(deleted_at);
            CREATE INDEX IF NOT EXISTS idx_knowledge_comments_document ON knowledge_comments(document_id);
            CREATE INDEX IF NOT EXISTS idx_knowledge_presence_last_seen ON knowledge_presence(last_seen);
        `

        // 3. Run migration in the new schema
        console.log(`  📦 Running migrations for ${slug}...`)
        await runPluginMigration(slug, migrationSql)
        console.log('  ✅ Migrations completed successfully')

        // 4. Update existing installations to use this schema
        console.log(`  🔗 Linking existing ${slug} installations to the new schema...`)
        const result = await prisma.serviceInstallation.updateMany({
            where: {
                service: { slug: slug },
                dbSchema: null
            },
            data: {
                dbSchema: schemaName
            }
        })
        console.log(`  ✅ Updated ${result.count} installations.`)

        console.log('\n✨ Knowledge Base migration complete!')
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

migrate()
