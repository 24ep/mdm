# API Architecture Guide

## Overview

This platform uses a **hybrid API architecture** to provide both internal application APIs and external/public REST APIs.

## Architecture Components

### 1. **Next.js API Routes** (`/api/*`) - Internal Application APIs
**Purpose:** Business logic, authentication, complex operations

**Characteristics:**
- Full control over request/response handling
- Built-in authentication via NextAuth
- Custom business logic and validation
- Permission-based access control
- Rate limiting and security features

**Use Cases:**
- User authentication (`/api/auth/*`)
- Data model operations with business logic (`/api/data-models/*`)
- File uploads with processing (`/api/attachments/*`)
- Workflow execution (`/api/workflows/*`)
- Admin operations (`/api/admin/*`)

**Example:**
```typescript
// src/app/api/data-models/[id]/data/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Business logic, validation, permissions...
  const data = await db.dataModel.findFirst({...})
  return NextResponse.json({ data })
}
```

### 2. **PostgREST API** (Port 3001) - External/Public REST APIs
**Purpose:** Auto-generated REST APIs for external integrations

**Characteristics:**
- Automatic REST endpoints from database schema
- OpenAPI/Swagger compliant
- Direct database access (read-only recommended for external)
- JWT authentication support
- Standard REST conventions

**Use Cases:**
- External system integrations
- Mobile app backends
- Third-party data access
- Public data endpoints
- API-first architectures

**Example:**
```bash
# Auto-generated endpoints
GET  http://localhost:3001/spaces
GET  http://localhost:3001/data_models?id=eq.{uuid}
POST http://localhost:3001/data_records
```

## Best Practices

### Security

#### PostgREST (External API)
1. **Enable JWT Authentication:**
   ```env
   PGRST_JWT_SECRET=your-secret-key
   ```

2. **Use Row Level Security (RLS):**
   - Configure PostgreSQL RLS policies
   - Limit access based on user context

3. **API Key Management:**
   - Issue API keys for external clients
   - Store in Vault or secure storage
   - Rotate keys regularly

4. **Rate Limiting:**
   - Implement at reverse proxy level (nginx)
   - Or use API gateway (Kong)

#### Next.js API Routes (Internal)
1. **Always authenticate:**
   ```typescript
   const session = await getServerSession(authOptions)
   if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   ```

2. **Check permissions:**
   ```typescript
   const hasPermission = await checkPermission(userId, 'data:read', spaceId)
   ```

3. **Validate input:**
   ```typescript
   const schema = z.object({...})
   const validated = schema.parse(body)
   ```

### When to Use Which API

#### Use Next.js API Routes When:
- ✅ Need custom business logic
- ✅ Complex data transformations
- ✅ File processing/upload
- ✅ Workflow execution
- ✅ Admin operations
- ✅ User-specific operations

#### Use PostgREST When:
- ✅ Simple CRUD operations
- ✅ External system integration
- ✅ Mobile app backend
- ✅ Public data access
- ✅ Standard REST API needs
- ✅ OpenAPI documentation needed

## Configuration

### PostgREST Setup

1. **Environment Variables:**
   ```env
   # PostgREST Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3001
   PGRST_DB_URI=postgres://user:pass@postgres-db:5432/dbname
   PGRST_DB_SCHEMAS=public
   PGRST_JWT_SECRET=your-jwt-secret  # For production
   ```

2. **Docker Compose:**
   ```yaml
   postgrest-api:
     image: postgrest/postgrest:v12.0.2
     environment:
       PGRST_DB_URI: postgres://...
       PGRST_DB_SCHEMAS: public
       PGRST_JWT_SECRET: ${PGRST_JWT_SECRET}
     ports:
       - "3001:3000"
   ```

### Next.js API Routes

Already configured via:
- `src/app/api/*/route.ts` files
- NextAuth for authentication
- Permission system for authorization

## External API Access

### For External Clients

1. **Get API Key:**
   - Admin creates API key in system
   - Key stored securely in Vault

2. **Authenticate:**
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        http://your-domain:3001/spaces
   ```

3. **Use PostgREST Endpoints:**
   ```bash
   # List data models
   GET /data_models?select=id,name,description
   
   # Filter
   GET /data_models?status=eq.active&select=*
   
   # Pagination
   GET /data_models?limit=10&offset=0
   ```

### For Internal Application

Use Next.js API routes:
```typescript
// In your components
const response = await fetch('/api/data-models', {
  headers: { 'Content-Type': 'application/json' }
})
```

## Migration Strategy

If you're currently using only one approach:

1. **Keep PostgREST** for external APIs
2. **Use Next.js routes** for internal logic
3. **Gradually migrate** simple CRUD to PostgREST if needed
4. **Keep complex logic** in Next.js routes

## Documentation

- **PostgREST OpenAPI:** `http://localhost:3001/` (auto-generated)
- **Next.js API Docs:** See `/api-docs` page in application
- **API Client:** Use `/admin/api-client` for testing

