# How to Add a Plugin to the Marketplace

This guide explains how to add a new plugin to the marketplace system.

## Overview

There are **three ways** to add plugins to the marketplace:

1. **UI Form (Easiest!)** 🎉: Use the "Add Plugin" button in the marketplace (admin only)
2. **Code-based plugins**: Define the plugin in code and register it (for built-in plugins)
3. **API-based plugins**: Register plugins directly via the API (for external/dynamic plugins)

## Method 0: UI Form (Easiest Way!) ⭐

**This is the simplest way to add a plugin - no code required!**

1. Go to the Marketplace page (`/marketplace` or `/[space]/marketplace`)
2. If you're an admin, you'll see an **"Add Plugin"** button in the top right
3. Click it to open a simple form
4. Fill in the required fields:
   - **Plugin Name**: Display name (e.g., "My Awesome Plugin")
   - **Slug**: Auto-generated from name, but you can edit it (URL-friendly)
   - **Version**: Plugin version (e.g., "1.0.0")
   - **Category**: Choose from the dropdown
   - **Provider**: Your company/name
5. Optionally fill in description and advanced options
6. Click **"Add Plugin"** - done! ✨

The plugin will be automatically registered and appear in the marketplace immediately.

## Method 1: Code-based Plugin Registration (Recommended)

### Step 1: Create Plugin Definition File

Create a new folder under `src/features/marketplace/plugins/` with your plugin name (e.g., `my-plugin`), and create a `plugin.ts` file:

```typescript
// src/features/marketplace/plugins/my-plugin/plugin.ts
import { PluginDefinition } from '../../types'

export const myPlugin: PluginDefinition = {
  id: 'my-plugin',
  name: 'My Plugin',
  slug: 'my-plugin',
  description: 'Description of what your plugin does',
  version: '1.0.0',
  provider: 'Your Company Name',
  providerUrl: 'https://yourcompany.com',
  category: 'business-intelligence', // or 'service-management', 'data-integration', 'automation', 'analytics', 'other'
  status: 'approved', // or 'pending', 'rejected', 'deprecated'
  verified: true, // Set to false if not verified
  capabilities: {
    // Define what your plugin can do
    customFeature: true,
  },
  apiBaseUrl: 'https://api.example.com', // Optional
  apiAuthType: 'oauth2', // or 'api_key', 'bearer', 'none'
  apiAuthConfig: {
    // OAuth config, API key config, etc.
  },
  uiType: 'react_component', // or 'iframe', 'web_component'
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/my-plugin/components/MyPluginUI',
    // Additional UI configuration
  },
  webhookSupported: false,
  webhookEvents: [],
  iconUrl: '/icons/my-plugin.svg',
  screenshots: [],
  documentationUrl: 'https://docs.example.com',
  supportUrl: 'https://support.example.com',
  pricingInfo: {
    type: 'free', // or 'subscription', 'one-time'
  },
  installationCount: 0,
  rating: undefined,
  reviewCount: 0,
  securityAudit: {
    lastAudited: new Date().toISOString(),
    vulnerabilities: [],
    compliance: [],
  },
}
```

### Step 2: Register Plugin in Index

Add your plugin to the `marketplacePlugins` array in `src/features/marketplace/plugins/index.ts`:

```typescript
import { myPlugin } from './my-plugin/plugin'

export const marketplacePlugins: PluginDefinition[] = [
  // ... existing plugins
  myPlugin,
]
```

### Step 3: Register Plugin in Database

You have two options:

#### Option A: Via API Endpoint (Recommended for Production)

Make a POST request to `/api/marketplace/plugins/register` as an admin:

```bash
curl -X POST http://localhost:3000/api/marketplace/plugins/register \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

This will register all plugins defined in `marketplacePlugins` array.

#### Option B: Via Direct API Call

Make a POST request to `/api/marketplace/plugins` with the plugin data:

```bash
curl -X POST http://localhost:3000/api/marketplace/plugins \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "My Plugin",
    "slug": "my-plugin",
    "description": "Description",
    "version": "1.0.0",
    "provider": "Your Company",
    "category": "business-intelligence",
    "status": "approved"
  }'
