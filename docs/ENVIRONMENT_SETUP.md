# Environment Configuration for Attachment Storage

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Attachment Storage Configuration
# MinIO (Default Storage Provider)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attachments
MINIO_REGION=us-east-1

# AWS S3 Configuration (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# SFTP Configuration (Optional)
SFTP_HOST=your_sftp_host
SFTP_PORT=22
SFTP_USERNAME=your_username
SFTP_PASSWORD=your_password
SFTP_PATH=/uploads

# FTP Configuration (Optional)
FTP_HOST=your_ftp_host
FTP_PORT=21
FTP_USERNAME=your_username
FTP_PASSWORD=your_password
FTP_PATH=/uploads
```

## Setup Instructions

### 1. MinIO Setup (Default)
```bash
# Start MinIO server
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

# Access MinIO Console: http://localhost:9001
# Create bucket: "attachments"
```

### 2. AWS S3 Setup
1. Create AWS account and S3 bucket
2. Generate IAM user with S3 permissions
3. Add credentials to `.env.local`

### 3. SFTP Setup
1. Set up SFTP server
2. Create user with upload permissions
3. Add connection details to `.env.local`

### 4. FTP Setup
1. Set up FTP server
2. Create user with upload permissions
3. Add connection details to `.env.local`

## Testing Configuration

After setting up environment variables:

1. Go to Space Settings → Attachments
2. Select your storage provider
3. Click "Test Connection"
4. Verify successful connection

## Security Notes

- Never commit `.env.local` to version control
- Use strong passwords for production
- Consider using IAM roles for AWS S3
- Enable SSL/TLS for SFTP/FTP in production
