#!/bin/sh
set -e

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run initialization scripts if this is the first run
if [ "$1" = "node" ] && [ "$2" = "server.js" ]; then
  # Check if admin user exists, if not run initialization
  echo "🔍 Checking if initialization is needed..."
  
  # Run initialization scripts in background (non-blocking)
  (
    sleep 5
    echo "🚀 Running create-admin script..."
    npm run create-admin || echo "⚠️  Admin user may already exist"
    
    echo "🚀 Running create-comprehensive-data-models script..."
    node scripts/create-comprehensive-data-models.js || echo "⚠️  Data models may already exist"
    
    echo "✅ Database initialization completed!"
  ) &
fi

# Execute the main command (start the server)
exec "$@"

