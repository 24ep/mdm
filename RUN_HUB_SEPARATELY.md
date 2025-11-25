# Running Plugin Hub Separately

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# From plugin-hub directory
cd plugin-hub
docker-compose up -d

# Hub runs on http://localhost:3001
```

### Option 2: From Main Project

```bash
# From main project root
docker-compose -f docker-compose.hub.yml up -d
```

### Option 3: Development Mode

```bash
cd plugin-hub
npm install
npm run dev

# Hub runs on http://localhost:3001
```

---

## Configuration

### Plugin Hub `.env`

```bash
PORT=3001
PLUGIN_HUB_DIR=./plugins
MAIN_APP_URL=http://localhost:3000
```

### Main App `.env`

```bash
USE_PLUGIN_HUB=true
PLUGIN_HUB_URL=http://localhost:3001
```

**For Docker:**
```bash
PLUGIN_HUB_URL=http://plugin-hub:3001
```

---

## Network Setup

### Create Shared Network

```bash
docker network create mdm-network
```

Both services use this network to communicate.

---

## Ports

- **Main App**: 3000 (or 8301 in Docker)
- **Plugin Hub**: 3001
- **API**: 8302

---

## Verify Hub is Running

```bash
# Check hub API
curl http://localhost:3001/api/plugins

# Check Docker container
docker ps | grep plugin-hub

# Check logs
docker logs mdm-plugin-hub
```

---

## Summary

**Plugin Hub:**
- ✅ Separate service
- ✅ Port 3001
- ✅ Own Docker Compose
- ✅ Independent deployment

**Main App:**
- ✅ Connects via URL
- ✅ No file system dependency
- ✅ Works with remote hub

**Both run completely independently!** 🎯

