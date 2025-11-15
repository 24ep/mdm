'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Download, 
  Maximize2, 
  Minimize2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExecutionResult } from '@/lib/notebook-engine'

interface CellOutputProps {
  output: ExecutionResult
  executionCount?: number
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

export function CellOutput({ 
  output, 
  executionCount, 
  isCollapsed = false, 
  onToggleCollapse,
  className 
}: CellOutputProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showScrollbar, setShowScrollbar] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const downloadOutput = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const renderTextOutput = (text: string) => (
    <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded border border-border overflow-x-auto">
      {text}
    </pre>
  )

  const renderErrorOutput = (error: any) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-medium text-red-800 dark:text-red-200 mb-1">Error</div>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
            {typeof error === 'string' ? error : error.message || JSON.stringify(error)}
          </pre>
          {error.details && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                Show details
              </summary>
              <pre className="text-xs text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap font-mono">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )

  const renderImageOutput = (imageData: any) => (
    <div className="border border-border rounded overflow-hidden">
      <img 
        src={imageData.data || imageData.url} 
        alt={imageData.title || 'Output image'}
        className="max-w-full h-auto"
      />
      {imageData.title && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
          {imageData.title}
        </div>
      )}
    </div>
  )

  const renderTableOutput = (data: any[]) => (
    <div className="border border-border rounded overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {Object.keys(data[0] || {}).map((key, index) => (
                <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.slice(0, 100).map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {Object.values(row).map((value, colIndex) => (
                  <td key={colIndex} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 100 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
            Showing first 100 rows of {data.length} total rows
          </div>
        )}
      </div>
    </div>
  )

  const renderHTMLOutput = (html: string) => (
    <div 
      className="prose max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )

  const renderOutput = () => {
    // Check for error first (supports both error string and stderr)
    if (output.error) {
      return renderErrorOutput(output.error)
    }

    if (output.stderr) {
      return renderErrorOutput(output.stderr)
    }

    // Check for images
    if (output.images && output.images.length > 0) {
      return (
        <div className="space-y-2">
          {output.images.map((image, index) => (
            <div key={index}>
              {renderImageOutput(image)}
            </div>
          ))}
        </div>
      )
    }

    // Check for tables
    if ((output as any).tables && (output as any).tables.length > 0) {
      return (
        <div className="space-y-4">
          {(output as any).tables.map((table: any, index: number) => (
            <div key={index}>
              {renderTableOutput(table.data || table)}
            </div>
          ))}
        </div>
      )
    }

    // Check for charts
    if ((output as any).charts && (output as any).charts.length > 0) {
      // Charts can be rendered as images or HTML
      return (
        <div className="space-y-4">
          {(output as any).charts.map((chart: any, index: number) => (
            <div key={index} className="border border-border rounded p-4">
              <div className="text-sm font-medium mb-2">{chart.title}</div>
              <div className="text-xs text-gray-500">Chart visualization (type: {chart.type})</div>
            </div>
          ))}
        </div>
      )
    }

    // Check for HTML output
    if ((output as any).html) {
      return renderHTMLOutput((output as any).html)
    }

    // Check for stdout (ExecutionResult format)
    if (output.stdout) {
      return renderTextOutput(output.stdout)
    }

    // Check for result (ExecutionResult format)
    if (output.result !== undefined && output.result !== null) {
      const resultStr = typeof output.result === 'object' 
        ? JSON.stringify(output.result, null, 2)
        : String(output.result)
      return renderTextOutput(resultStr)
    }

    // Check for (output as any).output (legacy format)
    if ((output as any).output) {
      return renderTextOutput((output as any).output)
    }

    return null
  }

  // Check if output has any content to display
  const hasContent = output && (
    output.error || 
    output.stderr || 
    output.stdout || 
    (output.result !== undefined && output.result !== null) ||
    (output as any).output || 
    (output.images && output.images.length > 0) || 
    ((output as any).tables && (output as any).tables.length > 0) ||
    ((output as any).charts && (output as any).charts.length > 0) ||
    (output as any).html
  )

  if (!hasContent) {
    return null
  }

  return (
    <div className={cn("border-t border-gray-200 dark:border-gray-700", className)}>
      {/* Output Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {executionCount !== undefined && (
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
              Out [{executionCount}]:
            </span>
          )}
          {output.error ? (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Success
            </Badge>
          )}
          {output.executionTime && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {output.executionTime}ms
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(
              (output as any).output || 
              ((output as any).error ? (typeof (output as any).error === 'string' ? (output as any).error : (output as any).error.message) : '') ||
              ''
            )}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => downloadOutput(
              (output as any).output || 
              ((output as any).error ? (typeof (output as any).error === 'string' ? (output as any).error : (output as any).error.message) : '') ||
              '',
              `output_${Date.now()}.txt`
            )}
            className="h-6 w-6 p-0"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Output Content */}
      {isExpanded && (
        <div 
          className="p-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
          onMouseEnter={() => setShowScrollbar(true)}
          onMouseLeave={() => setShowScrollbar(false)}
        >
          {renderOutput()}
        </div>
      )}
    </div>
  )
}
