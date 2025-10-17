import { Pool as PgPool } from 'pg'
import mysql, { Pool as MySqlPool } from 'mysql2/promise'

export type ExternalDbType = 'postgres' | 'mysql'

export type ExternalConnectionConfig = {
  id: string
  db_type: ExternalDbType
  host: string
  port?: number | null
  database?: string | null
  username?: string | null
  password?: string | null
  options?: any
}

type ExternalClient = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>
  close: () => Promise<void>
}

export async function createExternalClient(config: ExternalConnectionConfig): Promise<ExternalClient> {
  if (config.db_type === 'postgres') {
    const connectionString = buildPostgresUrl(config)
    const pool = new PgPool({ connectionString })
    return {
      query: async (text: string, params: any[] = []) => {
        const client = await pool.connect()
        try {
          const res = await client.query(text, params)
          return { rows: res.rows }
        } finally {
          client.release()
        }
      },
      close: async () => {
        await pool.end()
      },
    }
  }

  if (config.db_type === 'mysql') {
    const pool: MySqlPool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.username || undefined,
      password: config.password || undefined,
      database: config.database || undefined,
      ...((config.options || {}) as any),
    })
    return {
      query: async (text: string, params: any[] = []) => {
        const [rows] = await pool.query(text, params)
        return { rows: Array.isArray(rows) ? (rows as any[]) : [] }
      },
      close: async () => {
        await pool.end()
      },
    }
  }

  throw new Error(`Unsupported external db_type: ${config.db_type}`)
}

function buildPostgresUrl(config: ExternalConnectionConfig): string {
  const user = encodeURIComponent(config.username || '')
  const pass = encodeURIComponent(config.password || '')
  const auth = user ? `${user}${pass ? `:${pass}` : ''}@` : ''
  const host = config.host
  const port = config.port ? `:${config.port}` : ''
  const db = config.database ? `/${config.database}` : ''
  return `postgres://${auth}${host}${port}${db}`
}


