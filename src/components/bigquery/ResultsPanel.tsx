'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, History, BarChart3, Download, AlertCircle, ChevronDown, FileText } from 'lucide-react'
import { QueryHistory } from './QueryHistory'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

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

interface ResultsPanelProps {
  showFooter: boolean
  footerHeight: number
  isResizing: boolean
  footerTab: 'results' | 'history' | 'visualization' | 'validation'
  onFooterTabChange: (tab: 'results' | 'history' | 'visualization' | 'validation') => void
  currentResult: QueryResult | null
  queryHistory: QueryResult[]
  onLoadQuery: (query: string) => void
  onToggleBookmark: (queryId: string) => void
  isBookmarked: (queryId: string) => boolean
  getStatusIcon: (status: string) => React.ReactNode
  formatDuration: (ms: number) => string
  formatBytes: (bytes: number) => string
  onMouseDown: (e: React.MouseEvent) => void
  setFooterHeight: (height: number) => void
  validation?: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
  onJumpToLine?: (line: number, column?: number) => void
}

export function ResultsPanel({
  showFooter,
  footerHeight,
  isResizing,
  footerTab,
  onFooterTabChange,
  currentResult,
  queryHistory,
  onLoadQuery,
  onToggleBookmark,
  isBookmarked,
  getStatusIcon,
  formatDuration,
  formatBytes,
  onMouseDown,
  setFooterHeight,
  validation,
  onJumpToLine
}: ResultsPanelProps) {
  const [chartType, setChartType] = useState<string>('BAR')
  const [chartConfig, setChartConfig] = useState({
    dimensions: [] as string[],
    measures: [] as string[],
    title: 'Query Results Visualization'
  })
  
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false)

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

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
        const excelCsv = [
          currentResult.columns.join('\t'),
          ...currentResult.results.map(row => 
            currentResult.columns.map(col => `${row[col] || ''}`).join('\t')
          )
        ].join('\n')
        downloadFile(excelCsv, `${filename}.xls`, 'application/vnd.ms-excel')
        break

      case 'pdf':
        const pdfContent = `Query Results\n\nQuery: ${currentResult.query}\n\nExported: ${new Date().toLocaleString()}\n\n${currentResult.columns.join('\t')}\n${currentResult.results.map(row => currentResult.columns.map(col => row[col] || '').join('\t')).join('\n')}`
        downloadFile(pdfContent, `${filename}.txt`, 'text/plain')
        break
    }
  }

  const prepareChartData = () => {
    if (!currentResult?.results.length) return []
    
    return currentResult.results.map((row, index) => ({
      ...row,
      index: index + 1
    }))
  }

  const getAvailableColumns = () => {
    if (!currentResult?.columns) return []
    return currentResult.columns
  }

  const getNumericColumns = () => {
    if (!currentResult?.results.length) return []
    
    const numericColumns: string[] = []
    const firstRow = currentResult.results[0]
    
    currentResult.columns.forEach(column => {
      const value = firstRow[column]
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
        numericColumns.push(column)
      }
    })
    
    return numericColumns
  }

  if (!showFooter) return null

  return (
    <div 
      className={`bg-white border-t border-gray-200 flex flex-col ${
        isResizing ? '' : 'transition-all duration-200 ease-in-out'
      }`}
      style={{ 
        height: `${footerHeight}px`,
        minHeight: '150px',
        maxHeight: '80vh',
        willChange: isResizing ? 'height' : 'auto',
        flexShrink: 0
      }}
      data-footer="true"
    >
      {/* Resize Handle */}
      <div 
        className={`h-3 cursor-ns-resize relative group border-t border-gray-300 z-10 ${
          isResizing 
            ? 'bg-blue-500' 
            : 'bg-gray-200 hover:bg-blue-400 transition-colors'
        }`}
        onMouseDown={onMouseDown}
        title="Drag to resize footer height"
        style={{
          willChange: isResizing ? 'background-color' : 'auto'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${
              isResizing 
                ? 'bg-white' 
                : 'bg-gray-500 group-hover:bg-blue-600'
            }`}></div>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isResizing 
                ? 'bg-white' 
                : 'bg-gray-500 group-hover:bg-blue-600'
            }`}></div>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isResizing 
                ? 'bg-white' 
                : 'bg-gray-500 group-hover:bg-blue-600'
            }`}></div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <Tabs value={footerTab} onValueChange={(value) => onFooterTabChange(value as any)}>
            <TabsList className="flex gap-1">
              <TabsTrigger value="results" className="flex items-center gap-2 px-3 py-1 text-sm">
                <Table className="h-4 w-4" />
                Results
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 px-3 py-1 text-sm">
                <History className="h-4 w-4" />
                Query history
              </TabsTrigger>
              <TabsTrigger value="visualization" className="flex items-center gap-2 px-3 py-1 text-sm">
                <BarChart3 className="h-4 w-4" />
                Visualization
              </TabsTrigger>
              <TabsTrigger value="validation" className="flex items-center gap-2 px-3 py-1 text-sm">
                <AlertCircle className="h-4 w-4" />
                Validation
                {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {validation.errors.length + validation.warnings.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
          {currentResult && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{currentResult.results.length} rows</span>
              {currentResult.executionTime && (
                <span>• {formatDuration(currentResult.executionTime)}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Height: {Math.round(footerHeight)}px</span>
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs"
                onClick={() => setFooterHeight(200)}
                title="Small (200px)"
              >
                S
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs"
                onClick={() => setFooterHeight(400)}
                title="Medium (400px)"
              >
                M
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs"
                onClick={() => setFooterHeight(600)}
                title="Large (600px)"
              >
                L
              </Button>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {footerTab === 'results' && (
          currentResult ? (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Query Results</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{currentResult.results.length} rows</span>
                    {currentResult.executionTime && (
                      <span>• {formatDuration(currentResult.executionTime)}</span>
                    )}
                    {currentResult.size && (
                      <span>• {formatBytes(currentResult.size)}</span>
                    )}
                  </div>
                  <div className="relative">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 px-2 text-xs"
                      onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                    {showDownloadDropdown && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => { exportResults('csv'); setShowDownloadDropdown(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          CSV
                        </button>
                        <button
                          onClick={() => { exportResults('json'); setShowDownloadDropdown(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          JSON
                        </button>
                        <button
                          onClick={() => { exportResults('excel'); setShowDownloadDropdown(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Excel
                        </button>
                        <button
                          onClick={() => { exportResults('pdf'); setShowDownloadDropdown(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {currentResult.columns.map(col => (
                        <th
                          key={col}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentResult.results.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {currentResult.columns.map(col => (
                          <td key={`${rowIndex}-${col}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
          ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Table className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2 text-gray-700">No Results</h3>
              <p className="text-sm text-gray-500">Run a query to see results here</p>
            </div>
          </div>
          )
        )}

        {footerTab === 'history' && (
          <QueryHistory
            queryHistory={queryHistory}
            onLoadQuery={onLoadQuery}
            onToggleBookmark={onToggleBookmark}
            isBookmarked={isBookmarked}
            getStatusIcon={getStatusIcon}
            formatDuration={formatDuration}
            formatBytes={formatBytes}
          />
        )}

        {footerTab === 'visualization' && (
          <div className="h-full flex flex-col">
            {currentResult ? (
              <>
                {/* Visualization Controls */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Data Visualization</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="chart-type" className="text-xs text-gray-600">Chart:</Label>
                        <Select value={chartType} onValueChange={setChartType}>
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BAR">Bar Chart</SelectItem>
                            <SelectItem value="LINE">Line Chart</SelectItem>
                            <SelectItem value="PIE">Pie Chart</SelectItem>
                            <SelectItem value="AREA">Area Chart</SelectItem>
                            <SelectItem value="SCATTER">Scatter Plot</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label htmlFor="dimension" className="text-xs text-gray-600">X-Axis:</Label>
                        <Select 
                          value={chartConfig.dimensions[0] || ''} 
                          onValueChange={(value) => setChartConfig(prev => ({ 
                            ...prev, 
                            dimensions: [value] 
                          }))}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue placeholder="Select dimension" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableColumns().map(column => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label htmlFor="measure" className="text-xs text-gray-600">Y-Axis:</Label>
                        <Select 
                          value={chartConfig.measures[0] || ''} 
                          onValueChange={(value) => setChartConfig(prev => ({ 
                            ...prev, 
                            measures: [value] 
                          }))}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue placeholder="Select measure" />
                          </SelectTrigger>
                          <SelectContent>
                            {getNumericColumns().map(column => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Chart Visualization */}
                <div className="flex-1 p-4">
                  {chartConfig.dimensions.length > 0 && chartConfig.measures.length > 0 ? (
                    <div className="h-full">
                      <ChartRenderer
                        type="chart"
                        chartType={chartType}
                        data={prepareChartData()}
                        dimensions={chartConfig.dimensions}
                        measures={chartConfig.measures}
                        filters={[]}
                        title={chartConfig.title}
                        className="h-full"
                      />
                    </div>
                  ) : (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2 text-gray-700">Configure Visualization</h3>
                        <p className="text-sm text-gray-500 mb-4">Select a dimension (X-axis) and measure (Y-axis) to create a chart</p>
                        <div className="text-xs text-gray-400">
                          <p>Available columns: {getAvailableColumns().join(', ')}</p>
                          {getNumericColumns().length > 0 && (
                            <p>Numeric columns: {getNumericColumns().join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 p-4">
                <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2 text-gray-700">No Data to Visualize</h3>
                    <p className="text-sm text-gray-500">Run a query to see visualization options</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {footerTab === 'validation' && (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900">Query Validation</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {validation ? (
                <div className="space-y-3">
                  {validation.errors.length === 0 && validation.warnings.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 p-3 bg-green-50 border border-green-200 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      <span>No issues found. Query is valid.</span>
                    </div>
                  ) : (
                    <>
                      {validation.errors.map((error, index) => (
                        <div 
                          key={`error-${index}`} 
                          className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md cursor-pointer hover:bg-red-100"
                          onClick={() => {
                            const match = error.match(/line (\d+), column (\d+)/)
                            if (match && onJumpToLine) {
                              onJumpToLine(parseInt(match[1]), parseInt(match[2]))
                            }
                          }}
                        >
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          <div className="flex-1 text-sm text-red-800">
                            <span className="font-medium">Error: </span>{error}
                          </div>
                        </div>
                      ))}

                      {validation.warnings.map((warning, index) => (
                        <div 
                          key={`warning-${index}`} 
                          className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md cursor-pointer hover:bg-yellow-100"
                          onClick={() => {
                            const match = warning.match(/line (\d+), column (\d+)/)
                            if (match && onJumpToLine) {
                              onJumpToLine(parseInt(match[1]), parseInt(match[2]))
                            }
                          }}
                        >
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                          <div className="flex-1 text-sm text-yellow-800">
                            <span className="font-medium">Warning: </span>{warning}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2 text-gray-700">No Validation Data</h3>
                    <p className="text-sm text-gray-500">Validation will appear here when you type a query</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
