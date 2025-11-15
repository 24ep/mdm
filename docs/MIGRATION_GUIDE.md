# Knowledge Base Migration Guide

## Quick Start

Run the database migration to create all knowledge base tables:

```bash
npx prisma migrate dev --name add_outline_knowledge_base
npx prisma generate
```

## What Gets Created

The migration creates 9 new tables:

1. `knowledge_collections` - Collections/teams for organizing documents
2. `knowledge_collection_members` - Member permissions (viewer, editor, admin)
3. `knowledge_documents` - Documents with hierarchy and full-text search
4. `knowledge_document_versions` - Version history for documents
5. `knowledge_comments` - Threaded comments on documents
6. `knowledge_shares` - Sharing and permissions (users, teams, public links)
7. `knowledge_stars` - Favorites/bookmarks
8. `knowledge_mentions` - @mentions in documents
9. `knowledge_presence` - Real-time collaboration (cursors, selections)

## Verification

After migration, verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'knowledge_%';
```

You should see all 9 tables listed.

## Rollback (if needed)

If you need to rollback:

```bash
npx prisma migrate reset
```

**Warning**: This will delete all data in the database!

## Next Steps

After migration:
1. Navigate to `/knowledge` in your application
2. Create your first collection
3. Start creating documents!

---

**Status**: Ready to migrate ✅

