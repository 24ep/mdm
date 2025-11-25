# Plugin Hub Setup Guide

## Overview

The Plugin Hub is a **separate repository** that contains all plugins. The marketplace loads plugins from the hub to display and install.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Plugin Hub     │         │   Marketplace    │         │  Installed      │
│  Repository     │────────▶│   (Main App)     │────────▶│  Plugins        │
│                 │         │                  │         │  (.plugins/)    │
│  All plugins    │         │  Browse & Install│         │  Active plugins │
│  stored here    │         │  from hub        │         │  in use         │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Setup Steps

### 1. Create Plugin Hub Repository

```bash
# Create new directory for plugin hub
mkdir mdm-plugin-hub
cd mdm-plugin-hub

# Initialize as git repo (optional)
git init

# Create plugins directory
mkdir -p plugins
```

### 2. Move Existing Plugins to Hub

```bash
# From your main project
cd mdm-plugin-hub/plugins

# Copy each plugin
cp -r ../mdm/src/features/marketplace/plugins/minio-management ./
cp -r ../mdm/src/features/marketplace/plugins/redis-management ./
cp -r ../mdm/src/features/marketplace/plugins/power-bi ./
# ... etc
```

### 3. Update Plugin Definitions

Each plugin in the hub should have `source: 'hub'`:

```typescript
// plugins/minio-management/plugin.ts
export const minioManagementPlugin: PluginDefinition = {
  // ... existing fields
  source: 'hub',
  sourceUrl: process.env.PLUGIN_HUB_URL || 'http://localhost:3001',
  // ... rest
}
```

### 4. Configure Environment Variables

**In Main Project (.env):**

```bash
# Plugin Hub Configuration
PLUGIN_HUB_DIR=../mdm-plugin-hub
PLUGIN_HUB_URL=http://localhost:3001
USE_PLUGIN_HUB=true
PLUGIN_INSTALL_DIR=.plugins/installed
```

**In Plugin Hub (.env):**

```bash
# Hub runs on different port
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:8302
```

### 5. Update Marketplace to Use Hub

The marketplace now automatically:
- Fetches plugins from `/api/plugin-hub/plugins`
- Shows hub plugins for installation
- Installs plugins to `.plugins/installed/`

---

## Plugin Hub Structure

```
mdm-plugin-hub/
├── plugins/
│   ├── minio-management/
│   │   ├── plugin.ts
│   │   └── components/
│   │       └── MinIOManagementUI.tsx
│   ├── redis-management/
│   │   ├── plugin.ts
│   │   └── components/
│   │       └── RedisManagementUI.tsx
│   └── ...
├── package.json
├── tsconfig.json
└── README.md
```

---

## Plugin Hub UI

Access the Plugin Hub UI at:
- **Main App**: `/marketplace` (shows hub plugins)
- **Hub Admin**: `/plugin-hub` (manage hub plugins)

### Hub Management Features

1. **Browse Plugins** - View all plugins in hub
2. **Add Plugin** - Add new plugin to hub
3. **Install Plugin** - Install plugin to main app
4. **Update Plugin** - Update plugin version
5. **Delete Plugin** - Remove from hub

---

## Installation Flow

### User Installs Plugin from Marketplace

1. User browses marketplace → sees hub plugins
2. User clicks "Install" on a plugin
3. System calls `/api/plugin-hub/plugins/[slug]/install`
4. Plugin files copied to `.plugins/installed/[slug]/`
5. Plugin registered in database
6. Plugin available for use

---

## API Endpoints

### Hub Endpoints (in Main App)

- `GET /api/plugin-hub/plugins` - List all hub plugins
- `GET /api/plugin-hub/plugins/[slug]` - Get specific plugin
- `POST /api/plugin-hub/plugins/[slug]/install` - Install plugin

### Marketplace Endpoints (Updated)

- `GET /api/marketplace/plugins?source=hub` - Fetch from hub
- `GET /api/marketplace/plugins?source=installed` - Fetch installed only
- `GET /api/marketplace/plugins?source=all` - Fetch both

