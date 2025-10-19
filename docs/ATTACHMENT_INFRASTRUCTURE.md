# Attachment Infrastructure Documentation

## Overview

The attachment infrastructure provides a comprehensive file management system for data models with support for multiple storage providers, file validation, and secure access control.

## Features

### Storage Providers
- **MinIO** (Default): Self-hosted S3-compatible storage
- **AWS S3**: Cloud storage with IAM credentials
- **SFTP**: Secure file transfer with SSH
- **FTP**: Traditional file transfer protocol

### File Management
- Drag & drop file upload
- File type and size validation
- Progress indicators
- File preview (images, videos, PDFs)
- Download and delete operations
- Bulk file operations

### Security
- Space-level access control
- Role-based permissions
- File ownership tracking
- Secure credential storage
- RLS (Row Level Security) policies

## Architecture

### Database Schema

#### `space_attachment_storage`
Stores storage configuration for each space:
```sql
- id: UUID (Primary Key)
- space_id: UUID (Foreign Key to spaces)
- provider: VARCHAR (minio, s3, sftp, ftp)
- config: JSONB (Provider-specific configuration)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `attachment_files`
Stores metadata for uploaded files:
```sql
- id: UUID (Primary Key)
- attribute_id: UUID (Foreign Key to data_model_attributes)
- original_name: VARCHAR (Original filename)
- stored_name: VARCHAR (Unique stored filename)
- file_size: BIGINT (File size in bytes)
- content_type: VARCHAR (MIME type)
- storage_provider: VARCHAR (Storage provider used)
- storage_path: TEXT (Path in storage)
- storage_url: TEXT (Public URL if available)
- uploaded_by: UUID (Foreign Key to auth.users)
- uploaded_at: TIMESTAMP
```

### API Endpoints

#### Storage Configuration
- `GET /api/spaces/[id]/attachment-storage` - Get storage config
- `PUT /api/spaces/[id]/attachment-storage` - Save storage config
- `POST /api/spaces/[id]/attachment-storage/test` - Test connection

#### File Management
- `POST /api/attachments/upload` - Upload file
- `GET /api/attachments` - List files for attribute
- `GET /api/attachments/[id]` - Get file metadata
- `GET /api/attachments/[id]/download` - Download file
- `DELETE /api/attachments/[id]` - Delete file

### Components

#### Core Components
- `AttachmentManager` - Complete attachment management
- `FileUpload` - Drag & drop file upload
- `FilePreview` - File preview with actions
- `AttachmentField` - Form field for attachments

#### Hooks
- `useAttachments` - Attachment management hook

#### Utilities
- `AttachmentStorageService` - Storage abstraction layer
- `storage-config.ts` - Configuration utilities

## Configuration

### Environment Variables
```env
# MinIO (Default)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attachments

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket

# File Limits
MAX_FILE_SIZE_MB=10
MAX_FILES_PER_ATTRIBUTE=10
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt,mp4,mp3,zip
```

### Storage Provider Configuration

#### MinIO
```json
{
  "endpoint": "http://localhost:9000",
  "access_key": "minioadmin",
  "secret_key": "minioadmin",
  "bucket": "attachments",
  "region": "us-east-1",
  "use_ssl": false
}
```

#### AWS S3
```json
{
  "access_key_id": "AKIAIOSFODNN7EXAMPLE",
  "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "bucket": "my-attachments-bucket",
  "region": "us-east-1"
}
```

#### SFTP
```json
{
  "host": "sftp.example.com",
  "port": 22,
  "username": "username",
  "password": "password",
  "path": "/uploads"
}
```

#### FTP
```json
{
  "host": "ftp.example.com",
  "port": 21,
  "username": "username",
  "password": "password",
  "path": "/uploads",
  "passive": true
}
```

## Usage

### Setting Up Storage

1. Navigate to Space Settings → Attachments
2. Select storage provider
3. Configure provider-specific settings
4. Test connection
5. Save configuration

### Using in Forms

```tsx
import { AttachmentManager } from '@/components/ui/attachment-manager'

function MyForm() {
  return (
    <AttachmentManager
      spaceId="space-id"
      attributeId="attribute-id"
      maxFiles={5}
      maxFileSizeMB={10}
      allowedFileTypes={['jpg', 'png', 'pdf']}
      onAttachmentsChange={(attachments) => {
        console.log('Attachments changed:', attachments)
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
    spaceId: 'space-id',
    attributeId: 'attribute-id'
  })

  const handleFileUpload = async (file: File) => {
    await uploadFile(file)
  }

  return (
    <div>
      {attachments.map(attachment => (
        <div key={attachment.id}>
          {attachment.originalName}
        </div>
      ))}
    </div>
  )
}
```

## Security

### Access Control
- Only space members can upload files
- Users can only delete their own files
- Admins/owners can manage all files
- File access is controlled by space membership

### File Validation
- File type validation (extension and MIME type)
- File size limits
- File count limits
- Malicious file detection (planned)

### Storage Security
- Credentials encrypted in database
- Secure file paths with UUIDs
- No direct file access
- Audit logging (planned)

## Performance

### Optimizations
- Chunked uploads for large files
- File metadata caching
- CDN integration support
- Image compression (planned)

### Limits
- Default max file size: 10MB
- Default max files per attribute: 10
- Connection timeouts: 10 seconds
- Retry logic for failed operations

## Troubleshooting

### Common Issues

#### Connection Test Fails
- Check network connectivity
- Verify credentials
- Ensure ports are open
- Check firewall settings

#### Upload Fails
- Verify file size limits
- Check file type restrictions
- Ensure storage space available
- Check user permissions

#### Download Fails
- Verify file exists in storage
- Check storage configuration
- Ensure user has access
- Check file permissions

### Debug Mode
Enable debug logging by setting:
```env
DEBUG_ATTACHMENTS=true
```

## Future Enhancements

### Planned Features
- File versioning
- Virus scanning
- CDN integration
- Image thumbnails
- File search
- Bulk operations
- Audit logging
- Storage quotas
- File compression
- WebP conversion

### API Improvements
- GraphQL support
- WebSocket updates
- Batch operations
- Advanced filtering
- Pagination

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check database logs
4. Contact development team
