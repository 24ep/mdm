# Attachment Infrastructure Setup Guide

## Prerequisites

1. **Supabase Running**: Ensure Supabase is started and accessible
2. **Node.js Dependencies**: Install required packages
3. **Storage Provider**: Configure at least one storage provider

## Step 1: Install Dependencies

```bash
# Install storage libraries
npm install minio @aws-sdk/client-s3 ssh2-sftp-client ftp uuid

# Install type definitions
npm install @types/ssh2-sftp-client @types/ftp @types/uuid
```

## Step 2: Apply Database Migrations

### Option A: Using Supabase CLI (Recommended)
```bash
# Start Supabase
npx supabase start

# Apply migrations
npx supabase db reset
```

### Option B: Manual Migration Script
```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run migration script
node scripts/apply-attachment-migrations.js
```

## Step 3: Configure Storage Provider

### MinIO (Default - Recommended for Development)

1. **Start MinIO**:
```bash
# Using Docker
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

2. **Access MinIO Console**: http://localhost:9001
   - Username: `minioadmin`
   - Password: `minioadmin`

3. **Create Bucket**: Create a bucket named `attachments`

### AWS S3 (Production)

1. **Create S3 Bucket**:
   - Go to AWS S3 Console
   - Create a new bucket
   - Configure permissions

2. **Create IAM User**:
   - Create user with programmatic access
   - Attach S3 policy with read/write permissions
   - Save access key and secret key

### SFTP/FTP (Alternative)

1. **Set up SFTP/FTP Server**
2. **Create upload directory**
3. **Configure user permissions**

## Step 4: Configure Environment Variables

Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# MinIO Configuration (Default)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attachments

# AWS S3 Configuration (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket

# File Upload Limits
MAX_FILE_SIZE_MB=10
MAX_FILES_PER_ATTRIBUTE=10
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt,mp4,mp3,zip
```

## Step 5: Test the Implementation

### 1. Access Test Page
Navigate to: `http://localhost:3000/test-attachments`

### 2. Configure Storage in Space Settings
1. Go to Space Settings → Attachments
2. Select storage provider (MinIO recommended)
3. Configure provider settings
4. Test connection
5. Save configuration

### 3. Create Attachment Attribute
1. Go to Data Models
2. Create or edit a data model
3. Add an attribute with type "attachment"
4. Configure file restrictions if needed

### 4. Test File Upload
1. Use the test page with valid Space ID and Attribute ID
2. Try uploading different file types
3. Test file preview, download, and delete

## Step 6: Integration in Your App

### Using AttachmentManager Component

```tsx
import { AttachmentManager } from '@/components/ui/attachment-manager'

function MyForm() {
  return (
    <AttachmentManager
      spaceId="your-space-id"
      attributeId="your-attribute-id"
      maxFiles={5}
      maxFileSizeMB={10}
      allowedFileTypes={['jpg', 'png', 'pdf']}
      onAttachmentsChange={(attachments) => {
        console.log('Attachments:', attachments)
      }}
    />
  )
}
```

### Using the Hook

```tsx
import { useAttachments } from '@/hooks/use-attachments'

function MyComponent() {
  const {
    attachments,
    loading,
    uploading,
    uploadFile,
    deleteAttachment,
    downloadAttachment
  } = useAttachments({
    spaceId: 'your-space-id',
    attributeId: 'your-attribute-id'
  })

  // Use the hook methods...
}
```

## Troubleshooting

### Common Issues

#### 1. "Storage configuration not found"
- **Cause**: No storage provider configured for the space
- **Solution**: Configure storage in Space Settings → Attachments

#### 2. "Connection test failed"
- **Cause**: Invalid storage credentials or network issues
- **Solution**: 
  - Check credentials
  - Verify network connectivity
  - Ensure storage service is running

#### 3. "Upload failed"
- **Cause**: File validation or storage issues
- **Solution**:
  - Check file size limits
  - Verify file type restrictions
  - Ensure storage permissions

#### 4. "Database table does not exist"
- **Cause**: Migrations not applied
- **Solution**: Run database migrations

### Debug Mode

Enable debug logging:

```env
DEBUG_ATTACHMENTS=true
```

### Check Logs

```bash
# Check Supabase logs
npx supabase logs

# Check application logs
npm run dev
```

## Production Deployment

### 1. Environment Configuration
- Set production environment variables
- Configure secure storage credentials
- Set appropriate file size limits

### 2. Storage Provider Setup
- Use production storage (AWS S3, MinIO cluster)
- Configure CDN for file serving
- Set up monitoring and alerts

### 3. Security Considerations
- Enable file scanning
- Set up access logging
- Configure backup strategies
- Implement rate limiting

### 4. Performance Optimization
- Configure file compression
- Set up caching
- Optimize database queries
- Monitor storage usage

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check database and application logs
4. Contact the development team

## Next Steps

After successful setup:
1. Configure production storage
2. Set up monitoring
3. Implement file scanning
4. Add CDN integration
5. Set up backup strategies
