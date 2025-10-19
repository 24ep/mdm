# Attachment Infrastructure Setup for PostgreSQL

## 🎯 **PostgreSQL-Specific Setup Guide**

This guide will help you set up the attachment infrastructure with your existing PostgreSQL database instead of Supabase.

## 📋 **Prerequisites**

- PostgreSQL database running
- Node.js and npm installed
- Docker installed (for MinIO)
- Your existing MDM application

## 🚀 **Quick Setup**

### **1. Run the PostgreSQL Setup Script**
```bash
node scripts/setup-attachments-postgresql.js
```

### **2. Manual Setup (Alternative)**

#### **Step 1: Install Dependencies**
```bash
npm install @aws-sdk/client-s3
```

#### **Step 2: Set Up Environment Variables**
Create `.env.local`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_SSL=false

# Attachment Storage Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attachments
MINIO_REGION=us-east-1
```

#### **Step 3: Run Database Migration**
```bash
psql -h localhost -p 5432 -U your_user -d your_database -f sql/attachment_storage_setup.sql
```

#### **Step 4: Start MinIO**
```bash
docker run -d --name mdm-minio -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

#### **Step 5: Create MinIO Bucket**
1. Access MinIO Console: http://localhost:9001
2. Login with: minioadmin / minioadmin
3. Create bucket: "attachments"

## 🗄️ **Database Schema**

The setup creates two new tables:

### **space_attachment_storage**
```sql
CREATE TABLE space_attachment_storage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('minio', 's3', 'sftp', 'ftp')),
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);
```

### **attachment_files**
```sql
CREATE TABLE attachment_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL,
    data_model_id UUID,
    attribute_id UUID,
    record_id UUID,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

## 🔧 **API Endpoints**

### **PostgreSQL-Compatible Endpoints**

#### **Storage Configuration**
- **GET** `/api/spaces/[id]/attachment-storage-postgresql`
- **PUT** `/api/spaces/[id]/attachment-storage-postgresql`

#### **File Operations**
- **POST** `/api/attachments/upload-postgresql`
- **GET** `/api/attachments/[id]/download`
- **DELETE** `/api/attachments/[id]`
- **GET** `/api/attachments`

## 🔐 **Authentication Integration**

You'll need to modify the API endpoints to work with your authentication system. The current implementation expects:

```typescript
// In your API endpoints, replace this:
const userId = request.headers.get('x-user-id')

// With your authentication logic:
const userId = await getCurrentUserId(request)
```

### **Example Authentication Helper**
```typescript
// src/lib/auth.ts
export async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your authentication logic here
  // This could be JWT token validation, session checking, etc.
  
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  
  // Validate token and return user ID
  // This is just an example - implement based on your auth system
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded.userId
  } catch {
    return null
  }
}
```

## 🎨 **Frontend Integration**

The frontend components are already implemented and will work with PostgreSQL. You just need to:

1. **Update API calls** to use the PostgreSQL endpoints
2. **Configure authentication** headers
3. **Test the integration**

### **Example API Call Update**
```typescript
// Before (Supabase)
const response = await fetch(`/api/spaces/${spaceId}/attachment-storage`)

// After (PostgreSQL)
const response = await fetch(`/api/spaces/${spaceId}/attachment-storage-postgresql`, {
  headers: {
    'x-user-id': currentUserId, // Add your auth header
    'Content-Type': 'application/json'
  }
})
```

## 🧪 **Testing**

### **1. Test Database Connection**
```bash
psql -h localhost -p 5432 -U your_user -d your_database -c "SELECT * FROM space_attachment_storage;"
```

### **2. Test MinIO Connection**
- Access: http://localhost:9001
- Login: minioadmin / minioadmin
- Verify bucket "attachments" exists

### **3. Test API Endpoints**
```bash
# Test storage configuration
curl -X GET http://localhost:3000/api/spaces/your-space-id/attachment-storage-postgresql \
  -H "x-user-id: your-user-id"

# Test file upload
curl -X POST http://localhost:3000/api/attachments/upload-postgresql \
  -H "x-user-id: your-user-id" \
  -F "file=@test-file.txt" \
  -F "spaceId=your-space-id" \
  -F "dataModelId=your-model-id" \
  -F "attributeId=your-attribute-id"
```

### **4. Test Frontend**
- Visit: http://localhost:3000/test-attachments
- Go to Space Settings → Attachments tab
- Test file uploads and downloads

## 🔧 **Configuration Options**

### **Storage Providers**

#### **MinIO (Default)**
```json
{
  "provider": "minio",
  "config": {
    "endpoint": "http://localhost:9000",
    "accessKey": "minioadmin",
    "secretKey": "minioadmin",
    "bucket": "attachments",
    "region": "us-east-1"
  }
}
```

#### **AWS S3**
```json
{
  "provider": "s3",
  "config": {
    "accessKeyId": "your-access-key",
    "secretAccessKey": "your-secret-key",
    "region": "us-east-1",
    "bucket": "your-bucket-name"
  }
}
```

#### **SFTP**
```json
{
  "provider": "sftp",
  "config": {
    "host": "your-sftp-host",
    "port": 22,
    "username": "your-username",
    "password": "your-password",
    "path": "/uploads"
  }
}
```

#### **FTP**
```json
{
  "provider": "ftp",
  "config": {
    "host": "your-ftp-host",
    "port": 21,
    "username": "your-username",
    "password": "your-password",
    "path": "/uploads"
  }
}
```

## 🚨 **Troubleshooting**

### **Database Connection Issues**
```bash
# Test connection
psql -h localhost -p 5432 -U your_user -d your_database -c "SELECT version();"

# Check if tables exist
psql -h localhost -p 5432 -U your_user -d your_database -c "\dt"
```

### **MinIO Issues**
```bash
# Check if MinIO is running
docker ps | grep minio

# Restart MinIO
docker restart mdm-minio

# Check MinIO logs
docker logs mdm-minio
```

### **API Issues**
- Check authentication headers
- Verify database permissions
- Check environment variables
- Review API endpoint logs

## 📚 **Next Steps**

1. **Customize Authentication**: Integrate with your existing auth system
2. **Configure Storage**: Set up your preferred storage provider
3. **Test Integration**: Verify all components work together
4. **Deploy**: Move to production with proper security settings

## 🎉 **You're Ready!**

The attachment infrastructure is now set up for PostgreSQL! You can:

- ✅ Upload and manage files
- ✅ Configure multiple storage providers
- ✅ Integrate with your data models
- ✅ Use the complete UI components

**Start testing at: http://localhost:3000/test-attachments**
