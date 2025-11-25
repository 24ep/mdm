# Migrate Plugins to Hub - Complete Guide

## Overview

This guide will help you move all plugins from built-in to the plugin hub, making everything external.

## Step 1: Run Migration Script

```bash
# Migrate all plugins to hub
node scripts/migrate-plugins-to-hub.js
```

This will:
- ✅ Copy all plugins from `src/features/marketplace/plugins/` to `plugin-hub/plugins/`
- ✅ Update each plugin to have `source: 'hub'`
- ✅ Keep original plugins intact (for safety)

## Step 2: Verify Migration

```bash
# Check hub directory
ls plugin-hub/plugins/

# You should see all your plugins:
# - minio-management/
# - redis-management/
# - power-bi/
# - etc.
```

## Step 3: Start Plugin Hub

```bash
cd plugin-hub
npm install  # If not already done
npm run dev
```

Hub runs on **http://localhost:3001**

## Step 4: Configure Main App

Update your `.env` file:

```bash
# Enable plugin hub
USE_PLUGIN_HUB=true
PLUGIN_HUB_URL=http://localhost:3001
PLUGIN_HUB_DIR=../plugin-hub/plugins
```

## Step 5: Test Hub

1. **Visit Hub**: http://localhost:3001
   - Should see all your plugins listed

2. **Visit Hub API**: http://localhost:3001/api/plugins
   - Should return JSON with all plugins

3. **Visit Marketplace**: http://localhost:3000/marketplace
   - Should load plugins from hub

## Step 6: Remove Built-in Plugins (Optional)

**⚠️ WARNING: Only do this after testing!**

```bash
# Remove built-in plugins
node scripts/remove-built-in-plugins.js
```

This will:
- ✅ Delete all plugins from `src/features/marketplace/plugins/`
- ✅ Update `index.ts` to empty array
- ✅ Keep `_template/` directory

## Manual Migration (Alternative)

If you prefer to do it manually:

### 1. Copy Plugins

```bash
# Copy each plugin
cp -r src/features/marketplace/plugins/minio-management plugin-hub/plugins/
cp -r src/features/marketplace/plugins/redis-management plugin-hub/plugins/
# ... etc
```

### 2. Update Plugin Definitions

In each `plugin.ts` file, add:

```typescript
export const myPlugin: PluginDefinition = {
  // ... existing fields
  source: 'hub',
  sourceUrl: process.env.PLUGIN_HUB_URL || 'http://localhost:3001',
  // ... rest
}
```

### 3. Update index.ts

Replace all imports with empty array:

```typescript
export const marketplacePlugins: PluginDefinition[] = []
```

## Verification Checklist

- [ ] All plugins copied to `plugin-hub/plugins/`
- [ ] Hub server running on port 3001
- [ ] Hub API returns plugins: http://localhost:3001/api/plugins
- [ ] Main app `.env` has `USE_PLUGIN_HUB=true`
- [ ] Marketplace loads plugins from hub
- [ ] Plugins can be installed from marketplace
- [ ] (Optional) Built-in plugins removed

## Troubleshooting

### Hub Not Loading Plugins

**Check:**
1. Hub server is running
2. Plugins are in `plugin-hub/plugins/` directory
3. Each plugin has `plugin.ts` file
4. Plugin definitions are valid

### Marketplace Not Showing Plugins

**Check:**
1. `USE_PLUGIN_HUB=true` in `.env`
2. `PLUGIN_HUB_URL` is correct
3. Hub server is accessible
4. Check browser console for errors

### Plugins Not Installing

**Check:**
1. Hub API is working
2. Installation API has correct permissions
3. `.plugins/installed/` directory exists
4. Check server logs for errors

## Rollback (If Needed)

If you need to rollback:

1. **Stop using hub:**
   ```bash
   # Remove from .env
   USE_PLUGIN_HUB=false
   ```

2. **Restore built-in plugins:**
   ```bash
   # Copy back from hub (if you didn't delete them)
   cp -r plugin-hub/plugins/* src/features/marketplace/plugins/
   ```

3. **Restore index.ts:**
   - Re-add plugin imports
   - Re-add to `marketplacePlugins` array

## After Migration

### Benefits

- ✅ All plugins external
- ✅ Independent updates
- ✅ Better organization
- ✅ Hub can be deployed separately

### Next Steps

1. Deploy hub separately (optional)
2. Add new plugins to hub only
3. Update plugins independently
4. Share hub with other instances

## Summary

**Before:**
```
src/features/marketplace/plugins/  ← Built-in plugins
```

**After:**
```
plugin-hub/plugins/  ← All plugins here (external)
src/features/marketplace/plugins/  ← Empty (or removed)
```

**All plugins are now in the hub!** 🎉

