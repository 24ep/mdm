# S3 PDF Export Implementation

This document describes the implementation of S3-based PDF export functionality to resolve the `SignatureDoesNotMatch` error.

## Problem

The original PDF export was failing with an AWS S3 `SignatureDoesNotMatch` error:
```
<Error>
  <Code>SignatureDoesNotMatch</Code>
  <Message>The request signature we calculated does not match the signature you provided. Check your key and signing method.</Message>
  <Key>attachments/660e8400-e29b-41d4-a716-446655440033/53c6b085-d0dd-47ee-9a4a-4c6a27589e10.pdf</Key>
  <BucketName>studio-production</BucketName>
</Error>
```

## Solution

The solution implements a server-side presigned URL generation approach that:

1. **Generates PDF on server** using Puppeteer
2. **Uploads PDF to S3** with proper credentials and configuration
3. **Returns S3 key** to client
4. **Client requests presigned URL** from server
5. **Downloads PDF** using fresh presigned URL

## Implementation Details

### 1. Server-Side Components

#### API Route: `/api/s3/presigned-url`
- **File**: `src/app/api/s3/presigned-url/route.ts`
- **Purpose**: Generates presigned URLs for S3 objects
- **Features**:
  - Supports both MinIO (local) and AWS S3 (production)
  - Configurable expiration time (default: 5 minutes)
  - Proper credential handling for temporary credentials

#### Updated PDF Export: `/api/dashboards/[id]/export/pdf`
- **File**: `src/app/api/dashboards/[id]/export/pdf/route.ts`
- **Changes**:
  - Generates PDF using Puppeteer
  - Uploads PDF to S3 instead of returning directly
  - Returns S3 key, bucket, and filename to client
  - Supports both MinIO and AWS S3 configurations

### 2. Client-Side Components

#### S3 Download Utility
- **File**: `src/lib/s3-download.ts`
- **Purpose**: Handles S3 file downloads using presigned URLs
- **Features**:
  - `downloadFromS3()`: Generic S3 download function
  - `downloadPDFFromS3()`: Specific PDF download function
  - `downloadAttachmentFromS3()`: Generic attachment download
  - Automatic filename extraction from S3 keys
  - Proper blob handling and browser download triggering

#### Updated Dashboard Pages
- **Files**: 
  - `src/app/dashboard/page.tsx`
  - `src/app/dashboards/[id]/page.tsx`
- **Changes**:
  - Updated `exportToPDF()` functions to use new S3 download approach
  - Proper error handling for S3 operations
  - User feedback via toast notifications

### 3. Configuration

#### Environment Variables

**Local Development (MinIO)**:
```env
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
```

**Production (AWS S3)**:
```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_SESSION_TOKEN="your-aws-session-token"  # Optional, for temporary credentials
AWS_S3_BUCKET="studio-production"
```

#### Dependencies
```json
{
  "@aws-sdk/client-s3": "^3.x.x",
  "@aws-sdk/s3-request-presigner": "^3.x.x"
}
```

## Usage

### Dashboard PDF Export

1. User clicks "Export to PDF" button
2. Server generates PDF using Puppeteer
3. PDF is uploaded to S3 with user-specific path: `attachments/{userId}/{filename}`
4. Server returns S3 key and bucket information
5. Client requests presigned URL from `/api/s3/presigned-url`
6. Client downloads PDF using presigned URL
7. Browser triggers download with proper filename

### API Endpoints

#### Generate Presigned URL
```http
POST /api/s3/presigned-url
Content-Type: application/json

{
  "key": "attachments/user123/dashboard_export.pdf",
  "bucket": "studio-production",
  "expiresIn": 300
}
```

**Response**:
```json
{
  "success": true,
  "url": "https://s3.amazonaws.com/studio-production/attachments/user123/dashboard_export.pdf?X-Amz-Algorithm=...",
  "expiresIn": 300
}
```

#### Export Dashboard PDF
```http
POST /api/dashboards/{id}/export/pdf
```

**Response**:
```json
{
  "success": true,
  "key": "attachments/user123/dashboard_name_1234567890.pdf",
  "bucket": "studio-production",
  "filename": "dashboard_name_1234567890.pdf",
  "message": "PDF generated and uploaded successfully"
}
```

## Error Handling

### Common Issues and Solutions

1. **SignatureDoesNotMatch**: 
   - **Cause**: Mismatched credentials, region, or bucket
   - **Solution**: Verify AWS credentials and region configuration

2. **Access Denied**:
   - **Cause**: Insufficient S3 permissions
   - **Solution**: Ensure IAM user/role has `s3:GetObject` and `s3:PutObject` permissions

3. **Bucket Not Found**:
   - **Cause**: Wrong bucket name or region
   - **Solution**: Verify bucket exists in the specified region

4. **Presigned URL Expired**:
   - **Cause**: URL expired (default: 5 minutes)
   - **Solution**: Regenerate presigned URL

## Testing

### Test S3 Connection
```http
GET /api/test-s3
```

This endpoint tests the S3 connection and returns bucket information.

### Local Testing with MinIO

1. Start MinIO: `docker-compose up minio`
2. Access MinIO console: `http://localhost:9001`
3. Create bucket: `attachments`
4. Test PDF export functionality

## Security Considerations

1. **Presigned URLs**: Short expiration time (5-10 minutes) to limit exposure
2. **User Isolation**: Files stored in user-specific paths (`attachments/{userId}/`)
3. **Authentication**: All endpoints require valid session
4. **Credential Management**: Server-side credential handling, never exposed to client

## Performance Considerations

1. **PDF Generation**: Puppeteer runs server-side, may impact server resources
2. **S3 Upload**: Asynchronous upload, doesn't block response
3. **Presigned URLs**: Generated on-demand, cached briefly if needed
4. **File Cleanup**: Consider implementing cleanup for old exports

## Future Enhancements

1. **Background Processing**: Move PDF generation to background jobs
2. **Caching**: Cache presigned URLs for repeated downloads
3. **Compression**: Compress PDFs before upload
4. **Progress Tracking**: Real-time progress for large exports
5. **Batch Exports**: Support for multiple dashboard exports
