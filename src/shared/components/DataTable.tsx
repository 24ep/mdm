'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Pagination, PaginationProps } from './Pagination'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  accessor?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pagination?: PaginationProps
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: string[]
  sortable?: boolean
  defaultSort?: { field: string; order: 'asc' | 'desc' }
  onSort?: (field: string, order: 'asc' | 'desc') => void
  className?: string
  emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pagination,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchFields = [],
  sortable = true,
  defaultSort,
  onSort,
  className,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<string | undefined>(defaultSort?.field)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSort?.order || 'asc')

  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchable && searchQuery && searchFields.length > 0) {
      const query = searchQuery.toLowerCase()
      result = result.filter((row) =>
        searchFields.some((field) => {
          const value = row[field]
          return value && String(value).toLowerCase().includes(query)
        })
      )
    }

    // Apply sorting
    if (sortable && sortField) {
      result.sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]

        if (aVal === bVal) return 0

        const comparison = aVal < bVal ? -1 : 1
        return sortOrder === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [data, searchQuery, sortField, sortOrder, searchable, searchFields, sortable])

  const handleSort = (field: string) => {
    if (!sortable) return

    const newOrder =
      sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortOrder(newOrder)

    if (onSort) {
      onSort(field, newOrder)
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-left text-sm font-medium',
                      column.className,
                      sortable && column.sortable !== false && 'cursor-pointer hover:bg-muted/80'
                    )}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {sortable && column.sortable !== false && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-accent">
                    {columns.map((column) => (
                      <td key={column.key} className={cn('px-4 py-3', column.className)}>
                        {column.accessor
                          ? column.accessor(row)
                          : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && <Pagination {...pagination} />}
    </div>
  )
}

