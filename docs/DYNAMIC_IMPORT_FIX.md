# Dynamic Import Fix for Marketplace Plugin Loader

**Date:** 2025-01-XX  
**Issue:** Next.js build error - "Module not found: Can't resolve <dynamic>"

---

## Problem

Next.js requires static paths for dynamic imports. The `plugin-loader.ts` was using dynamic string paths which Next.js cannot analyze at build time:

```typescript
// ❌ This doesn't work in Next.js
const component = await import(path) // path is a dynamic string
```

## Solution

Created a static import map that Next.js can analyze at build time:

```typescript
// ✅ Static import map
const PLUGIN_COMPONENT_MAP: Record<string, () => Promise<any>> = {
  '@/features/marketplace/plugins/power-bi/components/PowerBIIntegrationUI': () =>
    import('@/features/marketplace/plugins/power-bi/components/PowerBIIntegrationUI'),
  // ... more plugins
}
```

## Changes Made

### 1. Updated `plugin-loader.ts`

- Created `PLUGIN_COMPONENT_MAP` with static import functions
- Updated `loadComponent()` to use the static map
- Added error handling for missing paths

### 2. Updated Plugin Definitions

Updated all plugin definitions to use consistent absolute paths:

- ✅ `power-bi/plugin.ts` - Updated to use `@/features/marketplace/plugins/power-bi/components/PowerBIIntegrationUI`
- ✅ `grafana/plugin.ts` - Updated to use `@/features/marketplace/plugins/grafana/components/GrafanaIntegrationUI`
- ✅ `looker-studio/plugin.ts` - Updated to use `@/features/marketplace/plugins/looker-studio/components/LookerStudioIntegrationUI`
- ✅ `redis-management/plugin.ts` - Updated to use `@/features/marketplace/plugins/redis-management/components/RedisManagementUI`
- ✅ `postgresql-management/plugin.ts` - Updated to use `@/features/marketplace/plugins/postgresql-management/components/PostgreSQLManagementUI`
- ✅ `minio-management/plugin.ts` - Already using absolute path
- ✅ `kong-management/plugin.ts` - Already using absolute path

### 3. Updated ServiceManagement Component

- Changed to use `pluginLoader` from marketplace feature module
- Uses the static import map for Next.js compatibility

### 4. Updated Marketplace Index

- Exported `pluginLoader` singleton instance for easy access

## How It Works

1. **Plugin Definition** specifies component path:
   ```typescript
   uiConfig: {
     componentPath: '@/features/marketplace/plugins/power-bi/components/PowerBIIntegrationUI'
   }
   ```

2. **Plugin Loader** looks up path in static map:
   ```typescript
   const importFn = PLUGIN_COMPONENT_MAP[path]
   const component = await importFn()
   ```

3. **Next.js** can analyze all imports at build time ✅

## Adding New Plugins

When adding a new plugin:

1. Add the component path to `PLUGIN_COMPONENT_MAP` in `plugin-loader.ts`:
   ```typescript
   '@/features/marketplace/plugins/new-plugin/components/NewPluginUI': () =>
     import('@/features/marketplace/plugins/new-plugin/components/NewPluginUI'),
   ```

2. Use the absolute path in the plugin definition:
   ```typescript
   uiConfig: {
     componentPath: '@/features/marketplace/plugins/new-plugin/components/NewPluginUI'
   }
   ```

## Benefits

- ✅ Next.js build compatibility
- ✅ Type safety
- ✅ Better error messages
- ✅ Build-time analysis
- ✅ Code splitting works correctly

---

**Status:** ✅ **FIXED** - Dynamic import issue resolved

