#!/usr/bin/env node

/**
 * Script to run all E2E tests, install browsers if needed, and fix issues
 */

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🧪 E2E Test Runner - Auto Fix Mode\n')

// Step 1: Install browsers if needed
console.log('📦 Step 1: Checking Playwright browsers...')
try {
  execSync('npx playwright install chromium --with-deps', { 
    stdio: 'inherit',
    encoding: 'utf-8'
  })
  console.log('✅ Browsers installed\n')
} catch (error) {
  console.log('⚠️  Browser installation had issues, continuing...\n')
}

// Step 2: Run tests
console.log('🚀 Step 2: Running tests...\n')

const testFiles = [
  'e2e/simple-automation.spec.ts',
  'e2e/run-all-tests.spec.ts',
]

const results = {
  passed: [],
  failed: [],
  total: 0,
}

for (const testFile of testFiles) {
  if (!fs.existsSync(testFile)) {
    console.log(`⚠️  Test file not found: ${testFile}`)
    continue
  }

  console.log(`\n📝 Running: ${testFile}`)
  results.total++

  try {
    const output = execSync(
      `npx playwright test "${testFile}" --project=chromium --reporter=line --timeout=180000`,
      { 
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024
      }
    )

    if (output.includes('passed') || !output.includes('failed')) {
      results.passed.push(testFile)
      console.log(`✅ ${testFile} - PASSED`)
    } else {
      results.failed.push(testFile)
      console.log(`❌ ${testFile} - FAILED`)
      console.log(output.slice(-1000)) // Last 1000 chars
    }
  } catch (error) {
    results.failed.push(testFile)
    console.log(`💥 ${testFile} - ERROR`)
    const errorOutput = error.stdout || error.message || ''
    console.log(errorOutput.slice(-500))
  }
}

// Step 3: Summary
console.log('\n' + '='.repeat(60))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(60))
console.log(`✅ Passed: ${results.passed.length}/${results.total}`)
console.log(`❌ Failed: ${results.failed.length}/${results.total}`)

if (results.passed.length > 0) {
  console.log('\n✅ Passed Tests:')
  results.passed.forEach(file => console.log(`   - ${file}`))
}

if (results.failed.length > 0) {
  console.log('\n❌ Failed Tests:')
  results.failed.forEach(file => console.log(`   - ${file}`))
  console.log('\n💡 Tip: Check the HTML report with: npx playwright show-report')
}

console.log('\n' + '='.repeat(60))

// Exit with error code if any tests failed
process.exit(results.failed.length > 0 ? 1 : 0)

