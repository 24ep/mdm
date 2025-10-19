#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Complete Attachment Infrastructure Setup\n');

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

// Step 1: Check and create .env.local
logStep(1, 'Setting up environment configuration');
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
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

// Step 3: Stop conflicting containers
logStep(3, 'Stopping conflicting Docker containers');
try {
  execSync('docker stop mdm-supabase-rest-1 supabase-db 2>/dev/null || true', { stdio: 'inherit' });
  logSuccess('Conflicting containers stopped');
} catch (error) {
  logWarning('Some containers may not have been running');
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

// Step 5: Start Supabase
logStep(5, 'Starting Supabase services');
try {
  log('Starting Supabase...', 'blue');
  const supabaseProcess = spawn('npx', ['supabase', 'start'], { 
    stdio: 'pipe',
    shell: true 
  });
  
  let output = '';
  supabaseProcess.stdout.on('data', (data) => {
    output += data.toString();
    if (output.includes('API URL')) {
      logSuccess('Supabase started successfully');
      supabaseProcess.kill();
    }
  });
  
  supabaseProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  // Wait for Supabase to start
  setTimeout(() => {
    if (!output.includes('API URL')) {
      logWarning('Supabase may still be starting - please check manually');
    }
  }, 30000);
  
} catch (error) {
  logError('Failed to start Supabase - please start it manually');
  log('Manual command: npx supabase start', 'yellow');
}

// Step 6: Apply database migrations
logStep(6, 'Applying database migrations');
setTimeout(() => {
  try {
    log('Applying migrations...', 'blue');
    execSync('npx supabase db reset', { stdio: 'inherit' });
    logSuccess('Database migrations applied successfully');
  } catch (error) {
    logWarning('Migration failed - you may need to apply them manually');
    log('Manual command: npx supabase db reset', 'yellow');
  }
}, 10000); // Wait 10 seconds for Supabase to be ready

// Step 7: Create MinIO bucket
logStep(7, 'Setting up MinIO bucket');
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
}, 15000); // Wait 15 seconds for MinIO to be ready

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
}, 20000);
