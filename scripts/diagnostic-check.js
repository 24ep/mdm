#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 ATTACHMENT INFRASTRUCTURE DIAGNOSTIC CHECK\n');

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

// Check if file exists
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    logSuccess(`${description}: ${filePath}`);
    return true;
  } else {
    logError(`${description}: ${filePath} - NOT FOUND`);
    return false;
  }
}

// Check if directory exists
function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    logSuccess(`${description}: ${dirPath}`);
    return true;
  } else {
    logError(`${description}: ${dirPath} - NOT FOUND`);
    return false;
  }
}

// Check package.json dependencies
function checkDependencies() {
  log('\n📦 CHECKING DEPENDENCIES', 'cyan');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = packageJson.dependencies || {};
    
    if (dependencies['@aws-sdk/client-s3']) {
      logSuccess(`AWS SDK: ${dependencies['@aws-sdk/client-s3']}`);
    } else {
      logError('AWS SDK not found in package.json');
    }
    
    if (dependencies['pg']) {
      logSuccess(`PostgreSQL client: ${dependencies['pg']}`);
    } else {
      logWarning('PostgreSQL client (pg) not found - you may need to install it');
    }
    
  } catch (error) {
    logError('Could not read package.json');
  }
}

// Check database schema
function checkDatabaseSchema() {
  log('\n🗄️  CHECKING DATABASE SCHEMA', 'cyan');
  
  const schemaFile = 'sql/attachment_storage_setup.sql';
  if (checkFile(schemaFile, 'Database schema file')) {
    const content = fs.readFileSync(schemaFile, 'utf8');
    
    if (content.includes('space_attachment_storage')) {
      logSuccess('space_attachment_storage table definition found');
    } else {
      logError('space_attachment_storage table definition not found');
    }
    
    if (content.includes('attachment_files')) {
      logSuccess('attachment_files table definition found');
    } else {
      logError('attachment_files table definition not found');
    }
    
    if (content.includes('RLS')) {
      logSuccess('Row Level Security policies found');
    } else {
      logWarning('Row Level Security policies not found');
    }
  }
}

// Check API endpoints
function checkAPIEndpoints() {
  log('\n🔌 CHECKING API ENDPOINTS', 'cyan');
  
  const endpoints = [
    'src/app/api/spaces/[id]/attachment-storage-postgresql/route.ts',
    'src/app/api/attachments/upload-postgresql/route.ts'
  ];
  
  endpoints.forEach(endpoint => {
    checkFile(endpoint, `API endpoint: ${endpoint.split('/').pop()}`);
  });
}

// Check React components
function checkReactComponents() {
  log('\n⚛️  CHECKING REACT COMPONENTS', 'cyan');
  
  const components = [
    'src/components/ui/attachment-manager.tsx',
    'src/components/ui/file-upload.tsx',
    'src/components/ui/file-preview.tsx',
    'src/components/forms/attachment-field-integration.tsx',
    'src/components/forms/data-model-record-form.tsx',
    'src/hooks/use-attachments.ts'
  ];
  
  components.forEach(component => {
    checkFile(component, `Component: ${component.split('/').pop()}`);
  });
}

// Check setup scripts
function checkSetupScripts() {
  log('\n🛠️  CHECKING SETUP SCRIPTS', 'cyan');
  
  const scripts = [
    'scripts/setup-attachments-postgresql.js',
    'scripts/complete-attachment-setup.js'
  ];
  
  scripts.forEach(script => {
    checkFile(script, `Setup script: ${script.split('/').pop()}`);
  });
}

// Check documentation
function checkDocumentation() {
  log('\n📚 CHECKING DOCUMENTATION', 'cyan');
  
  const docs = [
    'docs/POSTGRESQL_SETUP.md',
    'docs/ATTACHMENT_INFRASTRUCTURE.md',
    'docs/SETUP_ATTACHMENTS.md',
    'docs/ENVIRONMENT_SETUP.md'
  ];
  
  docs.forEach(doc => {
    checkFile(doc, `Documentation: ${doc.split('/').pop()}`);
  });
}

// Check test pages
function checkTestPages() {
  log('\n🧪 CHECKING TEST PAGES', 'cyan');
  
  const testPages = [
    'src/app/test-attachments/page.tsx',
    'src/components/test/attachment-test.tsx'
  ];
  
  testPages.forEach(page => {
    checkFile(page, `Test page: ${page.split('/').pop()}`);
  });
}

// Check environment configuration
function checkEnvironmentConfig() {
  log('\n🔧 CHECKING ENVIRONMENT CONFIGURATION', 'cyan');
  
  const envFiles = [
    '.env.local',
    '.env.example'
  ];
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      logSuccess(`Environment file: ${envFile}`);
    } else {
      logWarning(`Environment file: ${envFile} - NOT FOUND (you may need to create it)`);
    }
  });
}

// Check Docker configuration
function checkDockerConfig() {
  log('\n🐳 CHECKING DOCKER CONFIGURATION', 'cyan');
  
  const dockerFiles = [
    'docker-compose.attachments.yml'
  ];
  
  dockerFiles.forEach(dockerFile => {
    checkFile(dockerFile, `Docker config: ${dockerFile}`);
  });
}

// Main diagnostic function
function runDiagnostic() {
  log('🚀 ATTACHMENT INFRASTRUCTURE DIAGNOSTIC CHECK', 'bright');
  log('=' .repeat(50), 'cyan');
  
  let totalChecks = 0;
  let passedChecks = 0;
  
  // Run all checks
  const checks = [
    checkDependencies,
    checkDatabaseSchema,
    checkAPIEndpoints,
    checkReactComponents,
    checkSetupScripts,
    checkDocumentation,
    checkTestPages,
    checkEnvironmentConfig,
    checkDockerConfig
  ];
  
  checks.forEach(check => {
    try {
      check();
    } catch (error) {
      logError(`Error in check: ${error.message}`);
    }
  });
  
  // Summary
  log('\n📊 DIAGNOSTIC SUMMARY', 'bright');
  log('=' .repeat(50), 'cyan');
  
  logInfo('If you see any ❌ errors above, those components need to be fixed');
  logInfo('If you see any ⚠️  warnings, those are optional but recommended');
  logInfo('If you see ✅ for all components, the implementation is complete!');
  
  log('\n🎯 NEXT STEPS:', 'bright');
  log('1. Fix any ❌ errors shown above', 'yellow');
  log('2. Run: node scripts/setup-attachments-postgresql.js', 'blue');
  log('3. Test: http://localhost:3000/test-attachments', 'blue');
  log('4. Configure storage in Space Settings → Attachments', 'blue');
  
  log('\n🎉 DIAGNOSTIC COMPLETE!', 'green');
}

// Run the diagnostic
runDiagnostic();
