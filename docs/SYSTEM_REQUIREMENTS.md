# System Requirements & Deployment Guide

**Version:** 1.0  
**Last Updated:** 2025-01-XX

---

## 📋 Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [Software Requirements](#software-requirements)
3. [Database Requirements](#database-requirements)
4. [Network Requirements](#network-requirements)
5. [Security Requirements](#security-requirements)
6. [Deployment Guide](#deployment-guide)
7. [Configuration](#configuration)
8. [Monitoring](#monitoring)

---

## 💻 Hardware Requirements

### Development Environment

| Component | Minimum | Recommended |
|-----------|---------|------------|
| **CPU** | 4 cores | 8+ cores |
| **RAM** | 8 GB | 16 GB |
| **Storage** | 20 GB free | 50 GB SSD |
| **Network** | 10 Mbps | 100 Mbps |

### Production Environment

#### Small Deployment (< 100 users)
| Component | Minimum | Recommended |
|-----------|---------|------------|
| **CPU** | 4 cores | 8 cores |
| **RAM** | 16 GB | 32 GB |
| **Storage** | 100 GB | 200 GB SSD |
| **Network** | 100 Mbps | 1 Gbps |

#### Medium Deployment (100-1000 users)
| Component | Minimum | Recommended |
|-----------|---------|------------|
| **CPU** | 8 cores | 16 cores |
| **RAM** | 32 GB | 64 GB |
| **Storage** | 500 GB | 1 TB SSD |
| **Network** | 1 Gbps | 10 Gbps |

#### Large Deployment (1000+ users)
| Component | Minimum | Recommended |
|-----------|---------|------------|
| **CPU** | 16 cores | 32+ cores |
| **RAM** | 64 GB | 128+ GB |
| **Storage** | 2 TB | 5+ TB SSD |
| **Network** | 10 Gbps | 25+ Gbps |

### Infrastructure Management Requirements

For managing infrastructure instances:

- **SSH Access:** Required for VM management
- **Docker API:** Required for Docker host management
- **Kubernetes API:** Required for K8s cluster management
- **Network Access:** Outbound access to managed instances

---

## 💿 Software Requirements

### Runtime Requirements

#### Node.js
- **Version:** 18.x or higher (LTS recommended)
- **Package Manager:** npm 9.x+ or yarn 1.22+
- **Installation:** [Node.js Official Site](https://nodejs.org/)

#### Database
- **PostgreSQL:** 15.x or higher
- **Extensions Required:**
  - `uuid-ossp` - UUID generation
  - `pg_trgm` - Text search
  - `pgcrypto` - Encryption
- **Installation:** [PostgreSQL Official Site](https://www.postgresql.org/download/)

#### Redis (Optional but Recommended)
- **Version:** 7.x or higher
- **Memory:** 2GB+ recommended
- **Installation:** [Redis Official Site](https://redis.io/download)

### Development Tools

#### Required
- **Git:** 2.30+ - [Git Official Site](https://git-scm.com/downloads)
- **TypeScript:** 5.x+ (included in package.json)
- **Next.js:** 16.x+ (included in package.json)

#### Recommended
- **VS Code:** Latest version
- **Docker Desktop:** 20.x+ (for local development)
- **Postman/Insomnia:** For API testing

### External Services

#### Required Services
- **PostgREST:** v12.0.2+ - REST API layer
- **MinIO:** Latest - Object storage
- **HashiCorp Vault:** Latest - Secrets management

#### Optional Services
- **Kong API Gateway:** 3.x+ - API management
- **Prometheus:** Latest - Metrics collection
- **Grafana:** Latest - Monitoring dashboards
- **ELK Stack:** Latest - Log aggregation

---

## 🗄️ Database Requirements

### PostgreSQL Configuration

#### Minimum Configuration
```ini
# postgresql.conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

#### Production Configuration
```ini
# postgresql.conf
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 16MB
min_wal_size = 2GB
max_wal_size = 8GB
```

### Database Extensions

```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional but recommended
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

### Storage Requirements

| Component | Minimum | Recommended |
|-----------|---------|------------|
| **Database Size** | 50 GB | 200+ GB |
| **Backup Storage** | 100 GB | 500+ GB |
| **Transaction Logs** | 10 GB | 50+ GB |

### Backup Requirements

- **Frequency:** Daily full backups
- **Retention:** 30 days minimum
- **Location:** Off-site backup storage
- **Testing:** Monthly restore testing

---

## 🌐 Network Requirements

### Ports Required

#### Application Ports
| Port | Service | Protocol | Access |
|------|---------|----------|--------|
| 3000 | Next.js App | HTTP/HTTPS | Public |
| 3001 | PostgREST API | HTTP/HTTPS | Public/Internal |
| 3002 | WebSocket Proxy | WS/WSS | Public |

#### Database Ports
| Port | Service | Protocol | Access |
|------|---------|----------|--------|
| 5432 | PostgreSQL | TCP | Internal |
| 8303 | PostgreSQL (Docker) | TCP | Internal |

#### Storage Ports
| Port | Service | Protocol | Access |
|------|---------|----------|--------|
| 9000 | MinIO API | HTTP/HTTPS | Internal |
| 9001 | MinIO Console | HTTP/HTTPS | Internal |

#### Infrastructure Ports
| Port | Service | Protocol | Access |
|------|---------|----------|--------|
| 8200 | Vault | HTTP/HTTPS | Internal |
| 8307 | Redis | TCP | Internal |

### Firewall Rules

#### Inbound Rules
```
Allow: 3000/tcp (HTTP)
Allow: 3000/tcp (HTTPS)
Allow: 3001/tcp (PostgREST)
Allow: 3002/tcp (WebSocket)
```

#### Outbound Rules
```
Allow: All (for external API calls)
Allow: 5432/tcp (PostgreSQL)
Allow: 9000/tcp (MinIO)
Allow: 8200/tcp (Vault)
Allow: 6379/tcp (Redis)
```

### Network Bandwidth

| Deployment Size | Minimum Bandwidth | Recommended |
|-----------------|-------------------|-------------|
| **Small** | 100 Mbps | 1 Gbps |
| **Medium** | 1 Gbps | 10 Gbps |
| **Large** | 10 Gbps | 25+ Gbps |

---

## 🔐 Security Requirements

### SSL/TLS

#### Production Requirements
- **HTTPS:** Required for all public endpoints
- **TLS Version:** 1.2 minimum, 1.3 recommended
- **Certificate:** Valid SSL certificate from trusted CA
- **Certificate Renewal:** Automated renewal (Let's Encrypt recommended)

#### Cipher Suites
```
TLS_AES_256_GCM_SHA384
TLS_CHACHA20_POLY1305_SHA256
TLS_AES_128_GCM_SHA256
```

### Authentication

#### Requirements
- **NextAuth.js:** 4.x+ for session management
- **JWT Tokens:** For API authentication
- **Session Storage:** Secure, encrypted session storage
- **Password Policy:** Minimum 8 characters, complexity requirements

#### OAuth Providers
- Google OAuth 2.0
- GitHub OAuth
- Microsoft Azure AD
- Custom OAuth providers

### Secrets Management

#### Vault Configuration
- **Backend:** Vault (production) or Database (development)
- **Encryption:** AES-256
- **Key Rotation:** Automated, every 90 days
- **Access Control:** Role-based access

#### Credential Storage
- **API Keys:** Stored in Vault
- **Database Passwords:** Stored in Vault
- **OAuth Secrets:** Stored in Vault
- **Service Credentials:** Stored in Vault

### Access Control

#### Requirements
- **RBAC:** Role-based access control
- **Space Permissions:** Per-space access control
- **Resource Permissions:** Per-resource permissions
- **API Permissions:** Per-endpoint permissions

#### Audit Logging
- **All Actions:** Logged with user, timestamp, action
- **Retention:** 90 days minimum
- **Storage:** Secure, encrypted audit log storage

---

## 🚀 Deployment Guide

### Docker Deployment (Recommended)

#### Prerequisites
```bash
# Install Docker
docker --version  # 20.x+

# Install Docker Compose
docker-compose --version  # 2.x+
```

#### Quick Start
```bash
# 1. Clone repository
git clone <repository-url>
cd mdm

# 2. Copy environment file
cp env.example .env

# 3. Edit .env with your configuration
nano .env

# 4. Start services
docker-compose up -d

# 5. Run migrations
docker-compose exec app npm run prisma:migrate

# 6. Access application
# http://localhost:3000
```

#### Docker Compose Services
```yaml
services:
  app:              # Next.js application
  postgres-db:      # PostgreSQL database
  postgrest-api:    # PostgREST API
  minio:            # MinIO storage
  vault:             # HashiCorp Vault
  redis:             # Redis cache
```

### Manual Deployment

#### Step 1: Install Dependencies
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql-15

# Install Redis (optional)
sudo apt-get install redis-server
```

#### Step 2: Database Setup
```bash
# Create database
sudo -u postgres createdb mdm

# Create user
sudo -u postgres createuser mdm_user

# Set password
sudo -u postgres psql -c "ALTER USER mdm_user WITH PASSWORD 'your_password';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mdm TO mdm_user;"
```

#### Step 3: Application Setup
```bash
# Install dependencies
npm install

# Build application
npm run build

# Run migrations
npm run prisma:migrate

# Start application
npm start
```

### Production Deployment

#### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# MinIO
MINIO_ENDPOINT=minio.example.com
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key

# Vault
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=your-vault-token

# Redis
REDIS_URL=redis://redis:6379
```

#### Process Manager (PM2)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "mdm" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ⚙️ Configuration

### Application Configuration

#### Next.js Config
```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-domain.com'],
  },
  env: {
    CUSTOM_KEY: 'value',
  },
}
```

#### TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Database Configuration

#### Connection Pool
```typescript
// src/lib/db.ts
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

---

## 📊 Monitoring

### Application Monitoring

#### Metrics to Monitor
- **Response Time:** < 500ms average
- **Error Rate:** < 1%
- **CPU Usage:** < 80%
- **Memory Usage:** < 80%
- **Database Connections:** < 80% of max

#### Logging
- **Application Logs:** Structured JSON logging
- **Error Logs:** Centralized error tracking
- **Access Logs:** Request/response logging
- **Audit Logs:** User action logging

### Database Monitoring

#### Metrics to Monitor
- **Query Performance:** Slow query logging
- **Connection Pool:** Active/idle connections
- **Database Size:** Growth rate
- **Replication Lag:** If using replication

### Infrastructure Monitoring

#### Metrics to Monitor
- **Instance Health:** Online/offline status
- **Service Status:** Running/stopped services
- **Resource Usage:** CPU, memory, disk
- **Network Latency:** Response times

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U mdm_user -d mdm

# Check logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### Application Issues
```bash
# Check application logs
pm2 logs mdm

# Restart application
pm2 restart mdm

# Check Node.js version
node --version
```

#### MinIO Issues
```bash
# Check MinIO status
docker-compose ps minio

# Check MinIO logs
docker-compose logs minio

# Test MinIO connection
mc alias set myminio http://localhost:9000 minioadmin minioadmin
mc admin info myminio
```

---

## 📚 Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PostgreSQL Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX

