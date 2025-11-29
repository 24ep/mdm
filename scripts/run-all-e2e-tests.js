#!/usr/bin/env node

/**
 * Script to run all E2E tests and report results
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 Running all E2E tests...\n')

const testFiles = [
  'e2e/simple-automation.spec.ts',
  'e2e/automation.spec.ts',
  'e2e/comprehensive-automation.spec.ts',
  'e2e/user-interactions.spec.ts',
  'e2e/all-features.spec.ts',
  'e2e/run-all-tests.spec.ts',
  'e2e/tickets.spec.ts',
  'e2e/dashboards.spec.ts',
  'e2e/reports.spec.ts',
  'e2e/workflows.spec.ts',
  'e2e/infrastructure.spec.ts',
  'e2e/marketplace.spec.ts',
]

const results = {
  passed: [],
  failed: [],
  errors: [],
}

for (const testFile of testFiles) {
  if (!fs.existsSync(testFile)) {
    console.log(`⚠️  Test file not found: ${testFile}`)
    continue
  }

  console.log(`\n📝 Running: ${testFile}`)
  
  try {
    const output = execSync(
      `npx playwright test "${testFile}" --project=chromium --reporter=line --timeout=180000`,
      { 
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024 // 10MB
      }
    )
    
    if (output.includes('passed') || output.includes('✓')) {
      results.passed.push(testFile)
      console.log(`✅ ${testFile} - PASSED`)
    } else {
      results.failed.push(testFile)
      console.log(`❌ ${testFile} - FAILED`)
      console.log(output.slice(-500)) // Last 500 chars
    }
  } catch (error) {
    results.errors.push({ file: testFile, error: error.message })
    console.log(`💥 ${testFile} - ERROR: ${error.message}`)
  }
}

console.log('\n' + '='.repeat(60))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(60))
console.log(`✅ Passed: ${results.passed.length}`)
console.log(`❌ Failed: ${results.failed.length}`)
console.log(`💥 Errors: ${results.errors.length}`)
console.log(`📁 Total: ${testFiles.length}`)

if (results.passed.length > 0) {
  console.log('\n✅ Passed Tests:')
  results.passed.forEach(file => console.log(`   - ${file}`))
}

if (results.failed.length > 0) {
  console.log('\n❌ Failed Tests:')
  results.failed.forEach(file => console.log(`   - ${file}`))
}

if (results.errors.length > 0) {
  console.log('\n💥 Errors:')
  results.errors.forEach(({ file, error }) => {
    console.log(`   - ${file}: ${error}`)
  })
}

console.log('\n' + '='.repeat(60))

// Exit with error code if any tests failed
if (results.failed.length > 0 || results.errors.length > 0) {
  process.exit(1)
}

process.exit(0)

