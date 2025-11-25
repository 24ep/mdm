# Plugin Hub Deployment Guide

## Overview

Plugin Hub runs as a **completely separate service** with:
- ✅ Different port (3001)
- ✅ Separate Docker Compose
- ✅ Independent deployment
- ✅ Own network

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Main App       │         │  Plugin Hub       │
│  Port: 3000     │────────▶│  Port: 3001       │
│  Docker Compose │         │  Docker Compose   │
│  (main)         │         │  (hub)            │
└─────────────────┘         └──────────────────┘
```

---

## Deployment Options

### Option 1: Separate Docker Compose (Recommended)

**Hub runs independently:**

```bash
# Start hub
cd plugin-hub
docker-compose up -d

# Or from main project
docker-compose -f docker-compose.hub.yml up -d
```

**Main app connects via URL:**
```bash
# .env in main app
PLUGIN_HUB_URL=http://localhost:3001  # Development
# or
PLUGIN_HUB_URL=http://plugin-hub:3001  # Docker network
```

---

### Option 2: Combined Docker Compose

Add hub to main `docker-compose.yml`:

```yaml
services:
  # ... existing services ...
  
  plugin-hub:
    build:
      context: ./plugin-hub
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    networks:
      - mdm-network
    # ... rest of config
```

---

## Network Configuration

### Development (Local)

```
Main App (localhost:3000) → Plugin Hub (localhost:3001)
```

**Main App .env:**
```bash
PLUGIN_HUB_URL=http://localhost:3001
```

---

### Docker (Same Network)

```
Main App (mdm-app:3000) → Plugin Hub (plugin-hub:3001)
```

**Main App .env:**
```bash
PLUGIN_HUB_URL=http://plugin-hub:3001
```

**Create shared network:**
```bash
docker network create mdm-network
```

---

### Production (Different Servers)

```
Main App (app.yourdomain.com) → Plugin Hub (hub.yourdomain.com)
```

**Main App .env:**
```bash
PLUGIN_HUB_URL=https://hub.yourdomain.com
```

---

## Running Hub Separately

### Development

```bash
cd plugin-hub
npm install
npm run dev
# Runs on http://localhost:3001
```

### Production (Docker)

```bash
cd plugin-hub
docker-compose up -d
# Runs on http://localhost:3001
```

### Production (Standalone)

```bash
cd plugin-hub
npm install
npm run build
npm start
# Runs on http://localhost:3001
```

---

## Docker Compose Files

### Hub's Own Compose (`plugin-hub/docker-compose.yml`)

```yaml
services:
  plugin-hub:
    build: .
    ports:
      - "3001:3001"
    networks:
      - mdm-network
```

**Run:**
```bash
cd plugin-hub
docker-compose up -d
```

---

### Main Project Compose (`docker-compose.hub.yml`)

```yaml
services:
  plugin-hub:
    build:
      context: ./plugin-hub
    ports:
      - "3001:3001"
```

**Run:**
```bash
docker-compose -f docker-compose.hub.yml up -d
```

---

## Environment Variables

### Plugin Hub `.env`

```bash
PORT=3001
PLUGIN_HUB_DIR=./plugins
MAIN_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8302
```

### Main App `.env`

```bash
USE_PLUGIN_HUB=true
PLUGIN_HUB_URL=http://localhost:3001  # Development
# PLUGIN_HUB_URL=http://plugin-hub:3001  # Docker
# PLUGIN_HUB_URL=https://hub.yourdomain.com  # Production
```

---

## Network Setup

### Create Shared Network

```bash
docker network create mdm-network
```

### Connect Services

**Hub Compose:**
```yaml
networks:
  mdm-network:
    external: true
    name: mdm-network
```

**Main App Compose:**
```yaml
networks:
  mdm-network:
    external: true
    name: mdm-network
```

---

## Health Checks

Hub includes health check:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/api/plugins"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## Deployment Scenarios

### Scenario 1: Local Development

```bash
# Terminal 1: Main App
npm run dev  # Port 3000

# Terminal 2: Plugin Hub
cd plugin-hub
npm run dev  # Port 3001
```

---

### Scenario 2: Docker Development

```bash
# Start main app
docker-compose up -d

# Start hub separately
cd plugin-hub
docker-compose -f docker-compose.dev.yml up
```

---

### Scenario 3: Production (Separate Servers)

**Server 1: Main App**
```bash
docker-compose up -d
```

**Server 2: Plugin Hub**
```bash
cd plugin-hub
docker-compose up -d
```

**Connect via URL:**
```bash
PLUGIN_HUB_URL=https://hub.yourdomain.com
```

---

## Troubleshooting

### Hub Not Accessible

**Check:**
1. Hub is running: `docker ps | grep plugin-hub`
2. Port is exposed: `curl http://localhost:3001/api/plugins`
3. Network is connected: `docker network inspect mdm-network`
4. URL is correct in main app `.env`

### Connection Refused

**Solutions:**
1. Use service name in Docker: `http://plugin-hub:3001`
2. Use localhost in development: `http://localhost:3001`
3. Check firewall rules
4. Verify network configuration

---

## Summary

**Plugin Hub:**
- ✅ Runs on port 3001
- ✅ Separate Docker Compose
- ✅ Independent deployment
- ✅ Own network/service

**Main App:**
- ✅ Connects via URL
- ✅ No direct file access needed
- ✅ Works with remote hub

**Both can run completely independently!** 🎯

