# UUID Function Indexes Migration

## Overview

This migration (054) creates function indexes on UUID columns to maintain query performance when using the `column::text = $1` pattern required by Prisma's `$queryRawUnsafe`.

## Why This Migration is Needed

Prisma's `$queryRawUnsafe` passes all parameters as TEXT type. For UUID comparisons, we must cast the column to text:
```sql
WHERE data_model_id::text = $1
```

Without function indexes, this would cause full table scans. The function indexes allow PostgreSQL to use indexes even when columns are cast to text.

## What This Migration Does

Creates function indexes on frequently queried UUID columns:
- `data_model_attributes.data_model_id` (with partial index for active records)
- `data_models.id` (with partial index for non-deleted records)
- `data_records.data_model_id` (with partial index for non-deleted records)
- `data_model_spaces.data_model_id` and `space_id` (junction table)

## How to Apply

### Option 1: Using the npm script (Recommended)
```bash
npm run migrate:uuid-indexes
```

### Option 2: Using the migration script directly
```bash
node scripts/run-migration.js postgrest/migrations/054_add_uuid_text_function_indexes.sql
```

### Option 3: Using psql directly
```bash
psql -h localhost -p 5432 -U postgres -d customer_data_management -f postgrest/migrations/054_add_uuid_text_function_indexes.sql
```

## Performance Impact

- **Before**: Queries using `column::text = $1` would do full table scans
- **After**: Queries use the function indexes, maintaining O(log n) lookup performance

## Verification

After applying the migration, verify indexes were created:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('data_model_attributes', 'data_models', 'data_records', 'data_model_spaces')
  AND indexname LIKE '%_text';
```

You should see indexes like:
- `idx_data_model_attributes_model_id_text`
- `idx_data_models_id_text`
- `idx_data_records_model_id_text`
- etc.

## Rollback

If needed, you can drop the indexes:
```sql
DROP INDEX IF EXISTS idx_data_model_attributes_model_id_text;
DROP INDEX IF EXISTS idx_data_models_id_text;
DROP INDEX IF EXISTS idx_data_records_model_id_text;
DROP INDEX IF EXISTS idx_data_model_attributes_model_id_active;
DROP INDEX IF EXISTS idx_data_model_spaces_model_id_text;
DROP INDEX IF EXISTS idx_data_model_spaces_space_id_text;
```

