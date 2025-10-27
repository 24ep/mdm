'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, ChevronDown, FileText } from 'lucide-react'

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

interface ExportDropdownProps {
  currentResult: QueryResult | null
}

export function ExportDropdown({ currentResult }: ExportDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const exportResults = (format: 'csv' | 'json' | 'excel' | 'pdf' = 'csv') => {
    if (!currentResult?.results.length) return

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `query-results-${timestamp}`

    switch (format) {
      case 'csv':
        const csv = [
          currentResult.columns.join(','),
          ...currentResult.results.map(row => 
            currentResult.columns.map(col => `"${row[col] || ''}"`).join(',')
          )
        ].join('\n')
        downloadFile(csv, `${filename}.csv`, 'text/csv')
        break

      case 'json':
        const json = JSON.stringify({
          columns: currentResult.columns,
          data: currentResult.results,
          metadata: {
            totalRows: currentResult.results.length,
            exportedAt: new Date().toISOString(),
            query: currentResult.query
          }
        }, null, 2)
        downloadFile(json, `${filename}.json`, 'application/json')
        break

      case 'excel':
        // For Excel, we'll create a CSV that can be opened in Excel
        const excelCsv = [
          currentResult.columns.join('\t'),
          ...currentResult.results.map(row => 
            currentResult.columns.map(col => `${row[col] || ''}`).join('\t')
          )
        ].join('\n')
        downloadFile(excelCsv, `${filename}.xls`, 'application/vnd.ms-excel')
        break

      case 'pdf':
        // For PDF, we'll create a simple text representation
        const pdfContent = `Query Results Report
Generated: ${new Date().toLocaleString()}
Total Rows: ${currentResult.results.length}

Columns: ${currentResult.columns.join(', ')}

Data:
${currentResult.results.slice(0, 100).map((row, index) => 
  `${index + 1}. ${currentResult.columns.map(col => `${col}: ${row[col] || ''}`).join(', ')}`
).join('\n')}

${currentResult.results.length > 100 ? `\n... and ${currentResult.results.length - 100} more rows` : ''}`
        downloadFile(pdfContent, `${filename}.txt`, 'text/plain')
        break
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!currentResult) {
    return null
  }

  return (
    <div className="relative">
      <Button 
        size="sm" 
        variant="outline" 
        className="h-8 px-3"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Download className="h-4 w-4 mr-1" />
        Export
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>
      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => { exportResults('csv'); setShowDropdown(false); }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={() => { exportResults('json'); setShowDropdown(false); }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            JSON
          </button>
          <button
            onClick={() => { exportResults('excel'); setShowDropdown(false); }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Excel
          </button>
          <button
            onClick={() => { exportResults('pdf'); setShowDropdown(false); }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      )}
    </div>
  )
}
