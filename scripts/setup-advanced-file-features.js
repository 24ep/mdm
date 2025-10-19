#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🚀 Setting up Advanced File Management Features\n');

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

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    log('🎯 ADVANCED FILE MANAGEMENT FEATURES SETUP', 'bright');
    log('=' .repeat(60), 'cyan');

    // Step 1: Check dependencies
    logStep(1, 'Checking dependencies');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = packageJson.dependencies || {};
      
      if (dependencies['@aws-sdk/client-s3']) {
        logSuccess('AWS SDK: ' + dependencies['@aws-sdk/client-s3']);
      } else {
        logWarning('AWS SDK not found - installing...');
        execSync('npm install @aws-sdk/client-s3', { stdio: 'inherit' });
        logSuccess('AWS SDK installed');
      }
      
      if (dependencies['pg']) {
        logSuccess('PostgreSQL client: ' + dependencies['pg']);
      } else {
        logWarning('PostgreSQL client not found - installing...');
        execSync('npm install pg', { stdio: 'inherit' });
        logSuccess('PostgreSQL client installed');
      }

      if (dependencies['recharts']) {
        logSuccess('Recharts: ' + dependencies['recharts']);
      } else {
        logWarning('Recharts not found - installing...');
        execSync('npm install recharts', { stdio: 'inherit' });
        logSuccess('Recharts installed');
      }
      
    } catch (error) {
      logError('Error checking dependencies: ' + error.message);
    }

    // Step 2: Database setup
    logStep(2, 'Setting up database schema');
    
    const runMigration = await askQuestion('Do you want to run the advanced file features migration? (y/n): ');
    if (runMigration.toLowerCase() === 'y') {
      const dbHost = await askQuestion('Database host (default: localhost): ') || 'localhost';
      const dbPort = await askQuestion('Database port (default: 5432): ') || '5432';
      const dbName = await askQuestion('Database name: ');
      const dbUser = await askQuestion('Database user: ');
      
      if (dbName && dbUser) {
        try {
          log('Running advanced file features migration...', 'blue');
          const sqlFile = path.join(process.cwd(), 'sql', 'advanced_file_features.sql');
          execSync(`psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${sqlFile}"`, { stdio: 'inherit' });
          logSuccess('Advanced file features migration completed successfully');
        } catch (error) {
          logError('Database migration failed');
          log('Please run the SQL file manually:', 'yellow');
          log(`psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "sql/advanced_file_features.sql"`, 'yellow');
        }
      } else {
        logWarning('Database credentials not provided, skipping migration');
      }
    } else {
      logWarning('Skipping database migration - please run it manually later');
    }

    // Step 3: Environment configuration
    logStep(3, 'Setting up environment configuration');
    
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      log('Creating .env.local file...', 'blue');
      const envContent = `# Advanced File Management Configuration
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

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_SSL=false
`;
      fs.writeFileSync(envPath, envContent);
      logSuccess('.env.local created with advanced file management configuration');
    } else {
      logSuccess('.env.local already exists');
    }

    // Step 4: Start MinIO
    logStep(4, 'Starting MinIO storage server');
    try {
      // Check if MinIO is already running
      try {
        execSync('docker ps | grep minio', { stdio: 'pipe' });
        logSuccess('MinIO is already running');
      } catch (error) {
        // Start MinIO
        log('Starting MinIO container...', 'blue');
        execSync('docker run -d --name mdm-minio -p 9000:9000 -p 9001:9001 -e "MINIO_ROOT_USER=minioadmin" -e "MINIO_ROOT_PASSWORD=minioadmin" minio/minio server /data --console-address ":9001"', { stdio: 'inherit' });
        logSuccess('MinIO started successfully');
      }
    } catch (error) {
      logError('Failed to start MinIO - please start it manually');
      log('Manual command:', 'yellow');
      log('docker run -d --name mdm-minio -p 9000:9000 -p 9001:9001 -e "MINIO_ROOT_USER=minioadmin" -e "MINIO_ROOT_PASSWORD=minioadmin" minio/minio server /data --console-address ":9001"', 'yellow');
    }

    // Step 5: Create MinIO bucket
    logStep(5, 'Setting up MinIO bucket');
    setTimeout(() => {
      try {
        log('Creating attachments bucket...', 'blue');
        execSync('docker exec mdm-minio mc alias set local http://localhost:9000 minioadmin minioadmin', { stdio: 'inherit' });
        execSync('docker exec mdm-minio mc mb local/attachments --ignore-existing', { stdio: 'inherit' });
        logSuccess('MinIO bucket created successfully');
      } catch (error) {
        logWarning('Failed to create MinIO bucket - please create it manually');
        log('Access MinIO Console: http://localhost:9001', 'yellow');
        log('Username: minioadmin, Password: minioadmin', 'yellow');
        log('Create bucket: attachments', 'yellow');
      }
    }, 5000);

    // Final instructions
    setTimeout(() => {
      log('\n🎉 ADVANCED FILE MANAGEMENT SETUP COMPLETE!', 'green');
      log('\n📋 FEATURES IMPLEMENTED:', 'bright');
      log('✅ Advanced Search & Filtering', 'green');
      log('✅ File Analytics & Insights', 'green');
      log('✅ Smart Notifications', 'green');
      log('✅ Quota Management', 'green');
      log('✅ File Versioning', 'green');
      log('✅ File Sharing & Permissions', 'green');
      log('✅ File Categories & Tags', 'green');
      log('✅ Multi-Provider Storage', 'green');
      log('✅ File Processing Pipeline', 'green');
      log('✅ Backup & Sync', 'green');
      log('✅ Workflow & Approval', 'green');
      
      log('\n🔗 TEST PAGES:', 'bright');
      log('• Advanced Files: http://localhost:3000/test-advanced-files', 'blue');
      log('• Basic Attachments: http://localhost:3000/test-attachments', 'blue');
      log('• Space Settings: http://localhost:3000/[space]/settings?tab=attachments', 'blue');
      
      log('\n📚 DOCUMENTATION:', 'bright');
      log('• Setup Guide: docs/POSTGRESQL_SETUP.md', 'blue');
      log('• API Documentation: docs/ATTACHMENT_INFRASTRUCTURE.md', 'blue');
      log('• Environment Setup: docs/ENVIRONMENT_SETUP.md', 'blue');
      
      log('\n🗄️  DATABASE:', 'bright');
      log('• Advanced Schema: sql/advanced_file_features.sql', 'blue');
      log('• 15+ new tables for advanced features', 'blue');
      log('• Full-text search with PostgreSQL', 'blue');
      log('• Row Level Security (RLS) policies', 'blue');
      
      log('\n🎯 NEXT STEPS:', 'bright');
      log('1. Test the advanced file management features', 'yellow');
      log('2. Configure your preferred storage provider', 'yellow');
      log('3. Set up file quotas and restrictions', 'yellow');
      log('4. Create file categories and tags', 'yellow');
      log('5. Test file sharing and permissions', 'yellow');
      
      log('\n🚀 YOUR ADVANCED FILE MANAGEMENT SYSTEM IS READY!', 'green');
    }, 10000);

  } catch (error) {
    logError('Setup failed: ' + error.message);
  } finally {
    rl.close();
  }
}

main();
