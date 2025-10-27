'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calculator,
  BarChart3,
  TrendingUp,
  PieChart,
  Scatter,
  Activity,
  Layers,
  Database,
  Filter,
  Search,
  Download,
  Copy,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Edit,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  Upload,
  Info,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DataPoint {
  [key: string]: any
}

interface StatisticalSummary {
  count: number
  mean: number
  median: number
  mode: number
  std: number
  min: number
  max: number
  q25: number
  q75: number
  skewness: number
  kurtosis: number
}

interface CorrelationMatrix {
  [key: string]: { [key: string]: number }
}

interface DataExplorationProps {
  id: string
  data: DataPoint[]
  timestamp: Date
  isActive: boolean
  onDataChange: (data: DataPoint[]) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onFocus: () => void
}

export function DataExploration({
  id,
  data,
  timestamp,
  isActive,
  onDataChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onFocus
}: DataExplorationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [filters, setFilters] = useState<{ column: string; operator: string; value: string }[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const columns = data.length > 0 ? Object.keys(data[0]) : []
  const numericColumns = columns.filter(col => 
    data.every(row => typeof row[col] === 'number' || !isNaN(Number(row[col])))
  )

  const calculateStatistics = (column: string): StatisticalSummary => {
    const values = data.map(row => Number(row[column])).filter(val => !isNaN(val))
    const sorted = [...values].sort((a, b) => a - b)
    const n = values.length

    if (n === 0) {
      return {
        count: 0, mean: 0, median: 0, mode: 0, std: 0,
        min: 0, max: 0, q25: 0, q75: 0, skewness: 0, kurtosis: 0
      }
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / n
    const median = n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)]
    
    // Mode calculation
    const frequency: { [key: number]: number } = {}
    values.forEach(val => frequency[val] = (frequency[val] || 0) + 1)
    const mode = Object.keys(frequency).reduce((a, b) => frequency[Number(a)] > frequency[Number(b)] ? a : b, '0')
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
    const std = Math.sqrt(variance)
    
    const q25 = sorted[Math.floor(n * 0.25)]
    const q75 = sorted[Math.floor(n * 0.75)]
    
    const skewness = n > 2 ? values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / n : 0
    const kurtosis = n > 3 ? values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / n - 3 : 0

    return {
      count: n,
      mean: Number(mean.toFixed(4)),
      median: Number(median.toFixed(4)),
      mode: Number(mode),
      std: Number(std.toFixed(4)),
      min: sorted[0],
      max: sorted[n - 1],
      q25: Number(q25.toFixed(4)),
      q75: Number(q75.toFixed(4)),
      skewness: Number(skewness.toFixed(4)),
      kurtosis: Number(kurtosis.toFixed(4))
    }
  }

  const calculateCorrelationMatrix = (): CorrelationMatrix => {
    const matrix: CorrelationMatrix = {}
    
    numericColumns.forEach(col1 => {
      matrix[col1] = {}
      numericColumns.forEach(col2 => {
        if (col1 === col2) {
          matrix[col1][col2] = 1
        } else {
          matrix[col1][col2] = calculateCorrelation(col1, col2)
        }
      })
    })
    
    return matrix
  }

  const calculateCorrelation = (col1: string, col2: string): number => {
    const values1 = data.map(row => Number(row[col1])).filter(val => !isNaN(val))
    const values2 = data.map(row => Number(row[col2])).filter(val => !isNaN(val))
    
    if (values1.length !== values2.length || values1.length === 0) return 0
    
    const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length
    
    let numerator = 0
    let sumSq1 = 0
    let sumSq2 = 0
    
    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1
      const diff2 = values2[i] - mean2
      numerator += diff1 * diff2
      sumSq1 += diff1 * diff1
      sumSq2 += diff2 * diff2
    }
    
    const denominator = Math.sqrt(sumSq1 * sumSq2)
    return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4))
  }

  const detectOutliers = (column: string): number[] => {
    const values = data.map(row => Number(row[column])).filter(val => !isNaN(val))
    if (values.length === 0) return []
    
    const stats = calculateStatistics(column)
    const iqr = stats.q75 - stats.q25
    const lowerBound = stats.q25 - 1.5 * iqr
    const upperBound = stats.q75 + 1.5 * iqr
    
    return values.filter(val => val < lowerBound || val > upperBound)
  }

  const generateDataProfile = () => {
    const profile = {
      totalRows: data.length,
      totalColumns: columns.length,
      numericColumns: numericColumns.length,
      categoricalColumns: columns.length - numericColumns.length,
      missingValues: columns.reduce((acc, col) => {
        acc[col] = data.filter(row => row[col] === null || row[col] === undefined || row[col] === '').length
        return acc
      }, {} as { [key: string]: number }),
      dataTypes: columns.reduce((acc, col) => {
        const types = data.map(row => typeof row[col])
        acc[col] = [...new Set(types)].join(', ')
        return acc
      }, {} as { [key: string]: string })
    }
    
    return profile
  }

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const profile = generateDataProfile()
      const correlations = calculateCorrelationMatrix()
      const statistics = numericColumns.reduce((acc, col) => {
        acc[col] = calculateStatistics(col)
        return acc
      }, {} as { [key: string]: StatisticalSummary })
      
      const outliers = numericColumns.reduce((acc, col) => {
        acc[col] = detectOutliers(col)
        return acc
      }, {} as { [key: string]: number[] })
      
      setAnalysisResults({
        profile,
        statistics,
        correlations,
        outliers,
        timestamp: new Date()
      })
      
      toast.success('Analysis completed')
    } catch (error) {
      toast.error('Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const exportAnalysis = () => {
    if (!analysisResults) return
    
    const dataStr = JSON.stringify(analysisResults, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'data_analysis.json'
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('Analysis exported')
  }

  const copyAnalysis = () => {
    if (!analysisResults) return
    
    navigator.clipboard.writeText(JSON.stringify(analysisResults, null, 2))
    toast.success('Analysis copied to clipboard')
  }

  const addFilter = () => {
    setFilters([...filters, { column: '', operator: 'equals', value: '' }])
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const updateFilter = (index: number, field: string, value: string) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], [field]: value }
    setFilters(newFilters)
  }

  const applyFilters = () => {
    let filteredData = [...data]
    
    filters.forEach(filter => {
      if (filter.column && filter.value) {
        filteredData = filteredData.filter(row => {
          const cellValue = row[filter.column]
          const filterValue = filter.value
          
          switch (filter.operator) {
            case 'equals':
              return cellValue == filterValue
            case 'not_equals':
              return cellValue != filterValue
            case 'contains':
              return String(cellValue).toLowerCase().includes(filterValue.toLowerCase())
            case 'greater_than':
              return Number(cellValue) > Number(filterValue)
            case 'less_than':
              return Number(cellValue) < Number(filterValue)
            case 'greater_equal':
              return Number(cellValue) >= Number(filterValue)
            case 'less_equal':
              return Number(cellValue) <= Number(filterValue)
            default:
              return true
          }
        })
      }
    })
    
    onDataChange(filteredData)
    toast.success(`Filtered to ${filteredData.length} rows`)
  }

  const clearFilters = () => {
    setFilters([])
    onDataChange(data)
    toast.success('Filters cleared')
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      isActive ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Data Exploration</span>
            <Badge variant="outline" className="text-xs">
              {timestamp.toLocaleTimeString()}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {data.length} rows
            </Badge>
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
              onClick={copyAnalysis}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={exportAnalysis}
              className="h-6 w-6 p-0"
            >
              <Download className="h-3 w-3" />
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
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="correlations">Correlations</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Data Overview</h3>
                <Button
                  size="sm"
                  onClick={runAnalysis}
                  disabled={isAnalyzing || data.length === 0}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-3 w-3 mr-1" />
                      Analyze Data
                    </>
                  )}
                </Button>
              </div>

              {analysisResults?.profile && (
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <h4 className="text-sm font-medium">Basic Info</h4>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Rows:</span>
                        <span className="text-sm font-medium">{analysisResults.profile.totalRows}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Columns:</span>
                        <span className="text-sm font-medium">{analysisResults.profile.totalColumns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Numeric Columns:</span>
                        <span className="text-sm font-medium">{analysisResults.profile.numericColumns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Categorical Columns:</span>
                        <span className="text-sm font-medium">{analysisResults.profile.categoricalColumns}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <h4 className="text-sm font-medium">Missing Values</h4>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(analysisResults.profile.missingValues).map(([col, count]) => (
                        <div key={col} className="flex justify-between">
                          <span className="text-sm text-gray-600 truncate">{col}:</span>
                          <span className={cn(
                            "text-sm font-medium",
                            count > 0 ? "text-orange-600" : "text-green-600"
                          )}>
                            {count}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <h3 className="text-lg font-semibold">Statistical Summary</h3>
              
              {analysisResults?.statistics && (
                <div className="space-y-4">
                  {Object.entries(analysisResults.statistics).map(([column, stats]) => (
                    <Card key={column}>
                      <CardHeader className="pb-2">
                        <h4 className="text-sm font-medium">{column}</h4>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Count:</span>
                              <span className="font-medium">{stats.count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mean:</span>
                              <span className="font-medium">{stats.mean}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Median:</span>
                              <span className="font-medium">{stats.median}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mode:</span>
                              <span className="font-medium">{stats.mode}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Std Dev:</span>
                              <span className="font-medium">{stats.std}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Min:</span>
                              <span className="font-medium">{stats.min}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Max:</span>
                              <span className="font-medium">{stats.max}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Q25:</span>
                              <span className="font-medium">{stats.q25}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Q75:</span>
                              <span className="font-medium">{stats.q75}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Skewness:</span>
                              <span className="font-medium">{stats.skewness}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Kurtosis:</span>
                              <span className="font-medium">{stats.kurtosis}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Outliers:</span>
                              <span className="font-medium text-orange-600">
                                {analysisResults.outliers[column]?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="correlations" className="space-y-4">
              <h3 className="text-lg font-semibold">Correlation Matrix</h3>
              
              {analysisResults?.correlations && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                        {numericColumns.map(col => (
                          <th key={col} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {numericColumns.map(rowCol => (
                        <tr key={rowCol}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{rowCol}</td>
                          {numericColumns.map(colCol => {
                            const correlation = analysisResults.correlations[rowCol][colCol]
                            return (
                              <td key={colCol} className="px-3 py-2 text-center">
                                <span className={cn(
                                  "text-sm font-medium",
                                  Math.abs(correlation) > 0.7 ? "text-red-600" :
                                  Math.abs(correlation) > 0.5 ? "text-orange-600" :
                                  Math.abs(correlation) > 0.3 ? "text-yellow-600" : "text-gray-600"
                                )}>
                                  {correlation}
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Data Filters</h3>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={addFilter}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Filter
                  </Button>
                  <Button size="sm" variant="outline" onClick={applyFilters}>
                    <Filter className="h-3 w-3 mr-1" />
                    Apply
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearFilters}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {filters.map((filter, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-4 gap-2">
                        <Select
                          value={filter.column}
                          onValueChange={(value) => updateFilter(index, 'column', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Column" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={filter.operator}
                          onValueChange={(value) => updateFilter(index, 'operator', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="greater_equal">Greater or Equal</SelectItem>
                            <SelectItem value="less_equal">Less or Equal</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                          placeholder="Value"
                        />

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFilter(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filters.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No filters applied. Add a filter to start filtering your data.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  )
}