```

## Method 2: API-based Plugin Registration

For plugins that should be registered dynamically (not in code), use the POST endpoint directly:

**Endpoint:** `POST /api/marketplace/plugins`

**Required Fields:**
- `name`: Plugin name
- `slug`: Unique identifier (URL-friendly)
- `version`: Version string
- `provider`: Provider name
- `category`: One of: 'business-intelligence', 'service-management', 'data-integration', 'automation', 'analytics', 'other'

**Optional Fields:**
- `description`: Plugin description
- `providerUrl`: Provider website URL
- `capabilities`: JSON object with plugin capabilities
- `apiBaseUrl`: Base URL for plugin API
- `apiAuthType`: 'oauth2', 'api_key', 'bearer', or 'none'
- `apiAuthConfig`: Authentication configuration (JSON)
- `uiType`: 'iframe', 'react_component', or 'web_component'
- `uiConfig`: UI configuration (JSON)
- `webhookSupported`: Boolean
- `webhookEvents`: Array of webhook event names
- `iconUrl`: URL to plugin icon
- `screenshots`: Array of screenshot URLs
- `documentationUrl`: Documentation URL
- `supportUrl`: Support URL
- `pricingInfo`: Pricing information (JSON)

**Example Request:**

```typescript
const response = await fetch('/api/marketplace/plugins', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My Plugin',
    slug: 'my-plugin',
    description: 'A great plugin',
    version: '1.0.0',
    provider: 'My Company',
    category: 'business-intelligence',
    status: 'approved',
    verified: true,
    capabilities: {
      customFeature: true,
    },
  }),
})
```

## Plugin Categories

Available categories:
- `business-intelligence`: BI tools and dashboards
- `service-management`: Service management tools
- `data-integration`: Data integration services
- `automation`: Automation tools
- `analytics`: Analytics platforms
- `other`: Other types

## Plugin Status

- `pending`: Awaiting approval
- `approved`: Approved and available
- `rejected`: Rejected (not shown in marketplace)
- `deprecated`: Deprecated (shown but not installable)

## Example: Simple Service Management Plugin

Here's a minimal example for a service management plugin:

```typescript
// src/features/marketplace/plugins/my-service/plugin.ts
import { PluginDefinition } from '../../types'

export const myServicePlugin: PluginDefinition = {
  id: 'my-service',
  name: 'My Service',
  slug: 'my-service',
  description: 'Manage my service instances',
  version: '1.0.0',
  provider: 'MDM Platform',
  category: 'service-management',
  status: 'approved',
  verified: true,
  capabilities: {
    serviceType: 'docker_container',
    supportedServices: ['my-service'],
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/my-service/components/MyServiceUI',
  },
  iconUrl: '/icons/my-service.svg',
  installationCount: 0,
  reviewCount: 0,
}
```

## Creating UI Components

If your plugin uses `uiType: 'react_component'`, create a component file:

```typescript
// src/features/marketplace/plugins/my-plugin/components/MyPluginUI.tsx
'use client'

import { PluginInstallation } from '@/features/marketplace/types'

interface MyPluginUIProps {
  installation: PluginInstallation
  config?: Record<string, any>
}

export function MyPluginUI({ installation, config }: MyPluginUIProps) {
  return (
    <div>
      <h2>My Plugin Interface</h2>
      {/* Your plugin UI here */}
    </div>
  )
}
```

## Verification Checklist

- [ ] Plugin definition file created
- [ ] Plugin added to `marketplacePlugins` array
- [ ] Plugin registered in database (via API or script)
- [ ] UI component created (if using `react_component`)
- [ ] Icon file added to `/public/icons/` (if using custom icon)
- [ ] Plugin appears in marketplace at `/marketplace` or `/[space]/marketplace`

## Troubleshooting

1. **Plugin not appearing**: Check that it's registered in the database and has `status: 'approved'`
2. **Slug already exists**: Choose a different slug or update the existing plugin
3. **Permission denied**: Ensure you're logged in as an ADMIN user
4. **UI not loading**: Verify the component path in `uiConfig.componentPath` is correct

## Next Steps

After adding your plugin:
1. Test installation in a space
2. Verify UI rendering works correctly
3. Test any API integrations
4. Update documentation if needed

