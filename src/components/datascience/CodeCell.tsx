'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Square, 
  Copy, 
  Download, 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Code,
  Database,
  FileCode,
  Terminal,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export type CodeLanguage = 'python' | 'r' | 'sql' | 'javascript' | 'typescript'

interface CodeCellProps {
  id: string
  language: CodeLanguage
  content: string
  output?: any
  status: 'idle' | 'running' | 'success' | 'error'
  executionTime?: number
  timestamp: Date
  isActive: boolean
  onContentChange: (content: string) => void
  onExecute: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onFocus: () => void
}

export function CodeCell({
  id,
  language,
  content,
  output,
  status,
  executionTime,
  timestamp,
  isActive,
  onContentChange,
  onExecute,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onFocus
}: CodeCellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showOutput, setShowOutput] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive])

  const getLanguageIcon = (lang: CodeLanguage) => {
    switch (lang) {
      case 'python': return <FileCode className="h-4 w-4 text-blue-600" />
      case 'r': return <FileCode className="h-4 w-4 text-purple-600" />
      case 'sql': return <Database className="h-4 w-4 text-green-600" />
      case 'javascript': return <Code className="h-4 w-4 text-yellow-600" />
      case 'typescript': return <Code className="h-4 w-4 text-blue-500" />
      default: return <Code className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Play className="h-4 w-4 text-gray-400" />
    }
  }

  const getLanguageSyntax = (lang: CodeLanguage) => {
    switch (lang) {
      case 'python':
        return `# Python Code
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Load your data
# df = pd.read_csv('data.csv')

# Your analysis here
print("Hello, Python!")`
      case 'r':
        return `# R Code
library(ggplot2)
library(dplyr)
library(tidyr)

# Load your data
# df <- read.csv('data.csv')

# Your analysis here
print("Hello, R!")`
      case 'sql':
        return `-- SQL Query
SELECT 
    column1,
    column2,
    COUNT(*) as count
FROM your_table
WHERE condition = 'value'
GROUP BY column1, column2
ORDER BY count DESC
LIMIT 10;`
      case 'javascript':
        return `// JavaScript Code
console.log("Hello, JavaScript!");

// Your code here
const data = [1, 2, 3, 4, 5];
const sum = data.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);`
      case 'typescript':
        return `// TypeScript Code
interface DataPoint {
  id: number;
  value: number;
}

const processData = (data: DataPoint[]): number => {
  return data.reduce((sum, point) => sum + point.value, 0);
};

console.log("Hello, TypeScript!");`
      default:
        return `// Code here...`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onExecute()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    toast.success('Code copied to clipboard')
  }

  const formatOutput = (output: any) => {
    if (typeof output === 'string') {
      return output
    }
    
    if (output?.error) {
      return `Error: ${output.error}`
    }
    
    if (output?.stdout) {
      return output.stdout
    }
    
    if (output?.result) {
      return output.result
    }
    
    if (Array.isArray(output)) {
      return output.map(item => JSON.stringify(item)).join('\n')
    }
    
    return JSON.stringify(output, null, 2)
  }

  const renderOutput = (output: any) => {
    if (!output) return null

    // Handle different output types
    if (output.chart) {
      return (
        <div className="mt-4">
          <div className="bg-white border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Chart</h4>
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-500">Chart visualization would appear here</span>
            </div>
          </div>
        </div>
      )
    }

    if (output.table) {
      return (
        <div className="mt-4">
          <div className="bg-white border rounded-lg overflow-hidden">
            <h4 className="text-sm font-medium p-3 border-b">Data Table</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {output.columns?.map((col: string, index: number) => (
                      <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {output.data?.slice(0, 10).map((row: any, rowIndex: number) => (
                    <tr key={rowIndex}>
                      {output.columns?.map((col: string, colIndex: number) => (
                        <td key={colIndex} className="px-4 py-2 text-sm text-gray-900">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {output.data?.length > 10 && (
                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
                  Showing 10 of {output.data.length} rows
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="mt-4">
        <div className="bg-gray-50 border rounded-lg p-3">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
            {formatOutput(output)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      isActive ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getLanguageIcon(language)}
            <span className="text-sm font-medium capitalize">{language}</span>
            <Badge variant="outline" className="text-xs">
              {timestamp.toLocaleTimeString()}
            </Badge>
            {getStatusIcon(status)}
            {executionTime && (
              <Badge variant="secondary" className="text-xs">
                {executionTime}ms
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="h-6 w-6 p-0"
            >
              <Code className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyToClipboard}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onExecute}
              disabled={status === 'running'}
              className="h-6 w-6 p-0"
            >
              {status === 'running' ? (
                <Square className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMoveUp}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3 rotate-[-90deg]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMoveDown}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3 rotate-90" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDuplicate}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <XCircle className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent>
          {/* Code Editor */}
          <div className="mb-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              className={cn(
                "w-full min-h-[120px] p-3 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500",
                isEditing ? "border-blue-300" : "border-gray-200"
              )}
              placeholder={getLanguageSyntax(language)}
              style={{
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            />
            
            {/* Code Actions */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onContentChange(getLanguageSyntax(language))}
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Template
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onContentChange('')}
                  className="h-7 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Ctrl+Enter to run
                </span>
                <Button
                  size="sm"
                  onClick={onExecute}
                  disabled={status === 'running' || !content.trim()}
                  className="h-7 px-3 text-xs"
                >
                  {status === 'running' ? (
                    <>
                      <Square className="h-3 w-3 mr-1" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Output */}
          {output && showOutput && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-700">Output</h4>
                  {status === 'success' && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      Success
                    </Badge>
                  )}
                  {status === 'error' && (
                    <Badge variant="outline" className="text-xs text-red-600">
                      Error
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowOutput(!showOutput)}
                    className="h-6 w-6 p-0"
                  >
                    {showOutput ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(formatOutput(output))}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {renderOutput(output)}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
