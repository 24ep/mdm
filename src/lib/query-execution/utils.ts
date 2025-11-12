/**
 * Shared Query Execution Utilities
 * Common utilities for query processing and validation
 */

import { QueryValidationResult } from './types'

/**
 * Validate SQL query syntax (basic validation)
 */
export function validateSQLQuery(query: string): QueryValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!query || query.trim().length === 0) {
    errors.push('Query cannot be empty')
    return { isValid: false, errors, warnings }
  }

  // Check for balanced parentheses
  const openParens = (query.match(/\(/g) || []).length
  const closeParens = (query.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push('Unbalanced parentheses')
  }

  // Check for balanced quotes
  const singleQuotes = (query.match(/'/g) || []).length
  if (singleQuotes % 2 !== 0) {
    errors.push('Unbalanced single quotes')
  }

  const doubleQuotes = (query.match(/"/g) || []).length
  if (doubleQuotes % 2 !== 0) {
    errors.push('Unbalanced double quotes')
  }

  // Check for potentially dangerous operations
  if (query.toUpperCase().includes('DROP TABLE')) {
    warnings.push('Query contains DROP TABLE statement')
  }

  if (query.toUpperCase().includes('DELETE FROM')) {
    warnings.push('Query contains DELETE statement')
  }

  if (query.toUpperCase().includes('TRUNCATE')) {
    warnings.push('Query contains TRUNCATE statement')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Format SQL query (basic formatting)
 */
export function formatSQLQuery(query: string): string {
  // Basic SQL formatting - can be enhanced with a proper SQL formatter
  return query
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    .trim()
}

/**
 * Extract table names from SQL query
 */
export function extractTableNames(query: string): string[] {
  const tableRegex = /FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
  const tables: string[] = []
  let match

  while ((match = tableRegex.exec(query)) !== null) {
    tables.push(match[1])
  }

  return Array.from(new Set(tables))
}

/**
 * Estimate query cost (rough estimate based on bytes)
 */
export function estimateQueryCost(bytesProcessed: number): number {
  // BigQuery pricing: $5 per TB (as of 2024)
  const costPerTB = 5
  const costPerByte = costPerTB / (1024 * 1024 * 1024 * 1024)
  return bytesProcessed * costPerByte
}

