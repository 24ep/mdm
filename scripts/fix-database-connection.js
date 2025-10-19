#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Database Connection Issues\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  log('Creating .env.local file...', 'blue');
  
  const envContent = `# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/customer_data_management

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
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
    fs.writeFileSync(envPath, envContent);
    logSuccess('.env.local created successfully');
  } catch (error) {
    logError('Failed to create .env.local: ' + error.message);
    logInfo('Please create .env.local manually with the database configuration');
  }
} else {
  logSuccess('.env.local already exists');
}

// Check database configuration
const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.ts');
if (fs.existsSync(dbPath)) {
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  
  if (dbContent.includes('54322')) {
    logWarning('Database configuration is set to Supabase port (54322)');
    logInfo('Make sure your .env.local has the correct DATABASE_URL for PostgreSQL (port 5432)');
  } else {
    logSuccess('Database configuration looks correct');
  }
}

// Check if database migrations exist
const sqlDir = path.join(process.cwd(), 'sql');
if (fs.existsSync(sqlDir)) {
  const files = fs.readdirSync(sqlDir);
  logSuccess(`Found ${files.length} SQL migration files`);
  
  files.forEach(file => {
    logInfo(`  - ${file}`);
  });
} else {
  logWarning('SQL migrations directory not found');
}

log('\n🎯 NEXT STEPS:', 'bright');
log('1. Update .env.local with your actual database credentials', 'yellow');
log('2. Make sure PostgreSQL is running on port 5432', 'yellow');
log('3. Test database connection: psql -h localhost -p 5432 -U postgres -d customer_data_management', 'yellow');
log('4. Run database migrations if needed', 'yellow');
log('5. Restart the application: npm run dev', 'yellow');

log('\n📋 DATABASE CONNECTION CHECKLIST:', 'bright');
log('□ PostgreSQL running on port 5432', 'blue');
log('□ Database "customer_data_management" exists', 'blue');
log('□ User has proper permissions', 'blue');
log('□ .env.local contains correct DATABASE_URL', 'blue');
log('□ Database migrations applied', 'blue');

log('\n🔧 TROUBLESHOOTING:', 'bright');
log('If you still get 500 errors:', 'yellow');
log('1. Check the terminal output for specific error messages', 'blue');
log('2. Verify database connection manually', 'blue');
log('3. Check if required tables exist', 'blue');
log('4. Ensure environment variables are loaded', 'blue');

log('\n🎉 Database connection fix script completed!', 'green');
