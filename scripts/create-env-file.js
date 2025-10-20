#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Creating .env.local file\n');

const envContent = `# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/customer_data_management

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here

# Attachment Storage Configuration
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
`;

try {
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ .env.local file created successfully');
  console.log('📋 Please update the DATABASE_URL with your actual database credentials');
  console.log('🔧 Make sure PostgreSQL is running on port 5432');
} catch (error) {
  console.error('❌ Failed to create .env.local:', error.message);
  console.log('\n📝 Please create .env.local manually with the following content:');
  console.log(envContent);
}
