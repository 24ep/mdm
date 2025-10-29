'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Download, 
  FileText,
  BarChart3,
  Database,
  Target,
  Activity,
  Eye,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DataProfilingProps {
  data?: any[]
  onProfile?: (config: ProfilingConfig) => Promise<ProfilingResult>
  onExportProfile?: (profile: ProfilingResult, format: string) => void
}

interface ProfilingConfig {
  columns?: string[]
  includeQualityChecks?: boolean
  includeStatisticalAnalysis?: boolean
  includeDataTypes?: boolean
  includeMissingValues?: boolean
  includeOutliers?: boolean
  includeDuplicates?: boolean
  includePatterns?: boolean
}

interface ColumnProfile {
  name: string
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'mixed'
  count: number
  nullCount: number
  nullPercentage: number
  uniqueCount: number
  uniquePercentage: number
  duplicateCount: number
  duplicatePercentage: number
  statistics?: {
    mean?: number
    median?: number
    mode?: any
    std?: number
    min?: any
    max?: any
    quartiles?: {
      q1: number
      q2: number
      q3: number
    }
  }
  qualityIssues: QualityIssue[]
  patterns?: {
    email?: number
    phone?: number
    url?: number
    date?: number
    numeric?: number
    alphanumeric?: number
  }
  outliers?: {
    count: number
    percentage: number
    values: any[]
  }
}

interface QualityIssue {
  type: 'missing_values' | 'outliers' | 'duplicates' | 'inconsistent_format' | 'data_type_mismatch'
  severity: 'low' | 'medium' | 'high'
  message: string
  count: number
  percentage: number
  examples: any[]
}

interface ProfilingResult {
  overview: {
    totalRows: number
    totalColumns: number
    memoryUsage: string
    duplicateRows: number
    duplicatePercentage: number
    qualityScore: number
    profilingTime: number
  }
  columns: ColumnProfile[]
  qualitySummary: {
    totalIssues: number
    criticalIssues: number
    warningIssues: number
    infoIssues: number
  }
  recommendations: string[]
  createdAt: Date
}

