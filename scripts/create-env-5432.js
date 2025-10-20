#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Creating .env.local with port 5432\n');

const envContent = `# Database Configuration - PostgreSQL port 5432
DATABASE_URL=postgres://postgres:postgres@localhost:5432/customer_data_management

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here

# Application Settings
NEXT_PUBLIC_APP_NAME=Customer Data Management
NEXT_PUBLIC_API_URL=http://localhost:3001

# Attachment Storage Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attachments
MINIO_REGION=us-east-1
`;

try {
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ .env.local created with PostgreSQL port 5432');
  console.log('✅ Database URL: postgres://postgres:postgres@localhost:5432/customer_data_management');
  console.log('✅ NextAuth URL: http://localhost:3001');
} catch (error) {
  console.error('❌ Failed to create .env.local:', error.message);
}
