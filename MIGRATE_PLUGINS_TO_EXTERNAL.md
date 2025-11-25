# Migrating Plugins to External Projects (Optional)

## Current Setup ✅

Your plugins are currently in:
```
src/features/marketplace/plugins/
├── minio-management/
├── redis-management/
├── power-bi/
└── ...
```

**These work perfectly as "built-in" plugins!** No changes needed.

---

## When to Move Plugins to External Projects

### ✅ **Keep as Built-in** (Recommended)
- Core service management plugins (MinIO, Redis, etc.)
- Plugins tightly integrated with your platform
- Plugins you maintain and control

### ⚠️ **Consider Moving to External** (Optional)
- Third-party integrations
- Community-contributed plugins
- Plugins updated frequently
- Plugins shared across multiple projects

---

## How to Move a Plugin (If You Want To)

### Step 1: Create External Plugin Project

```
workspace/
├── mdm/                           ← Main project
│   └── src/features/marketplace/plugins/
│       └── (keep core plugins here)
└── mdm-plugins/                   ← New external plugin project
    └── src/plugins/
        └── my-external-plugin/
            ├── plugin.ts
            └── components/
                └── MyPluginUI.tsx
```

### Step 2: Copy Plugin Files

```bash
# Copy plugin to external project
cp -r src/features/marketplace/plugins/my-plugin ../mdm-plugins/src/plugins/my-plugin
```

### Step 3: Update Plugin Definition

In the external plugin's `plugin.ts`:

```typescript
export const myPlugin: PluginDefinition = {
  // ... existing fields
  source: 'local-folder',
  sourcePath: '../mdm-plugins/src/plugins/my-plugin',
  // OR
  projectFolder: 'mdm-plugins',
  // ... rest of config
}
```

### Step 4: Register as External Plugin

Use the UI or API to register:
- Source: `local-folder`
- Project Folder: `mdm-plugins`
- OR Source Path: `../mdm-plugins/src/plugins/my-plugin`

### Step 5: Remove from Built-in (Optional)

If you want to completely move it:
1. Remove from `src/features/marketplace/plugins/my-plugin/`
2. Remove import from `src/features/marketplace/plugins/index.ts`
3. Plugin will load from external location

---

## Recommended Structure

### **Option A: Keep Everything Built-in** ✅ (Current)

```
mdm/
└── src/features/marketplace/plugins/
    ├── minio-management/      ← Built-in
    ├── redis-management/      ← Built-in
    └── power-bi/              ← Built-in
```

**Pros:**
- Simple
- Fast
- All in one place

### **Option B: Hybrid** (Recommended for Growth)

```
mdm/
└── src/features/marketplace/plugins/
    ├── minio-management/      ← Core, built-in
    └── redis-management/      ← Core, built-in

mdm-plugins/                    ← External project
    └── src/plugins/
        ├── power-bi/          ← External
        └── community-plugin/  ← External
```

**Pros:**
- Core plugins stay fast
- External plugins can be updated independently
- Better organization

### **Option C: All External** (Not Recommended)

Move everything to external projects.

**Cons:**
- More complex
- Slower loading
- More setup needed

---

## My Recommendation

### **Keep Current Setup** ✅

Your current plugins should stay as built-in because:
1. ✅ They're core functionality (service management)
2. ✅ They're tightly integrated
3. ✅ They're fast and simple
4. ✅ No need to change what works

### **Use External for New Plugins**

Use external plugins for:
- New third-party integrations
- Community plugins
- Experimental features
- Plugins you want to update independently

---

## Example: Adding a New External Plugin

Let's say you want to add a new plugin in a separate project:

1. **Create external project:**
   ```
   ../my-new-plugin/
   └── src/plugins/
       └── my-new-plugin/
           ├── plugin.ts
           └── components/
               └── MyNewPluginUI.tsx
   ```

2. **Register via UI:**
   - Source: "External Folder"
   - Project Folder: `my-new-plugin`
   - System finds: `../my-new-plugin/src/plugins/my-new-plugin`

3. **Done!** Plugin loads from external location.

---

## Summary

**Do you need to move existing plugins?** 
- ❌ **NO** - Keep them where they are!

**Should you move them?**
- ❌ **NO** - Current setup is perfect for built-in plugins

**When to use external?**
- ✅ For NEW plugins in separate projects
- ✅ For third-party/community plugins
- ✅ For plugins you want to update independently

**Your current plugins are fine!** The distributed system is for NEW plugins you want to put elsewhere. 🎯

