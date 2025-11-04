const { execSync } = require('child_process')
const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

function log(msg) {
  console.log(msg)
}

function run(script, desc) {
  try {
    log(`\n▶ ${desc}`)
    execSync(`node ${script}`, { stdio: 'inherit' })
    log(`✅ ${desc} complete`)
  } catch (e) {
    log(`❌ ${desc} failed: ${e.message}`)
    process.exit(1)
  }
}

async function checkConnection() {
  const conn = process.env.DATABASE_URL
  if (!conn) {
    throw new Error('DATABASE_URL is not set')
  }
  const pool = new Pool({ connectionString: conn })
  try {
    const r = await pool.query('SELECT NOW() now')
    log(`✅ Database reachable: ${r.rows[0].now}`)
  } finally {
    await pool.end()
  }
}

async function main() {
  log('🌱 Starting database seed...')
  await checkConnection()
  run('scripts/create-admin-user.js', 'Create admin user')
  run('scripts/create-comprehensive-data-models.js', 'Create comprehensive data models')
  run('scripts/create-customer-data-model.js', 'Create customer data model')
  log('\n🎉 Seeding finished')
}

main().catch((e) => {
  console.error('Seed failed:', e.message)
  process.exit(1)
})


