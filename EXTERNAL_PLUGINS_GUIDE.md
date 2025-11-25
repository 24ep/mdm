# External Plugins Guide - Distributed Plugin Architecture

## Overview

The platform now supports **distributed plugins** - plugins that can be in different project folders or loaded from external sources (CDN, Git, npm).

## Plugin Source Types

### 1. **Built-in** (Default)
- Plugins in the same project: `src/features/marketplace/plugins/`
- Deployed together with the app
- Fastest, most secure

### 2. **Local Folder** (Different Project)
- Plugins in a separate project folder
- Can be in a sibling directory or specified path
- Useful for monorepo or multi-repo setups

### 3. **External** (Remote Sources)
- **CDN**: Load from HTTP/HTTPS URL
- **Git**: Clone from Git repository
- **npm**: Install from npm package
- **External API**: Fetch from plugin server

---

## Setting Up External Plugins

### Environment Variables

Add these to your `.env` file:

```bash
# External plugin directories (comma-separated)
EXTERNAL_PLUGIN_DIRS=../plugin-project-1,../plugin-project-2,/path/to/plugins

# Plugin cache directory (for downloaded plugins)
PLUGIN_CACHE_DIR=.plugins

# Plugins base directory
PLUGINS_DIR=/opt/plugins
```

---

## Using the UI to Add External Plugins

### Step 1: Open Add Plugin Dialog
- Go to Marketplace → Add Plugin
- Select **Plugin Source** dropdown

### Step 2: Choose Source Type

#### **Option A: External Folder (Different Project)**

1. Select **"External Folder (Different Project)"**
2. Enter **Project Folder Name** (e.g., `my-plugin-project`)
   - System will look in: `../my-plugin-project/src/plugins/{slug}`
3. OR enter **Plugin Path** (full path)
   - Relative: `../my-plugin-project/src/plugins/my-plugin`
   - Absolute: `/opt/plugins/my-plugin`

#### **Option B: External URL**

1. Select **"External URL (CDN/Git/npm)"**
2. Enter **Source URL**:
   - Git: `https://github.com/user/plugin-repo`
   - CDN: `https://cdn.example.com/plugins/my-plugin@1.0.0.tar.gz`
   - npm: `@my-org/my-plugin` or `my-plugin-package`

---

## Project Structure for External Plugins

### Recommended Structure

```
my-plugin-project/
├── src/
│   └── plugins/
│       └── my-plugin/
│           ├── plugin.ts          ← Plugin definition
│           └── components/
│               └── MyPluginUI.tsx ← UI component
├── package.json
└── README.md
```

### Plugin File Format

```typescript
// plugin.ts
import { PluginDefinition } from '@mdm/marketplace-types'

export const myPlugin: PluginDefinition = {
  id: 'my-plugin',
  name: 'My Plugin',
  slug: 'my-plugin',
  version: '1.0.0',
  provider: 'My Company',
  category: 'service-management',
  status: 'approved',
  source: 'local-folder',
  sourcePath: '../my-plugin-project/src/plugins/my-plugin',
  uiType: 'react_component',
  uiConfig: {
    componentPath: './components/MyPluginUI',
  },
  // ... other fields
}
```

---

## API Endpoints

### Register External Plugin

```http
POST /api/marketplace/plugins/external/register
Content-Type: application/json

{
  "name": "My Plugin",
  "slug": "my-plugin",
  "version": "1.0.0",
  "provider": "My Company",
  "category": "service-management",
  "source": "local-folder",
  "projectFolder": "my-plugin-project",
  "sourcePath": "../my-plugin-project/src/plugins/my-plugin"
}
```

### Source Types

#### Local Folder
```json
{
  "source": "local-folder",
  "projectFolder": "my-plugin-project",
  "sourcePath": "../my-plugin-project/src/plugins/my-plugin"
}
```

#### Git Repository
```json
{
  "source": "git",
  "sourceUrl": "https://github.com/user/plugin-repo",
  "version": "v1.0.0"
}
```

#### CDN
```json
{
  "source": "cdn",
  "sourceUrl": "https://cdn.example.com/plugins/my-plugin@1.0.0.tar.gz",
  "downloadUrl": "https://cdn.example.com/plugins/my-plugin@1.0.0.tar.gz",
  "checksum": "sha256:abc123..."
}
```

