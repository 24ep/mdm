# Quick Start Guide

This guide will help you get started with the MDM platform after the implementation phases.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Redis (optional, for production)
- MinIO/S3 (optional, for file storage)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run Database Migrations**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## 📋 Key Features

### 1. Marketplace Plugins
- Browse and install plugins from the marketplace
- Leave reviews and ratings
- Sync data from external services (Power BI, Grafana, etc.)

**Access:** `/marketplace` or `/admin/marketplace`

### 2. Bulk Operations
- Perform bulk operations on tickets, dashboards, and workflows
- Select multiple items and apply actions

**Access:** Available in list views with selection enabled

### 3. Import/Export Jobs
- Import data from CSV/Excel files
- Export data in multiple formats (XLSX, CSV, JSON)
- Track job progress in real-time

**Access:** `/import-export` or via data model management

### 4. Analytics & Monitoring
- View system metrics and performance
- Track resource usage
- Monitor user activity

**Access:** `/admin/analytics`

### 5. API Documentation
- Browse complete API documentation
- Test API endpoints
- View request/response schemas

**Access:** `/api-docs`

---

## 🔧 Configuration

### Marketplace Plugins

1. **Register Plugins**
   - Plugins are auto-registered on startup
   - Or use: `POST /api/marketplace/plugins/register`

2. **Install Plugin**
   - Browse marketplace
   - Click "Install" on desired plugin
   - Configure credentials and settings

3. **Test Connection**
   - Use test endpoint: `POST /api/marketplace/plugins/{serviceId}/test`
   - Or use UI in plugin configuration

4. **Sync Data**
   - Use sync endpoint: `POST /api/marketplace/plugins/{serviceId}/sync`
   - Or use UI in plugin configuration

### Job Queue

1. **Process Jobs**
   - Jobs are automatically queued when created
   - Process jobs: `POST /api/import-export/jobs/process`
   - Or set up cron job to call this endpoint periodically

2. **Check Job Status**
   - `GET /api/import-export/jobs/{jobId}/status?type=import|export`

### Rate Limiting

- Default: 100 requests per minute per IP
- Configurable per endpoint
- Uses Redis if available, falls back to in-memory

### Caching

- Redis-based caching (if Redis available)
- In-memory fallback
- Automatic cache invalidation

---

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Run Integration Tests
```bash
npm test -- --testPathPattern=integration
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run All Tests with Coverage
```bash
npm run test:coverage
```

---

## 📊 Monitoring

### View Analytics
- Navigate to `/admin/analytics`
- Select time range
- View metrics and charts

### View Usage Tracking
- Navigate to `/admin/analytics`
- Switch to "Usage Tracking" tab
- View resource usage and user activity

### API Request Logs
- Check `audit_logs` table in database
- Or use audit logging API

---

## 🔐 Security

### Permissions
- RBAC system with database-backed permissions
- Global and space-level roles
- Permission checking on all API endpoints

### Credentials
- Encrypted credential storage
- Stored in `service_installations` or `service_registry` tables
- Automatic encryption/decryption

### Rate Limiting
- Applied to all API endpoints
- Configurable per route
- Redis-based for production

---

## 🐛 Troubleshooting

### Jobs Not Processing
1. Check if job queue is running
2. Call `/api/import-export/jobs/process` manually
3. Set up cron job for automatic processing

### Plugin Sync Failing
1. Check credentials in installation
2. Test connection first
3. Check API logs for errors

### Rate Limiting Issues
1. Check Redis connection (if using Redis)
2. Verify rate limit configuration
3. Check IP address detection

---

## 📚 Additional Resources

- **API Documentation:** `/api-docs`
- **Implementation Report:** `docs/FINAL_IMPLEMENTATION_REPORT.md`
- **Phase Documentation:** `docs/PHASE_*_COMPLETE.md`

---

**Need Help?** Check the documentation or review the implementation reports for detailed information.

