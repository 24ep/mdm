'use client'

import { useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { validateSQLQuery } from '@/lib/query-execution/utils'

interface QueryValidationProps {
  query: string
  validation: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
}

export function QueryValidation({ query, validation }: QueryValidationProps) {
  if (!query.trim()) {
    return null
  }

  return (
    <>
      {/* Validation Status in Toolbar */}
      <div className="flex items-center gap-2">
        {validation.isValid ? (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">Valid</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-xs">{validation.errors.length} error(s)</span>
          </div>
        )}
        {validation.warnings.length > 0 && (
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">{validation.warnings.length} warning(s)</span>
          </div>
        )}
      </div>

      {/* Validation Panel */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="border-t border-border bg-muted p-3">
          <div className="space-y-2">
            {validation.errors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-red-600 font-medium text-sm mb-1">
                  <XCircle className="h-4 w-4" />
                  Errors ({validation.errors.length})
                </div>
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 ml-6">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {validation.warnings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-yellow-600 font-medium text-sm mb-1">
                  <AlertCircle className="h-4 w-4" />
                  Warnings ({validation.warnings.length})
                </div>
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-600 ml-6">
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Validation logic hook - uses shared query validation utilities
export function useQueryValidation() {
  const validateQuery = useCallback((sql: string) => {
    if (!sql.trim()) {
      return { isValid: true, errors: [], warnings: [] }
    }
    
    // Use shared validation utility
    const validation = validateSQLQuery(sql)
    
    // Add additional BigQuery-specific validations
    const upperSql = sql.trim().toUpperCase()
    const hasSelect = upperSql.includes('SELECT')
    const hasFrom = upperSql.includes('FROM')
    
    if (hasSelect && !hasFrom) {
      validation.warnings.push('SELECT statement without FROM clause')
    }
    
    // Check for missing semicolon
    if (!sql.trim().endsWith(';') && sql.trim().length > 10) {
      validation.warnings.push('Consider adding semicolon at the end')
    }
    
    // Check for LIMIT in large queries
    if (hasSelect && !upperSql.includes('LIMIT') && !upperSql.includes('WHERE')) {
      validation.warnings.push('Consider adding LIMIT clause for large result sets')
    }
    
    return validation
  }, [])

  return { validateQuery }
}
