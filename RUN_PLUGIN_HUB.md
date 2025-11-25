# Running the Plugin Hub

## Quick Start

### 1. Navigate to Hub Directory

```bash
cd plugin-hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Plugins Directory

```bash
mkdir plugins
```

### 4. Copy Existing Plugins (Optional)

```bash
# From main project root
cp -r src/features/marketplace/plugins/* plugin-hub/plugins/
```

### 5. Start Hub Server

```bash
npm run dev
```

Hub runs on **http://localhost:3001**

---

## Hub URLs

- **Homepage**: http://localhost:3001
- **Admin**: http://localhost:3001/admin
- **API**: http://localhost:3001/api/plugins

---

## Main App Configuration

Update your main app `.env`:

```bash
USE_PLUGIN_HUB=true
PLUGIN_HUB_URL=http://localhost:3001
PLUGIN_HUB_DIR=../plugin-hub/plugins
```

---

## Running Both Servers

### Terminal 1: Main App
```bash
cd mdm
npm run dev
# Runs on http://localhost:3000
```

### Terminal 2: Plugin Hub
```bash
cd plugin-hub
npm run dev
# Runs on http://localhost:3001
```

---

## Production

### Build Hub
```bash
cd plugin-hub
npm run build
npm start
```

### Deploy Hub Separately
- Deploy hub to separate server/domain
- Update `PLUGIN_HUB_URL` in main app
- Hub can be on different infrastructure

---

## Testing

1. **Start Hub**: `cd plugin-hub && npm run dev`
2. **Visit Hub**: http://localhost:3001
3. **Check API**: http://localhost:3001/api/plugins
4. **Start Main App**: `npm run dev`
5. **Visit Marketplace**: http://localhost:3000/marketplace
6. **Plugins should load from hub!**

---

## Troubleshooting

### Hub Not Starting
- Check if port 3001 is available
- Verify `node_modules` installed
- Check for TypeScript errors

### Plugins Not Loading
- Verify `plugins/` directory exists
- Check plugin files have `.ts` extension
- Verify plugin definitions are valid
- Check console for errors

### Main App Can't Connect
- Verify hub is running on port 3001
- Check `PLUGIN_HUB_URL` in main app `.env`
- Verify CORS if on different domains

---

## Next Steps

1. ✅ Hub is running
2. ✅ Add plugins to `plugins/` directory
3. ✅ Main app fetches from hub
4. ✅ Install plugins from marketplace

**Hub is ready!** 🎉

