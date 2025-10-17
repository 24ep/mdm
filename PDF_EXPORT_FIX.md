# PDF Export Fix - SignatureDoesNotMatch Error

## Problem
The PDF export functionality was failing with a `SignatureDoesNotMatch` error when trying to download files from S3. This error occurs when the request signature doesn't match what AWS S3 expects.

## Root Cause
The error was caused by:
1. **Signature Mismatch**: The request signature calculated by the client didn't match the signature expected by S3
2. **URL Mutation**: The presigned URL was being modified (headers added, query parameters changed) after generation
3. **Clock Skew**: Server and client clocks were out of sync
4. **Region/Bucket Mismatch**: Incorrect region or bucket configuration

## Solution Implemented

### 1. Server-Side Presigned URL Generation
- **File**: `src/lib/s3.ts`
- **Purpose**: Centralized S3 client configuration and presigned URL generation
- **Features**:
  - Supports both AWS S3 and MinIO (S3-compatible)
  - Configurable expiration time (default: 5 minutes)
  - Proper error handling and validation

### 2. API Route for Presigned URLs
- **File**: `src/app/api/attachments/presigned-url/route.ts`
- **Purpose**: Secure server-side generation of presigned URLs
- **Features**:
  - Authentication required
  - Short expiration time (5-10 minutes)
  - Validation of attachment keys
  - Proper error handling

### 3. Client-Side Download Utilities
- **File**: `src/lib/download-utils.ts`
- **Purpose**: Clean client-side download logic
- **Features**:
  - No header modification
  - Direct blob download
  - Automatic filename extraction
  - S3 URL parsing utilities

### 4. PDF Download Component
- **File**: `src/components/ui/pdf-download.tsx`
- **Purpose**: User-friendly PDF download interface
- **Features**:
  - Loading states
  - Error handling
  - Progress indication

### 5. Updated PDF Export Route
- **File**: `src/app/api/dashboards/[id]/export/pdf/route.ts`
- **Changes**:
  - Uses centralized S3 client
  - Returns S3 key instead of direct download
  - Simplified bucket configuration

## Environment Variables

### Required for AWS S3 (Production)
```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="studio-production"
```

### Required for MinIO (Local Development)
```env
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
S3_FORCE_PATH_STYLE="true"
```

### Optional
```env
AWS_SESSION_TOKEN="your-aws-session-token" # For temporary credentials
S3_ENDPOINT="" # For custom S3-compatible services
```

## Usage

### 1. Server-Side (API Route)
```typescript
import { generatePresignedDownloadUrl } from '@/lib/s3'

const presignedUrl = await generatePresignedDownloadUrl(
  'studio-production',
  'attachments/user-id/filename.pdf',
  300 // 5 minutes
)
```

### 2. Client-Side (Component)
```typescript
import { PdfDownload } from '@/components/ui/pdf-download'

<PdfDownload 
  dashboardId="dashboard-id"
  dashboardName="Dashboard Name"
/>
```

### 3. Direct Download
```typescript
import { downloadAttachment } from '@/lib/download-utils'

await downloadAttachment(
  'studio-production',
  'attachments/user-id/filename.pdf',
  { filename: 'custom-name.pdf' }
)
```

## Key Benefits

1. **Security**: Presigned URLs are generated server-side with proper authentication
2. **Reliability**: Short expiration times prevent URL reuse issues
3. **Compatibility**: Works with both AWS S3 and MinIO
4. **Error Handling**: Comprehensive error handling and user feedback
5. **Performance**: Direct blob download without server proxying

## Testing

1. **Local Development**: Uses MinIO with `S3_FORCE_PATH_STYLE=true`
2. **Production**: Uses AWS S3 with proper region configuration
3. **Error Scenarios**: Handles missing credentials, invalid keys, network errors

## Troubleshooting

### Common Issues

1. **SignatureDoesNotMatch**: 
   - Check region configuration
   - Verify credentials are correct
   - Ensure no URL modification after generation

2. **Access Denied**:
   - Verify S3 bucket permissions
   - Check IAM policy for the access key

3. **Network Errors**:
   - Check S3 endpoint configuration
   - Verify firewall/proxy settings

### Debug Steps

1. Check environment variables are set correctly
2. Verify S3 client configuration in `src/lib/s3.ts`
3. Test presigned URL generation in isolation
4. Check browser network tab for request details

## Future Improvements

1. **Caching**: Cache presigned URLs for frequently accessed files
2. **Progress**: Add download progress indicators
3. **Retry Logic**: Implement automatic retry for failed downloads
4. **Analytics**: Track download success/failure rates
