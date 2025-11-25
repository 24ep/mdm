# MDM Plugin Hub

Standalone plugin repository for MDM Marketplace.

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Hub runs on http://localhost:3001
```

### Docker (Production)

```bash
# Build and run
docker-compose up -d

# Or from main project root
docker-compose -f docker-compose.hub.yml up -d
```

### Docker (Development)

```bash
# Run with hot reload
docker-compose -f docker-compose.dev.yml up
```

## Configuration

### Environment Variables

Create `.env` file:

```bash
# Hub Configuration
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:8302

# Hub Directory (where plugins are stored)
PLUGIN_HUB_DIR=./plugins

# Main App URL (for CORS if needed)
MAIN_APP_URL=http://localhost:3000
```

## Structure

```
plugin-hub/
├── plugins/              # Plugin directory
│   ├── my-plugin/
│   │   ├── plugin.ts    # Plugin definition
│   │   └── components/  # Plugin components
│   └── ...
├── src/
│   ├── app/
│   │   ├── api/         # Hub API endpoints
│   │   ├── admin/       # Admin UI
│   │   └── page.tsx     # Hub homepage
│   └── types/           # Type definitions
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## API Endpoints

- `GET /api/plugins` - List all plugins
- `GET /api/plugins/[slug]` - Get specific plugin

## Adding Plugins

1. Create directory: `plugins/my-plugin/`
2. Add `plugin.ts`:
   ```typescript
   import { PluginDefinition } from '@/types'
   
   export const myPlugin: PluginDefinition = {
     id: 'my-plugin',
     name: 'My Plugin',
     slug: 'my-plugin',
     version: '1.0.0',
     provider: 'My Company',
     category: 'other',
     status: 'approved',
     source: 'hub',
     // ... other fields
   }
   ```
3. Restart hub server

## Main App Integration

In your main app `.env`:

```bash
USE_PLUGIN_HUB=true
PLUGIN_HUB_URL=http://localhost:3001
# Or if running in Docker:
# PLUGIN_HUB_URL=http://plugin-hub:3001
```

## Docker Deployment

### Standalone Deployment

```bash
cd plugin-hub
docker-compose up -d
```

### With Main App

```bash
# From main project root
docker-compose -f docker-compose.hub.yml up -d
```

## Network Configuration

The hub runs on its own network but can communicate with main app:

```yaml
networks:
  mdm-network:
    driver: bridge
```

Main app should connect to hub via:
- **Development**: `http://localhost:3001`
- **Docker**: `http://plugin-hub:3001` (service name)
- **Production**: `https://hub.yourdomain.com`

## Ports

- **Hub**: 3001
- **Main App**: 3000
- **API**: 8302

## Features

- ✅ Standalone hub server
- ✅ Plugin discovery
- ✅ REST API for plugins
- ✅ Admin UI
- ✅ Docker support
- ✅ Separate deployment
