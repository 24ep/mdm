'use client'

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

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
        <div className="border-t border-gray-200 bg-gray-50 p-3">
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

// Validation logic hook
export function useQueryValidation() {
  const validateQuery = (sql: string) => {
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!sql.trim()) {
      return { isValid: true, errors: [], warnings: [] }
    }
    
    // Basic SQL syntax validation
    const trimmedSql = sql.trim()
    
    // Check for balanced parentheses
    const openParens = (trimmedSql.match(/\(/g) || []).length
    const closeParens = (trimmedSql.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      errors.push('Unbalanced parentheses')
    }
    
    // Check for balanced quotes
    const singleQuotes = (trimmedSql.match(/'/g) || []).length
    const doubleQuotes = (trimmedSql.match(/"/g) || []).length
    if (singleQuotes % 2 !== 0) {
      errors.push('Unclosed single quotes')
    }
    if (doubleQuotes % 2 !== 0) {
      errors.push('Unclosed double quotes')
    }
    
    // Check for common SQL keywords
    const upperSql = trimmedSql.toUpperCase()
    const hasSelect = upperSql.includes('SELECT')
    const hasFrom = upperSql.includes('FROM')
    
    if (hasSelect && !hasFrom) {
      warnings.push('SELECT statement without FROM clause')
    }
    
    // Check for dangerous operations
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER']
    const hasDangerous = dangerousKeywords.some(keyword => upperSql.includes(keyword))
    if (hasDangerous) {
      warnings.push('Query contains potentially dangerous operations')
    }
    
    // Check for missing semicolon
    if (!trimmedSql.endsWith(';') && trimmedSql.length > 10) {
      warnings.push('Consider adding semicolon at the end')
    }
    
    // Check for LIMIT in large queries
    if (hasSelect && !upperSql.includes('LIMIT') && !upperSql.includes('WHERE')) {
      warnings.push('Consider adding LIMIT clause for large result sets')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  return { validateQuery }
}
