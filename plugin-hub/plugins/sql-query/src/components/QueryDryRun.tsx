'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TestTube, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface DryRunResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  estimatedBytes: number
  estimatedRows: number
  scannedTables: string[]
  jobId?: string
}

interface QueryDryRunProps {
  query: string
  onDryRun?: (result: DryRunResult) => void
}

export function QueryDryRun({ query, onDryRun }: QueryDryRunProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<DryRunResult | null>(null)

  const performDryRun = async () => {
    if (!query || !query.trim()) {
      toast.error('Query is empty')
      return
    }

    setIsRunning(true)
    setResult(null)

    try {
      // Simulate dry-run API call
      // In production, this would call: POST /api/query/dry-run
      await new Promise(resolve => setTimeout(resolve, 1000))

      const dryRunResult = validateQueryForDryRun(query)
      setResult(dryRunResult)
      
      if (onDryRun) {
        onDryRun(dryRunResult)
      }

      if (dryRunResult.valid) {
        toast.success('Dry run completed successfully')
      } else {
        toast.error(`Dry run failed: ${dryRunResult.errors[0]}`)
      }
    } catch (error) {
      toast.error('Dry run failed')
      console.error('Dry run error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const validateQueryForDryRun = (sql: string): DryRunResult => {
    const errors: string[] = []
    const warnings: string[] = []
    const queryUpper = sql.toUpperCase().trim()

    // Basic validation
    if (!queryUpper) {
      errors.push('Query is empty')
      return { valid: false, errors, warnings, estimatedBytes: 0, estimatedRows: 0, scannedTables: [] }
    }

    // Check for dangerous operations
    if (queryUpper.includes('DROP') || queryUpper.includes('DELETE') || queryUpper.includes('TRUNCATE')) {
      warnings.push('Dry run may not accurately reflect DELETE/DROP operations')
    }

    // Check for valid SQL structure
    if (queryUpper.startsWith('SELECT')) {
      // Extract table names
      const scannedTables: string[] = []
      const fromMatches = sql.match(/FROM\s+`?([\w\.]+)`?/gi) || []
      const joinMatches = sql.match(/JOIN\s+`?([\w\.]+)`?/gi) || []
      
      fromMatches.forEach(m => {
        const table = m.replace(/FROM\s+`?/i, '').replace(/`/g, '').trim()
        if (table && !scannedTables.includes(table)) {
          scannedTables.push(table)
        }
      })
      
      joinMatches.forEach(m => {
        const table = m.replace(/JOIN\s+`?/i, '').replace(/`/g, '').trim()
        if (table && !scannedTables.includes(table)) {
          scannedTables.push(table)
        }
      })

      if (scannedTables.length === 0) {
        warnings.push('No tables found in query')
      }

      // Estimate bytes and rows (mock calculation)
      const baseBytes = 1000000
      const bytesPerTable = 50000000
      const estimatedBytes = baseBytes + (scannedTables.length * bytesPerTable)
      const estimatedRows = Math.floor(estimatedBytes / 1000)

      // Check for missing WHERE clause on large tables
      if (!queryUpper.includes('WHERE') && scannedTables.length > 0) {
        warnings.push('Query does not include WHERE clause - may scan entire tables')
      }

      // Check for missing LIMIT
      if (!queryUpper.includes('LIMIT')) {
        warnings.push('Query does not include LIMIT clause - may return large result set')
      }

      return {
        valid: true,
        errors,
        warnings,
        estimatedBytes,
        estimatedRows,
        scannedTables
      }
    } else if (queryUpper.startsWith('INSERT') || queryUpper.startsWith('UPDATE') || queryUpper.startsWith('DELETE')) {
      // DML operations
      warnings.push('Dry run for DML operations provides limited validation')
      
      return {
        valid: true,
        errors,
        warnings,
        estimatedBytes: 0,
        estimatedRows: 0,
        scannedTables: []
      }
    } else {
      errors.push('Only SELECT, INSERT, UPDATE, DELETE statements are supported')
      return { valid: false, errors, warnings, estimatedBytes: 0, estimatedRows: 0, scannedTables: [] }
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant="outline"
        onClick={performDryRun}
        disabled={isRunning || !query.trim()}
        className="h-8 px-3"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <TestTube className="h-4 w-4 mr-1" />
            Dry Run
          </>
        )}
      </Button>

      {result && (
        <Card className="border-blue-200 bg-blue-50 mt-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {result.valid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              Dry Run Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.valid && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Estimated Bytes</p>
                  <p className="font-medium">{formatBytes(result.estimatedBytes)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Estimated Rows</p>
                  <p className="font-medium">{result.estimatedRows.toLocaleString()}</p>
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-red-700">Errors:</p>
                {result.errors.map((error, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-700">Warnings:</p>
                {result.warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {result.scannedTables.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Tables Scanned:</p>
                <div className="flex flex-wrap gap-1">
                  {result.scannedTables.map((table, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