---

## Migration from Built-in to Hub

### Step 1: Move Plugins

```bash
# Copy plugins to hub
cp -r src/features/marketplace/plugins/* ../mdm-plugin-hub/plugins/
```

### Step 2: Update Main App

Remove built-in plugin imports from `src/features/marketplace/plugins/index.ts`:

```typescript
// Remove these imports
// import { minioManagementPlugin } from './minio-management/plugin'
// ...

// Keep only hub loader
export const marketplacePlugins: PluginDefinition[] = []
```

### Step 3: Enable Hub Mode

```bash
# .env
USE_PLUGIN_HUB=true
PLUGIN_HUB_DIR=../mdm-plugin-hub
```

### Step 4: Test

1. Start main app
2. Go to `/marketplace`
3. Should see plugins from hub
4. Install a plugin
5. Verify it works

---

## Benefits

### ✅ **Separation of Concerns**
- Plugins in separate repo
- Main app doesn't include plugin code
- Easier to manage

### ✅ **Independent Updates**
- Update plugins without redeploying main app
- Version control per plugin
- Rollback individual plugins

### ✅ **Scalability**
- Add plugins without touching main codebase
- Multiple developers can work on plugins
- Community contributions easier

### ✅ **Deployment Flexibility**
- Deploy hub separately
- CDN for plugin distribution
- Multiple hub instances

---

## Development Workflow

### Adding New Plugin

1. **Create in Hub:**
   ```bash
   cd mdm-plugin-hub/plugins
   mkdir my-new-plugin
   # Create plugin.ts and components
   ```

2. **Test in Hub:**
   ```bash
   cd mdm-plugin-hub
   npm run dev
   # Visit http://localhost:3001/plugin-hub
   ```

3. **Install in Main App:**
   - Go to marketplace
   - Find plugin
   - Click install

### Updating Plugin

1. **Update in Hub:**
   ```bash
   cd mdm-plugin-hub/plugins/my-plugin
   # Make changes
   git commit -m "Update plugin"
   ```

2. **Reinstall in Main App:**
   - Uninstall old version
   - Install new version
   - Or use update API (future)

---

## Production Deployment

### Option 1: Local Hub Directory

```bash
# Deploy hub as directory
PLUGIN_HUB_DIR=/opt/mdm-plugin-hub
```

### Option 2: Remote Hub API

```bash
# Hub runs as separate service
PLUGIN_HUB_URL=https://hub.yourdomain.com
```

### Option 3: CDN Distribution

```bash
# Plugins served from CDN
PLUGIN_HUB_URL=https://cdn.yourdomain.com/plugins
```

---

## Security Considerations

1. **Plugin Verification**
   - Verify plugin signatures
   - Check checksums
   - Validate plugin structure

2. **Access Control**
   - Hub admin authentication
   - Plugin installation permissions
   - Rate limiting

3. **Sandboxing**
   - Run plugins in isolated environment
   - Limit API access
   - Monitor plugin behavior

---

## Troubleshooting

### Plugins Not Loading

**Check:**
1. `PLUGIN_HUB_DIR` path is correct
2. Hub directory exists
3. Plugin files are valid
4. Environment variables set

### Installation Fails

**Check:**
1. Write permissions on `.plugins/installed/`
2. Plugin structure is correct
3. Database connection
4. Plugin dependencies

### Hub Not Found

**Check:**
1. Hub directory exists
2. `PLUGIN_HUB_DIR` environment variable
3. Fallback to remote hub URL

---

## Next Steps

1. ✅ Create hub repository
2. ✅ Move existing plugins
3. ✅ Configure environment
4. ✅ Test installation
5. ⚠️ Add plugin versioning
6. ⚠️ Add update mechanism
7. ⚠️ Add plugin signing

---

## Summary

**Plugin Hub = Separate Repository for All Plugins**

- All plugins stored in hub
- Marketplace loads from hub
- Install to use in main app
- Independent updates
- Better organization

**Your plugins are now external!** 🎉

