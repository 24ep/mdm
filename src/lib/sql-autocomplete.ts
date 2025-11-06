/**
 * SQL Autocomplete Helper
 * Provides database schema-aware autocomplete for SQL queries
 */

import { Completion, CompletionContext } from '@codemirror/autocomplete'

export interface DatabaseSchema {
  tables: Array<{
    name: string
    columns: Array<{
      name: string
      type: string
      nullable?: boolean
    }>
  }>
  functions?: string[]
  keywords?: string[]
}

// Standard SQL keywords
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
  'TABLE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'DATABASE', 'SCHEMA',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'AND', 'OR', 'NOT', 'IN',
  'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ORDER', 'BY', 'GROUP', 'HAVING',
  'UNION', 'DISTINCT', 'LIMIT', 'OFFSET', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UPPER', 'LOWER', 'LENGTH', 'SUBSTRING', 'CONCAT',
  'CAST', 'CONVERT', 'DATE', 'TIME', 'TIMESTAMP', 'INTERVAL', 'EXTRACT', 'NOW', 'CURRENT_DATE',
  'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'IF', 'IFNULL', 'COALESCE', 'NULLIF',
  'SUBSTRING', 'TRIM', 'LTRIM', 'RTRIM', 'REPLACE', 'POSITION', 'CHAR_LENGTH',
  'ROUND', 'FLOOR', 'CEIL', 'ABS', 'POWER', 'SQRT', 'MOD',
  'WITH', 'RECURSIVE', 'UNION', 'ALL', 'INTERSECT', 'EXCEPT',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'UNIQUE', 'CHECK',
  'DEFAULT', 'AUTO_INCREMENT', 'IDENTITY', 'SEQUENCE',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'SAVEPOINT',
  'GRANT', 'REVOKE', 'DENY', 'EXEC', 'EXECUTE', 'CALL'
]

// PostgreSQL-specific functions
const POSTGRES_FUNCTIONS = [
  'array_agg', 'string_agg', 'json_agg', 'jsonb_agg',
  'json_build_object', 'jsonb_build_object',
  'to_char', 'to_date', 'to_timestamp',
  'date_trunc', 'age', 'extract',
  'array_length', 'array_upper', 'array_lower',
  'unnest', 'generate_series',
  'pg_typeof', 'pg_size_pretty'
]

// MySQL-specific functions
const MYSQL_FUNCTIONS = [
  'DATE_FORMAT', 'STR_TO_DATE',
  'GROUP_CONCAT', 'CONCAT_WS',
  'IFNULL', 'ISNULL', 'COALESCE',
  'FOUND_ROWS', 'ROW_COUNT',
  'LAST_INSERT_ID', 'AUTO_INCREMENT'
]

export function createSQLAutocomplete(schema?: DatabaseSchema, dialect: 'postgresql' | 'mysql' | 'generic' = 'postgresql') {
  return (context: CompletionContext): Completion[] | null => {
    // Guard against null context
    if (!context) return null
    
    const word = context.matchBefore(/\w*/)
    if (!word && !context.explicit) return null

    const completions: Completion[] = []
    const prefix = word?.text.toLowerCase() || ''

    // Add SQL keywords
    SQL_KEYWORDS.forEach(keyword => {
      if (keyword.toLowerCase().startsWith(prefix)) {
        completions.push({
          label: keyword,
          type: 'keyword',
          info: `SQL keyword: ${keyword}`
        })
      }
    })

    // Add database functions
    const functions = dialect === 'postgresql' ? POSTGRES_FUNCTIONS : MYSQL_FUNCTIONS
    functions.forEach(func => {
      if (func.toLowerCase().startsWith(prefix)) {
        completions.push({
          label: func,
          type: 'function',
          info: `SQL function: ${func}()`
        })
      }
    })

    // Add schema-aware completions
    if (schema) {
      // Table names
      schema.tables.forEach(table => {
        if (table.name.toLowerCase().startsWith(prefix)) {
          completions.push({
            label: table.name,
            type: 'class',
            info: `Table: ${table.name} (${table.columns.length} columns)`
          })
        }

        // Column names (when typing after table name or dot)
        const beforeCursor = context.state.doc.sliceString(0, context.pos)
        const tableMatch = beforeCursor.match(/(?:FROM|JOIN|UPDATE|INSERT\s+INTO)\s+(\w+)/i)
        const dotMatch = beforeCursor.match(/(\w+)\.\s*$/)
        
        if (tableMatch || dotMatch) {
          const referencedTable = (tableMatch?.[1] || dotMatch?.[1] || '').toLowerCase()
          if (table.name.toLowerCase() === referencedTable || !referencedTable) {
            table.columns.forEach(column => {
              if (column.name.toLowerCase().startsWith(prefix)) {
                completions.push({
                  label: column.name,
                  type: 'property',
                  info: `Column: ${column.name} (${column.type})${column.nullable ? '' : ' NOT NULL'}`,
                  apply: dotMatch ? column.name : `${table.name}.${column.name}`
                })
              }
            })
          }
        }
      })

      // Custom functions from schema
      if (schema.functions) {
        schema.functions.forEach(func => {
          if (func.toLowerCase().startsWith(prefix)) {
            completions.push({
              label: func,
              type: 'function',
              info: `Custom function: ${func}()`
            })
          }
        })
      }
    }

    // Sort completions: keywords first, then tables, then columns, then functions
    completions.sort((a, b) => {
      const typeOrder = { keyword: 0, class: 1, property: 2, function: 3, variable: 4 }
      const aOrder = typeOrder[a.type as keyof typeof typeOrder] ?? 5
      const bOrder = typeOrder[b.type as keyof typeof typeOrder] ?? 5
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.label.localeCompare(b.label)
    })

    return completions.length > 0 ? completions : null
  }
}

/**
 * Fetch database schema for autocomplete
 */
export async function fetchDatabaseSchema(spaceId?: string): Promise<DatabaseSchema> {
  try {
    const response = await fetch(`/api/db/schema${spaceId ? `?spaceId=${spaceId}` : ''}`)
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch database schema:', error)
  }

  // Return default schema with common tables
  return {
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'UUID' },
          { name: 'email', type: 'TEXT' },
          { name: 'name', type: 'TEXT' },
          { name: 'created_at', type: 'TIMESTAMPTZ' }
        ]
      },
      {
        name: 'spaces',
        columns: [
          { name: 'id', type: 'UUID' },
          { name: 'name', type: 'TEXT' },
          { name: 'slug', type: 'TEXT' },
          { name: 'created_at', type: 'TIMESTAMPTZ' }
        ]
      },
      {
        name: 'data_models',
        columns: [
          { name: 'id', type: 'UUID' },
          { name: 'name', type: 'TEXT' },
          { name: 'space_id', type: 'UUID' },
          { name: 'created_at', type: 'TIMESTAMPTZ' }
        ]
      }
    ]
  }
}

