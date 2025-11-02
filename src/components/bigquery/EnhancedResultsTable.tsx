'use client'

import { useState, useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Filter, X } from 'lucide-react'

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

interface EnhancedResultsTableProps {
  currentResult: QueryResult | null
  formatDuration: (ms: number) => string
  formatBytes: (bytes: number) => string
}

type SortConfig = {
  column: string | null
  direction: 'asc' | 'desc'
}

export function EnhancedResultsTable({ currentResult, formatDuration, formatBytes }: EnhancedResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'asc' })
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  if (!currentResult) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Table className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2 text-gray-700">No Results</h3>
          <p className="text-sm text-gray-500">Run a query to see results here</p>
        </div>
      </div>
    )
  }

  // Filter and sort results
  const processedResults = useMemo(() => {
    let filtered = [...currentResult.results]

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        currentResult.columns.some(col =>
          String(row[col] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(row =>
          String(row[column] || '').toLowerCase().includes(filterValue.toLowerCase())
        )
      }
    })

    // Apply sorting
    if (sortConfig.column) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.column!]
        const bValue = b[sortConfig.column!]
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [currentResult.results, currentResult.columns, searchTerm, columnFilters, sortConfig])

  // Pagination
  const totalPages = Math.ceil(processedResults.length / pageSize)
  const paginatedResults = processedResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
    setCurrentPage(1)
  }

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }))
    setCurrentPage(1)
  }

  const clearColumnFilter = (column: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[column]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setColumnFilters({})
    setSortConfig({ column: null, direction: 'asc' })
    setCurrentPage(1)
  }

  const hasFilters = searchTerm || Object.keys(columnFilters).length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 space-y-3">
        {/* Top row: Stats and page size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{processedResults.length} of {currentResult.results.length} rows</span>
            {currentResult.executionTime && (
              <span>• {formatDuration(currentResult.executionTime)}</span>
            )}
            {currentResult.size && (
              <span>• {formatBytes(currentResult.size)}</span>
            )}
            {hasFilters && (
              <span className="text-blue-600">• Filtered</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rows per page:</span>
            <Select value={pageSize.toString()} onValueChange={(v) => {
              setPageSize(parseInt(v))
              setCurrentPage(1)
            }}>
              <SelectTrigger className="h-7 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search in results..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-8 h-8 text-sm"
            />
          </div>
          {hasFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearAllFilters}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {currentResult.columns.map(col => (
                    <th
                      key={col}
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSort(col)}
                          className="hover:text-gray-700 flex items-center gap-1"
                        >
                          {col}
                          {sortConfig.column === col && (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          )}
                        </button>
                      </div>
                      <div className="mt-1">
                        <Input
                          placeholder="Filter..."
                          value={columnFilters[col] || ''}
                          onChange={(e) => handleColumnFilter(col, e.target.value)}
                          className="h-6 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedResults.length === 0 ? (
                  <tr>
                    <td colSpan={currentResult.columns.length} className="px-6 py-8 text-center text-sm text-gray-500">
                      No results match your filters
                    </td>
                  </tr>
                ) : (
                  paginatedResults.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {currentResult.columns.map(col => {
                        const cellValue = row[col]
                        const displayValue = cellValue !== null && cellValue !== undefined ? String(cellValue) : 'NULL'
                        const isMatch = searchTerm && displayValue.toLowerCase().includes(searchTerm.toLowerCase())
                        
                        return (
                          <td
                            key={`${rowIndex}-${col}`}
                            className={`px-4 py-2 whitespace-nowrap text-sm ${
                              isMatch ? 'bg-yellow-100' : 'text-gray-900'
                            }`}
                          >
                            {displayValue}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, processedResults.length)} of {processedResults.length} rows
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-500 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


