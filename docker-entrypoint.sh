#!/bin/sh
set -e

echo "=== Docker Entrypoint: Starting initialization ==="

# Wait for database to be ready
echo "Waiting for database to be ready..."
MAX_WAIT=60
WAITED=0
until pg_isready -h postgres-db -U postgres -p 5432 > /dev/null 2>&1; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⚠️  Database did not become ready within $MAX_WAIT seconds. Continuing anyway..."
    break
  fi
  echo "  Database is not ready yet. Waiting... ($WAITED/$MAX_WAIT seconds)"
  sleep 2
  WAITED=$((WAITED + 2))
done
if pg_isready -h postgres-db -U postgres -p 5432 > /dev/null 2>&1; then
  echo "✓ Database is ready"
fi

# Run Prisma migrations
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

# Seed initial data (only if tsx is available, otherwise skip)
echo ""
echo "=== Seeding initial data ==="
if command -v npx > /dev/null 2>&1 && npx tsx --version > /dev/null 2>&1; then
  npx tsx prisma/seed-assets.ts || {
    echo "⚠️  Seeding failed (may already be seeded)"
  }
else
  echo "⚠️  tsx not available, skipping seed (may already be seeded)"
fi

echo ""
echo "=== Initialization complete. Starting server... ==="

# Execute the main command (start Next.js server)
exec "$@"