export function DataProfiling({ 
  data = [], 
  onProfile, 
  onExportProfile 
}: DataProfilingProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [includeQualityChecks, setIncludeQualityChecks] = useState(true)
  const [includeStatisticalAnalysis, setIncludeStatisticalAnalysis] = useState(true)
  const [includeDataTypes, setIncludeDataTypes] = useState(true)
  const [includeMissingValues, setIncludeMissingValues] = useState(true)
  const [includeOutliers, setIncludeOutliers] = useState(true)
  const [includeDuplicates, setIncludeDuplicates] = useState(true)
  const [includePatterns, setIncludePatterns] = useState(true)
  const [isProfiling, setIsProfiling] = useState(false)
  const [profilingProgress, setProfilingProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [profileResult, setProfileResult] = useState<ProfilingResult | null>(null)
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  const columns = data.length > 0 ? Object.keys(data[0]) : []

  useEffect(() => {
    if (columns.length > 0) {
      setSelectedColumns(columns) // Select all columns by default
    }
  }, [columns])

  const performProfiling = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column for profiling')
      return
    }

    setIsProfiling(true)
    setProfilingProgress(0)
    setProfileResult(null)

    const config: ProfilingConfig = {
      columns: selectedColumns,
      includeQualityChecks,
      includeStatisticalAnalysis,
      includeDataTypes,
      includeMissingValues,
      includeOutliers,
      includeDuplicates,
      includePatterns
    }

    try {
      // Simulate profiling steps
      const steps = [
        'Analyzing data structure...',
        'Detecting data types...',
        'Checking for missing values...',
        'Identifying duplicates...',
        'Detecting outliers...',
        'Analyzing patterns...',
        'Calculating statistics...',
        'Generating quality report...'
      ]

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
        setProfilingProgress(((i + 1) / steps.length) * 100)
      }

      // Generate mock profiling result
      const mockResult = generateMockProfilingResult(config)
      setProfileResult(mockResult)
      setSelectedColumn(selectedColumns[0])
      
      toast.success('Data profiling completed successfully')
    } catch (error) {
      toast.error('Data profiling failed')
    } finally {
      setIsProfiling(false)
      setCurrentStep('')
      setProfilingProgress(0)
    }
  }

  const generateMockProfilingResult = (config: ProfilingConfig): ProfilingResult => {
    const columnProfiles: ColumnProfile[] = selectedColumns.map(col => {
      const qualityIssues: QualityIssue[] = []
      
      // Generate random quality issues
      if (Math.random() > 0.7) {
        qualityIssues.push({
          type: 'missing_values',
          severity: 'medium',
          message: `${Math.floor(Math.random() * 20)}% missing values detected`,
          count: Math.floor(Math.random() * 100),
          percentage: Math.random() * 20,
          examples: ['', null, undefined].slice(0, Math.floor(Math.random() * 3))
        })
      }
      
      if (Math.random() > 0.8) {
        qualityIssues.push({
          type: 'outliers',
          severity: 'low',
          message: `${Math.floor(Math.random() * 10)} outliers detected`,
          count: Math.floor(Math.random() * 50),
          percentage: Math.random() * 10,
          examples: [Math.random() * 1000, Math.random() * 1000]
        })
      }

      const dataType = ['string', 'number', 'boolean', 'date', 'mixed'][Math.floor(Math.random() * 5)] as any
      const isNumeric = dataType === 'number' || dataType === 'mixed'

      return {
        name: col,
        dataType,
        count: data.length,
        nullCount: Math.floor(Math.random() * 50),
        nullPercentage: Math.random() * 20,
        uniqueCount: Math.floor(Math.random() * data.length),
        uniquePercentage: Math.random() * 100,
        duplicateCount: Math.floor(Math.random() * 100),
        duplicatePercentage: Math.random() * 50,
        statistics: isNumeric ? {
          mean: 50 + Math.random() * 100,
          median: 45 + Math.random() * 110,
          mode: Math.floor(Math.random() * 100),
          std: 10 + Math.random() * 30,
          min: Math.random() * 50,
          max: 100 + Math.random() * 200,
          quartiles: {
            q1: 20 + Math.random() * 30,
            q2: 40 + Math.random() * 40,
            q3: 60 + Math.random() * 30
          }
        } : undefined,
        qualityIssues,
        patterns: {
          email: Math.floor(Math.random() * 20),
          phone: Math.floor(Math.random() * 15),
          url: Math.floor(Math.random() * 10),
          date: Math.floor(Math.random() * 25),
          numeric: Math.floor(Math.random() * 30),
          alphanumeric: Math.floor(Math.random() * 40)
        },
        outliers: Math.random() > 0.5 ? {
          count: Math.floor(Math.random() * 20),
          percentage: Math.random() * 10,
          values: Array.from({ length: 3 }, () => Math.random() * 1000)
        } : undefined
      }
    })

    const totalIssues = columnProfiles.reduce((sum, col) => sum + col.qualityIssues.length, 0)
    const criticalIssues = columnProfiles.reduce((sum, col) => 
      sum + col.qualityIssues.filter(issue => issue.severity === 'high').length, 0
    )
    const warningIssues = columnProfiles.reduce((sum, col) => 
      sum + col.qualityIssues.filter(issue => issue.severity === 'medium').length, 0
    )
    const infoIssues = columnProfiles.reduce((sum, col) => 
      sum + col.qualityIssues.filter(issue => issue.severity === 'low').length, 0
    )

    const qualityScore = Math.max(0, 100 - (criticalIssues * 10) - (warningIssues * 5) - (infoIssues * 2))

    return {
      overview: {
        totalRows: data.length,
        totalColumns: selectedColumns.length,
        memoryUsage: `${(data.length * selectedColumns.length * 0.001).toFixed(2)} MB`,
        duplicateRows: Math.floor(Math.random() * 50),
        duplicatePercentage: Math.random() * 10,
        qualityScore,
        profilingTime: 2000 + Math.random() * 3000
      },
      columns: columnProfiles,
      qualitySummary: {
        totalIssues,
        criticalIssues,
        warningIssues,
        infoIssues
      },
      recommendations: [
        'Consider imputing missing values in critical columns',
        'Remove or investigate outlier values',
        'Standardize data formats for consistency',
        'Consider data type conversions for better analysis',
        'Implement data validation rules'
      ],
      createdAt: new Date()
    }
  }

  const exportProfile = (format: string) => {
    if (!profileResult) {
      toast.error('No profile data to export')
      return
    }

    let content = ''
    let mimeType = ''
    let filename = ''

    switch (format) {
      case 'json':
        content = JSON.stringify(profileResult, null, 2)
        mimeType = 'application/json'
        filename = `data_profile_${new Date().toISOString().split('T')[0]}.json`
        break
      case 'csv':
        const csvData = [
          ['Column', 'Data Type', 'Count', 'Null Count', 'Null %', 'Unique Count', 'Unique %', 'Quality Issues'],
          ...profileResult.columns.map(col => [
            col.name,
            col.dataType,
            col.count,
            col.nullCount,
            col.nullPercentage.toFixed(2),
            col.uniqueCount,
            col.uniquePercentage.toFixed(2),
            col.qualityIssues.length
          ])
        ]
        content = csvData.map(row => row.join(',')).join('\n')
        mimeType = 'text/csv'
        filename = `data_profile_${new Date().toISOString().split('T')[0]}.csv`
        break
      default:
        toast.error('Unsupported export format')
        return
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success(`Profile exported as ${format}`)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-950/30'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30'
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/30'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low': return <AlertTriangle className="h-4 w-4 text-blue-500" />
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <Tabs defaultValue="configuration" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Column Details</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Profiling Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Profiling Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Columns to Profile</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {columns.map(col => (
                      <label key={col} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(col)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns(prev => [...prev, col])
                            } else {
                              setSelectedColumns(prev => prev.filter(c => c !== col))
                            }
                          }}
                        />
                        <span className="text-sm">{col}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Analysis Options</h4>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeQualityChecks}
                      onChange={(e) => setIncludeQualityChecks(e.target.checked)}
                    />
                    <span className="text-sm">Quality Checks</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeStatisticalAnalysis}
                      onChange={(e) => setIncludeStatisticalAnalysis(e.target.checked)}
                    />
                    <span className="text-sm">Statistical Analysis</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeDataTypes}
                      onChange={(e) => setIncludeDataTypes(e.target.checked)}
                    />
                    <span className="text-sm">Data Type Detection</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeMissingValues}
                      onChange={(e) => setIncludeMissingValues(e.target.checked)}
                    />
                    <span className="text-sm">Missing Values Analysis</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeOutliers}
                      onChange={(e) => setIncludeOutliers(e.target.checked)}
                    />
                    <span className="text-sm">Outlier Detection</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeDuplicates}
                      onChange={(e) => setIncludeDuplicates(e.target.checked)}
                    />
                    <span className="text-sm">Duplicate Detection</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includePatterns}
                      onChange={(e) => setIncludePatterns(e.target.checked)}
                    />
                    <span className="text-sm">Pattern Recognition</span>
                  </label>
                </div>

                <Button 
                  onClick={performProfiling} 
                  disabled={isProfiling || selectedColumns.length === 0}
                  className="w-full"
                >
                  {isProfiling ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Profiling...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Start Profiling
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Profiling Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Profiling Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isProfiling && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{Math.round(profilingProgress)}%</span>
                      </div>
                      <Progress value={profilingProgress} className="w-full" />
                    </div>
                    
                    {currentStep && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {currentStep}
                      </div>
                    )}
                  </div>
                )}

                {profileResult && (
                  <div className="space-y-4">
                    <div className="text-center p-4 border rounded-md">
                      <div className={`text-3xl font-bold ${getQualityScoreColor(profileResult.overview.qualityScore)}`}>
                        {profileResult.overview.qualityScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Quality Score</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 border rounded-md">
                        <div className="font-bold">{profileResult.overview.totalRows}</div>
                        <div className="text-gray-600 dark:text-gray-400">Rows</div>
                      </div>
                      <div className="text-center p-2 border rounded-md">
                        <div className="font-bold">{profileResult.overview.totalColumns}</div>
                        <div className="text-gray-600 dark:text-gray-400">Columns</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          {profileResult ? (
            <div className="space-y-4">
              {/* Quality Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Quality Summary</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportProfile('json')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportProfile('csv')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 border rounded-md">
                      <div className="text-2xl font-bold text-red-600">
                        {profileResult.qualitySummary.criticalIssues}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Critical Issues</div>
                    </div>
                    <div className="text-center p-4 border rounded-md">
                      <div className="text-2xl font-bold text-yellow-600">
                        {profileResult.qualitySummary.warningIssues}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Warnings</div>
                    </div>
                    <div className="text-center p-4 border rounded-md">
                      <div className="text-2xl font-bold text-blue-600">
                        {profileResult.qualitySummary.infoIssues}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Info Issues</div>
                    </div>
                    <div className="text-center p-4 border rounded-md">
                      <div className="text-2xl font-bold text-gray-600">
                        {profileResult.qualitySummary.totalIssues}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Issues</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                    <div className="space-y-2">
                      {profileResult.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                          <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Column Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Column Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Column</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Null %</th>
                          <th className="text-left p-2">Unique %</th>
                          <th className="text-left p-2">Issues</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profileResult.columns.map((col, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-medium">{col.name}</td>
                            <td className="p-2">
                              <Badge variant="outline">{col.dataType}</Badge>
                            </td>
                            <td className="p-2">{col.nullPercentage.toFixed(1)}%</td>
                            <td className="p-2">{col.uniquePercentage.toFixed(1)}%</td>
                            <td className="p-2">{col.qualityIssues.length}</td>
                            <td className="p-2">
                              {col.qualityIssues.length === 0 ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  Run data profiling to see overview here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {profileResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <Label htmlFor="columnSelect">Select Column</Label>
                    <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {profileResult.columns.map(col => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="severityFilter">Filter by Severity</Label>
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {selectedColumn && (() => {
                const column = profileResult.columns.find(col => col.name === selectedColumn)!
                const filteredIssues = filterSeverity === 'all' 
                  ? column.qualityIssues 
                  : column.qualityIssues.filter(issue => issue.severity === filterSeverity)

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Column Statistics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Column Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 border rounded-md">
                            <div className="text-xl font-bold">{column.count}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Count</div>
                          </div>
                          <div className="text-center p-3 border rounded-md">
                            <div className="text-xl font-bold">{column.nullCount}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Null Count</div>
                          </div>
                          <div className="text-center p-3 border rounded-md">
                            <div className="text-xl font-bold">{column.uniqueCount}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Unique Count</div>
                          </div>
                          <div className="text-center p-3 border rounded-md">
                            <div className="text-xl font-bold">{column.duplicateCount}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Duplicates</div>
                          </div>
                        </div>

                        {column.statistics && (
                          <div>
                            <h4 className="font-semibold mb-2">Numeric Statistics</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Mean: {column.statistics.mean?.toFixed(2)}</div>
                              <div>Median: {column.statistics.median?.toFixed(2)}</div>
                              <div>Mode: {column.statistics.mode}</div>
                              <div>Std Dev: {column.statistics.std?.toFixed(2)}</div>
                              <div>Min: {column.statistics.min}</div>
                              <div>Max: {column.statistics.max}</div>
                            </div>
                          </div>
                        )}

                        {column.patterns && (
                          <div>
                            <h4 className="font-semibold mb-2">Pattern Detection</h4>
                            <div className="space-y-1 text-sm">
                              {Object.entries(column.patterns).map(([pattern, count]) => (
                                <div key={pattern} className="flex justify-between">
                                  <span className="capitalize">{pattern}:</span>
                                  <span>{count} matches</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quality Issues */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Quality Issues ({filteredIssues.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {filteredIssues.length > 0 ? (
                          <div className="space-y-3">
                            {filteredIssues.map((issue, index) => (
                              <div key={index} className={`p-3 rounded-md border ${getSeverityColor(issue.severity)}`}>
                                <div className="flex items-start space-x-2">
                                  {getSeverityIcon(issue.severity)}
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{issue.message}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {issue.count} occurrences ({issue.percentage.toFixed(1)}%)
                                    </div>
                                    {issue.examples.length > 0 && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Examples: {issue.examples.slice(0, 3).join(', ')}
                                        {issue.examples.length > 3 && '...'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No {filterSeverity === 'all' ? '' : filterSeverity} issues found
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })()}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  Run data profiling to see column details here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
