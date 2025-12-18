#!/bin/sh
set -e

echo "=== Docker Entrypoint: Starting initialization ==="

# Wait for database to be ready
echo "Waiting for database to be ready..."

# Extract database host and port from DATABASE_URL
# DATABASE_URL format: postgres://user:pass@host:port/dbname
if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\1|')
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\2|')
  DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*://([^:]+):.*|\1|')
else
  DB_HOST="postgres-db"
  DB_PORT="5432"
  DB_USER="postgres"
fi

echo "Connecting to database at $DB_HOST:$DB_PORT..."
echo "Resolving $DB_HOST..."
getent hosts "$DB_HOST" || echo "Failed to resolve $DB_HOST"
ping -c 1 "$DB_HOST" || echo "Failed to ping $DB_HOST"

MAX_WAIT=120
WAITED=0
until pg_isready -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT"; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⚠️  Database did not become ready within $MAX_WAIT seconds. Continuing anyway..."
    break
  fi
  echo "  Database is not ready yet. Waiting... ($WAITED/$MAX_WAIT seconds)"
  sleep 2
  WAITED=$((WAITED + 2))
done
if pg_isready -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT" > /dev/null 2>&1; then
  echo "✓ Database is ready"
else
  echo "⚠️  Warning: Database health check failed, but continuing..."
fi

# Run Prisma migrations
echo ""
echo "=== Syncing Prisma schema with database ==="
npx prisma db push --accept-data-loss || {
  echo "⚠️  Prisma db push failed (may already be synced)"
}

echo ""
echo "=== Running Prisma migrations ==="
npx prisma migrate deploy || {
  echo "⚠️  Prisma migrations failed (may already be applied)"
}

# Run custom migration script
echo ""
echo "=== Running custom migration script ==="
node scripts/run-migration.js || {
  echo "⚠️  Custom migration script failed (may already be applied)"
}

# Seed initial data (Controlled by ENABLE_SEEDING env var)
if [ "$ENABLE_SEEDING" = "true" ]; then
  echo ""
  echo "=== Seeding initial data ==="
  if command -v npx > /dev/null 2>&1 && npx tsx --version > /dev/null 2>&1; then
    npx tsx prisma/seed-assets.ts || {
      echo "⚠️  Seeding failed (may already be seeded)"
    }
  else
    echo "⚠️  tsx not available, skipping seed (may already be seeded)"
  fi
else
  echo ""
  echo "=== Seeding skipped (ENABLE_SEEDING not set to true) ==="
fi

echo ""
echo "=== Initialization complete. Starting server... ==="

# Execute the main command (start Next.js server)
exec "$@"

