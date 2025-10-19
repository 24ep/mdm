#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🚀 Setting up Attachment Infrastructure for PostgreSQL\n');

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
    // Step 1: Check environment configuration
    logStep(1, 'Setting up environment configuration');
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      log('Creating .env.local file...', 'blue');
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
      logSuccess('.env.local created with default configuration');
    } else {
      logSuccess('.env.local already exists');
    }

    // Step 2: Install dependencies
    logStep(2, 'Installing required dependencies');
    try {
      log('Installing @aws-sdk/client-s3...', 'blue');
      execSync('npm install @aws-sdk/client-s3', { stdio: 'inherit' });
      logSuccess('AWS SDK installed successfully');
    } catch (error) {
      logWarning('AWS SDK installation failed - you may need to install it manually');
    }

    // Step 3: Database setup
    logStep(3, 'Setting up database schema');
    log('You need to run the SQL migration on your PostgreSQL database.', 'yellow');
    log('SQL file location: sql/attachment_storage_setup.sql', 'blue');
    
    const runMigration = await askQuestion('Do you want to run the migration now? (y/n): ');
    if (runMigration.toLowerCase() === 'y') {
      const dbHost = await askQuestion('Database host (default: localhost): ') || 'localhost';
      const dbPort = await askQuestion('Database port (default: 5432): ') || '5432';
      const dbName = await askQuestion('Database name: ');
      const dbUser = await askQuestion('Database user: ');
      
      if (dbName && dbUser) {
        try {
          log('Running database migration...', 'blue');
          const sqlFile = path.join(process.cwd(), 'sql', 'attachment_storage_setup.sql');
          execSync(`psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${sqlFile}"`, { stdio: 'inherit' });
          logSuccess('Database migration completed successfully');
        } catch (error) {
          logError('Database migration failed');
          log('Please run the SQL file manually:', 'yellow');
          log(`psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "sql/attachment_storage_setup.sql"`, 'yellow');
        }
      } else {
        logWarning('Database credentials not provided, skipping migration');
      }
    } else {
      logWarning('Skipping database migration - please run it manually later');
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
        // Use MinIO client to create bucket
        execSync('docker exec mdm-minio mc alias set local http://localhost:9000 minioadmin minioadmin', { stdio: 'inherit' });
        execSync('docker exec mdm-minio mc mb local/attachments --ignore-existing', { stdio: 'inherit' });
        logSuccess('MinIO bucket created successfully');
      } catch (error) {
        logWarning('Failed to create MinIO bucket - please create it manually');
        log('Access MinIO Console: http://localhost:9001', 'yellow');
        log('Username: minioadmin, Password: minioadmin', 'yellow');
        log('Create bucket: attachments', 'yellow');
      }
    }, 5000); // Wait 5 seconds for MinIO to be ready

    // Final instructions
    setTimeout(() => {
      log('\n🎉 Attachment Infrastructure Setup Complete!', 'green');
      log('\n📋 Next Steps:', 'bright');
      log('1. Access MinIO Console: http://localhost:9001', 'blue');
      log('2. Create bucket: "attachments" (if not created automatically)', 'blue');
      log('3. Go to Space Settings → Attachments tab', 'blue');
      log('4. Test connection with MinIO', 'blue');
      log('5. Create attachment attributes in your data models', 'blue');
      log('\n🔗 Test Pages:', 'bright');
      log('• Basic Test: http://localhost:3000/test-attachments', 'blue');
      log('• Space Settings: http://localhost:3000/[space]/settings?tab=attachments', 'blue');
      log('\n📚 Documentation:', 'bright');
      log('• Setup Guide: docs/SETUP_ATTACHMENTS.md', 'blue');
      log('• API Docs: docs/ATTACHMENT_INFRASTRUCTURE.md', 'blue');
      log('• Environment Setup: docs/ENVIRONMENT_SETUP.md', 'blue');
      log('\n🗄️  Database:', 'bright');
      log('• Run SQL migration: sql/attachment_storage_setup.sql', 'blue');
      log('• Tables created: space_attachment_storage, attachment_files', 'blue');
    }, 10000);

  } catch (error) {
    logError('Setup failed: ' + error.message);
  } finally {
    rl.close();
  }
}

main();
