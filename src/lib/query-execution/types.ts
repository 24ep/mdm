/**
 * Shared Query Execution Types
 * Common types for query execution across BigQuery and Data Science modules
 */

export interface QueryResult {
  data: any[]
  columns: string[]
  rowCount: number
  executionTime?: number
  bytesProcessed?: number
  cost?: number
}

export interface QueryExecutionOptions {
  timeout?: number
  maxResults?: number
  dryRun?: boolean
  useLegacySql?: boolean
}

export interface QueryHistoryItem {
  id: string
  query: string
  executedAt: Date
  executionTime?: number
  rowCount?: number
  error?: string
  result?: QueryResult
}

export interface QueryValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  estimatedCost?: number
  estimatedBytes?: number
}

