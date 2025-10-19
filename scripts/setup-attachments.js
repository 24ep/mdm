#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Attachment Infrastructure...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  const envContent = `# Attachment Storage Configuration
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
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local created');
} else {
  console.log('✅ .env.local already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install @aws-sdk/client-s3', { stdio: 'inherit' });
  console.log('✅ AWS SDK installed');
} catch (error) {
  console.log('⚠️  AWS SDK installation failed, but continuing...');
}

// Start MinIO
console.log('\n🐳 Starting MinIO server...');
try {
  execSync('docker-compose -f docker-compose.attachments.yml up -d minio', { stdio: 'inherit' });
  console.log('✅ MinIO started');
} catch (error) {
  console.log('⚠️  MinIO startup failed, but continuing...');
}

// Check Supabase status
console.log('\n🗄️  Checking Supabase status...');
try {
  const status = execSync('npx supabase status', { encoding: 'utf8' });
  if (status.includes('API URL')) {
    console.log('✅ Supabase is running');
    
    // Apply migrations
    console.log('\n📊 Applying database migrations...');
    try {
      execSync('npx supabase db reset', { stdio: 'inherit' });
      console.log('✅ Database migrations applied');
    } catch (error) {
      console.log('⚠️  Migration failed, but continuing...');
    }
  } else {
    console.log('⚠️  Supabase not running, please start it manually');
  }
} catch (error) {
  console.log('⚠️  Supabase check failed, please start it manually');
}

console.log('\n🎉 Attachment infrastructure setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Access MinIO Console: http://localhost:9001');
console.log('2. Create bucket: "attachments"');
console.log('3. Go to Space Settings → Attachments');
console.log('4. Test connection with MinIO');
console.log('5. Create attachment attributes in your data models');
console.log('\n🔗 Test page: http://localhost:3000/test-attachments');
