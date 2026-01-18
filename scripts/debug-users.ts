
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function checkUsers() {
  const client = await pool.connect()
  try {
    const res = await client.query('SELECT id, email, role FROM public.users')
    console.log('Users found:', res.rows)
  } catch (e) {
    console.error(e)
  } finally {
    client.release()
  }
}

checkUsers()
