'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Table } from 'lucide-react'

interface QueryResult {
  id: string
  query: string
  results: any[]
  columns: string[]
  status: 'success' | 'error' | 'running'
  executionTime?: number
  timestamp: Date
  spaceName?: string
  userId?: string
  userName?: string
  size?: number
}

interface ResultsTableProps {
  currentResult: QueryResult | null
  formatDuration: (ms: number) => string
  formatBytes: (bytes: number) => string
}

export function ResultsTable({ currentResult, formatDuration, formatBytes }: ResultsTableProps) {
  if (!currentResult) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <Table className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2 text-foreground">No Results</h3>
          <p className="text-sm text-muted-foreground">Run a query to see results here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border bg-muted">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Query Results</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{currentResult.results.length} rows</span>
            {currentResult.executionTime && (
              <span>• {formatDuration(currentResult.executionTime)}</span>
            )}
            {currentResult.size && (
              <span>• {formatBytes(currentResult.size)}</span>
            )}
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                {currentResult.columns.map(col => (
                  <th
                    key={col}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {currentResult.results.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {currentResult.columns.map(col => (
                    <td key={`${rowIndex}-${col}`} className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NULL'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  )
}
