const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, 'bright');
  log(`STEP ${step}: ${message}`, 'bright');
  log('='.repeat(60), 'bright');
}

function runCommand(command, description) {
  try {
    log(`\n▶ Running: ${description}`, 'blue');
    log(`Command: ${command}`, 'yellow');
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function runScript(scriptPath, description) {
  try {
    log(`\n▶ Running: ${description}`, 'blue');
    log(`Script: ${scriptPath}`, 'yellow');
    execSync(`node ${scriptPath}`, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🚀 REMOTE SERVER SETUP SCRIPT', 'bright');
  log('This script will set up the database and run all setup scripts.\n', 'yellow');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    log('❌ DATABASE_URL environment variable is not set!', 'red');
    log('Please set DATABASE_URL in .env.local file', 'yellow');
    process.exit(1);
  }

  log(`📊 Database URL: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`, 'blue');

  const steps = [];
  let allSuccess = true;

  // Step 1: Generate Prisma Client
  logStep(1, 'Generate Prisma Client');
  if (!runCommand('npx prisma generate', 'Generate Prisma Client')) {
    allSuccess = false;
    steps.push('❌ Prisma Client generation failed');
  } else {
    steps.push('✅ Prisma Client generated');
  }

  // Step 2: Run Prisma Migrations
  logStep(2, 'Run Database Migrations');
  
  // Try migrate deploy first (for production/remote servers)
  let migrationSuccess = false;
  if (!runCommand('npx prisma migrate deploy', 'Run Database Migrations (deploy)')) {
    log('⚠️  migrate deploy failed, trying migrate dev...', 'yellow');
    if (!runCommand('npx prisma migrate dev', 'Run Database Migrations (dev)')) {
      log('⚠️  migrate dev failed, trying db:push as fallback...', 'yellow');
      if (!runCommand('npx prisma db push', 'Push Database Schema (fallback)')) {
        allSuccess = false;
        steps.push('❌ Database migrations failed');
        migrationSuccess = false;
      } else {
        steps.push('✅ Database schema pushed (fallback)');
        migrationSuccess = true;
      }
    } else {
      steps.push('✅ Database migrations completed (dev)');
      migrationSuccess = true;
    }
  } else {
    steps.push('✅ Database migrations completed (deploy)');
    migrationSuccess = true;
  }

  // Step 3: Run Seed (if exists)
  logStep(3, 'Seed Database');
  const seedPath = path.join(__dirname, 'seed-database.js');
  const fs = require('fs');
  if (fs.existsSync(seedPath)) {
    if (!runScript('scripts/seed-database.js', 'Seed Database')) {
      allSuccess = false;
      steps.push('❌ Database seeding failed');
    } else {
      steps.push('✅ Database seeded');
    }
  } else {
    log('⚠️  Seed script not found, skipping...', 'yellow');
    steps.push('⏭️  Database seeding skipped (script not found)');
  }

  // Step 4: Create Admin User
  logStep(4, 'Create Admin User');
  if (!runScript('scripts/create-admin-user.js', 'Create Admin User')) {
    allSuccess = false;
    steps.push('❌ Admin user creation failed');
  } else {
    steps.push('✅ Admin user created');
  }

  // Step 5: Create Comprehensive Data Models
  logStep(5, 'Create Comprehensive Data Models');
  if (!runScript('scripts/create-comprehensive-data-models.js', 'Create Comprehensive Data Models')) {
    allSuccess = false;
    steps.push('❌ Comprehensive data models creation failed');
  } else {
    steps.push('✅ Comprehensive data models created');
  }

  // Step 6: Create Customer Data Model
  logStep(6, 'Create Customer Data Model');
  if (!runScript('scripts/create-customer-data-model.js', 'Create Customer Data Model')) {
    allSuccess = false;
    steps.push('❌ Customer data model creation failed');
  } else {
    steps.push('✅ Customer data model created');
  }

  // Summary
  log('\n' + '='.repeat(60), 'bright');
  log('📋 SETUP SUMMARY', 'bright');
  log('='.repeat(60), 'bright');
  steps.forEach((step, index) => {
    log(`${index + 1}. ${step}`);
  });

  if (allSuccess) {
    log('\n🎉 All setup steps completed successfully!', 'green');
    log('\n📝 Next steps:', 'blue');
    log('   1. Verify the database connection');
    log('   2. Test the admin user login');
    log('   3. Check the data models in the application');
    process.exit(0);
  } else {
    log('\n⚠️  Some setup steps failed. Please review the errors above.', 'yellow');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };

