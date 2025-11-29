#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🧪 Running ALL E2E Tests\n')

const testFiles = [
  'e2e/simple-automation.spec.ts',
  'e2e/run-all-tests.spec.ts',
  'e2e/automation.spec.ts',
  'e2e/comprehensive-automation.spec.ts',
  'e2e/user-interactions.spec.ts',
  'e2e/tickets.spec.ts',
  'e2e/dashboards.spec.ts',
  'e2e/reports.spec.ts',
  'e2e/workflows.spec.ts',
  'e2e/infrastructure.spec.ts',
  'e2e/marketplace.spec.ts',
]

const results = { passed: [], failed: [], total: 0 }

for (const testFile of testFiles) {
  if (!fs.existsSync(testFile)) {
    console.log(`⚠️  Skipping: ${testFile} (not found)`)
    continue
  }

  console.log(`\n📝 Testing: ${testFile}`)
  results.total++

  try {
    const output = execSync(
      `npx playwright test "${testFile}" --project=chromium --reporter=line --timeout=180000`,
      { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 }
    )

    const passedMatch = output.match(/(\d+)\s+passed/)
    const failedMatch = output.match(/(\d+)\s+failed/)
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0

    if (failed === 0 && passed > 0) {
      results.passed.push({ file: testFile, passed, failed })
      console.log(`✅ PASSED: ${passed} tests`)
    } else {
      results.failed.push({ file: testFile, passed, failed })
      console.log(`❌ FAILED: ${passed} passed, ${failed} failed`)
      if (output.length < 2000) console.log(output)
    }
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || error.message || ''
    results.failed.push({ file: testFile, error: errorOutput.slice(-500) })
    console.log(`💥 ERROR: ${errorOutput.slice(-200)}`)
  }
}

console.log('\n' + '='.repeat(60))
console.log('📊 FINAL RESULTS')
console.log('='.repeat(60))
console.log(`✅ Passed: ${results.passed.length}/${results.total} test files`)
console.log(`❌ Failed: ${results.failed.length}/${results.total} test files`)

const totalPassed = results.passed.reduce((sum, r) => sum + (r.passed || 0), 0)
const totalFailed = results.failed.reduce((sum, r) => sum + (r.failed || 0), 0)

console.log(`\n📈 Test Cases: ${totalPassed} passed, ${totalFailed} failed`)

if (results.passed.length > 0) {
  console.log('\n✅ Passed Test Files:')
  results.passed.forEach(({ file, passed }) => {
    console.log(`   - ${file} (${passed} tests)`)
  })
}

if (results.failed.length > 0) {
  console.log('\n❌ Failed Test Files:')
  results.failed.forEach(({ file, passed, failed, error }) => {
    console.log(`   - ${file}`)
    if (passed !== undefined) console.log(`     Passed: ${passed}, Failed: ${failed}`)
    if (error) console.log(`     Error: ${error.slice(0, 100)}...`)
  })
  console.log('\n💡 View detailed report: npx playwright show-report')
}

console.log('\n' + '='.repeat(60))
process.exit(results.failed.length > 0 ? 1 : 0)