#### npm Package
```json
{
  "source": "npm",
  "sourceUrl": "@my-org/my-plugin",
  "version": "1.0.0"
}
```

---

## How It Works

### 1. Plugin Registration

When you register an external plugin:
1. System validates the plugin path/URL
2. Checks if plugin file exists (for local-folder)
3. Stores plugin metadata in database
4. Sets `source` and `sourcePath` in capabilities

### 2. Plugin Loading

When plugin is used:
1. `PluginLoader` checks `plugin.source`
2. If external, uses `ExternalPluginLoader`
3. Loads plugin from appropriate source
4. Caches for performance

### 3. Component Loading

For React components:
1. Resolves component path relative to plugin
2. Loads component from external location
3. Renders in UI

---

## Examples

### Example 1: Plugin in Sibling Project

```
workspace/
├── mdm/                    ← Main project
│   └── src/
└── my-plugin-project/     ← Plugin project
    └── src/
        └── plugins/
            └── my-plugin/
                ├── plugin.ts
                └── components/
                    └── MyPluginUI.tsx
```

**Registration:**
- Source: `local-folder`
- Project Folder: `my-plugin-project`
- System resolves: `../my-plugin-project/src/plugins/my-plugin`

### Example 2: Plugin from Git

```
https://github.com/my-org/my-plugin-repo
├── plugin.ts
└── components/
    └── MyPluginUI.tsx
```

**Registration:**
- Source: `external`
- Source URL: `https://github.com/my-org/my-plugin-repo`
- System detects Git URL, sets `source: 'git'`
- Clones and caches in `.plugins/git/`

### Example 3: Plugin from npm

```bash
npm install @my-org/my-plugin
```

**Registration:**
- Source: `external`
- Source URL: `@my-org/my-plugin`
- System detects npm format, sets `source: 'npm'`
- Installs and caches in `.plugins/npm/`

---

## Path Resolution

The system resolves plugin paths in this order:

1. **Absolute paths** - Used as-is
2. **External plugin directories** - From `EXTERNAL_PLUGIN_DIRS`
3. **Project folder** - `../{projectFolder}/src/plugins/{slug}`
4. **Relative to project root** - `{sourcePath}`

---

## Security Considerations

### For External Plugins:

1. **Checksum Verification**
   ```json
   {
     "checksum": "sha256:abc123..."
   }
   ```

2. **Code Signing** (Future)
   ```json
   {
     "verified": true,
     "signature": "...",
     "signer": "trusted-provider"
   }
   ```

3. **Sandboxing** (Future)
   - Run plugins in isolated environment
   - Limit API access

---

## Troubleshooting

### Plugin Not Found

**Error:** `Plugin file not found: /path/to/plugin.ts`

**Solutions:**
1. Check plugin path is correct
2. Verify plugin file exists
3. Check `EXTERNAL_PLUGIN_DIRS` environment variable
4. Ensure path is accessible at runtime

### Component Not Loading

**Error:** `Component not found in external plugin`

**Solutions:**
1. Verify `componentPath` in `uiConfig`
2. Check component file exists
3. Ensure component is exported correctly
4. Check path is relative to plugin root

### Git Clone Fails

**Error:** `Failed to clone plugin repository`

**Solutions:**
1. Verify Git URL is accessible
2. Check network connectivity
3. Ensure Git is installed on server
4. Check repository permissions

---

## Best Practices

1. **Use Local Folder for Development**
   - Faster iteration
   - Easier debugging
   - No network dependency

2. **Use Git for Production**
   - Version control
   - Easy updates
   - Reproducible builds

3. **Use npm for Published Plugins**
   - Standard distribution
   - Dependency management
   - Versioning

4. **Cache Management**
   - Clear cache when updating plugins
   - Monitor cache size
   - Set up cache cleanup

---

## Migration from Built-in to External

To move a built-in plugin to external:

1. Copy plugin folder to external project
2. Update plugin definition with `source: 'local-folder'`
3. Register via external plugin API
4. Remove from built-in plugins (optional)

---

## Future Enhancements

- [ ] Plugin versioning and updates
- [ ] Automatic dependency resolution
- [ ] Plugin sandboxing
- [ ] Code signing and verification
- [ ] Plugin marketplace API
- [ ] Hot reloading for development

