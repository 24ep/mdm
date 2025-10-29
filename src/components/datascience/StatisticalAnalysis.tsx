'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Calculator, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  FileText,
  Target,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface StatisticalAnalysisProps {
  data?: any[]
  onAnalyze?: (analysisType: string, config: AnalysisConfig) => Promise<AnalysisResult>
  onExportResults?: (results: AnalysisResult, format: string) => void
}

interface AnalysisConfig {
  columns: string[]
  groupBy?: string
  testType?: string
  confidenceLevel?: number
  alternative?: string
}

interface AnalysisResult {
  type: string
  summary: {
    count: number
    mean?: number
    median?: number
    mode?: number
    std?: number
    variance?: number
    min?: number
    max?: number
    range?: number
    quartiles?: {
      q1: number
      q2: number
      q3: number
    }
  }
  testResults?: {
    statistic: number
    pValue: number
    criticalValue?: number
    significant: boolean
    interpretation: string
  }
  correlation?: {
    pearson: number
    spearman: number
    kendall: number
  }
  distribution?: {
    skewness: number
    kurtosis: number
    normality: boolean
    shapiroWilk?: {
      statistic: number
      pValue: number
    }
  }
  confidenceInterval?: {
    lower: number
    upper: number
    level: number
  }
  createdAt: Date
}

export function StatisticalAnalysis({ 
  data = [], 
  onAnalyze, 
  onExportResults 
}: StatisticalAnalysisProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [analysisType, setAnalysisType] = useState<string>('descriptive')
  const [groupBy, setGroupBy] = useState<string>('')
  const [testType, setTestType] = useState<string>('t_test')
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95)
  const [alternative, setAlternative] = useState<string>('two_sided')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [selectedResult, setSelectedResult] = useState<string>('')

  const columns = data.length > 0 ? Object.keys(data[0]) : []

  const analysisTypes = [
    { value: 'descriptive', label: 'Descriptive Statistics', description: 'Mean, median, mode, standard deviation, etc.' },
    { value: 'correlation', label: 'Correlation Analysis', description: 'Pearson, Spearman, and Kendall correlations' },
    { value: 'hypothesis_test', label: 'Hypothesis Testing', description: 't-tests, chi-square, ANOVA, etc.' },
    { value: 'distribution', label: 'Distribution Analysis', description: 'Normality tests, skewness, kurtosis' },
    { value: 'regression', label: 'Regression Analysis', description: 'Linear and multiple regression' },
    { value: 'anova', label: 'ANOVA', description: 'Analysis of variance' },
    { value: 'chi_square', label: 'Chi-Square Test', description: 'Goodness of fit and independence tests' }
  ]

  const testTypes = [
    { value: 't_test', label: 'One-Sample t-test' },
    { value: 'paired_t_test', label: 'Paired t-test' },
    { value: 'independent_t_test', label: 'Independent t-test' },
    { value: 'wilcoxon', label: 'Wilcoxon Signed-Rank Test' },
    { value: 'mann_whitney', label: 'Mann-Whitney U Test' },
    { value: 'kruskal_wallis', label: 'Kruskal-Wallis Test' }
  ]

  const alternatives = [
    { value: 'two_sided', label: 'Two-sided' },
    { value: 'greater', label: 'Greater than' },
    { value: 'less', label: 'Less than' }
  ]

  useEffect(() => {
    if (columns.length > 0) {
      setSelectedColumns([columns[0]]) // Select first column by default
    }
  }, [columns])

  const performAnalysis = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column for analysis')
      return
    }

    setIsAnalyzing(true)

    try {
      const config: AnalysisConfig = {
        columns: selectedColumns,
        groupBy: groupBy || undefined,
        testType: analysisType === 'hypothesis_test' ? testType : undefined,
        confidenceLevel,
        alternative: analysisType === 'hypothesis_test' ? alternative : undefined
      }

      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

      const mockResult = generateMockResult(analysisType, selectedColumns)
      setResults(prev => [mockResult, ...prev])
      setSelectedResult(mockResult.type)
      
      toast.success('Analysis completed successfully')
    } catch (error) {
      toast.error('Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateMockResult = (type: string, columns: string[]): AnalysisResult => {
    const baseResult: AnalysisResult = {
      type,
      summary: {
        count: data.length,
        mean: 50 + Math.random() * 50,
        median: 45 + Math.random() * 60,
        mode: 40 + Math.random() * 70,
        std: 10 + Math.random() * 20,
        variance: 100 + Math.random() * 400,
        min: 0 + Math.random() * 20,
        max: 80 + Math.random() * 20,
        range: 60 + Math.random() * 40,
        quartiles: {
          q1: 20 + Math.random() * 30,
          q2: 40 + Math.random() * 40,
          q3: 60 + Math.random() * 30
        }
      },
      createdAt: new Date()
    }

    switch (type) {
      case 'correlation':
        return {
          ...baseResult,
          correlation: {
            pearson: -0.8 + Math.random() * 1.6,
            spearman: -0.7 + Math.random() * 1.4,
            kendall: -0.6 + Math.random() * 1.2
          }
        }
      
      case 'hypothesis_test':
        const pValue = Math.random()
        return {
          ...baseResult,
          testResults: {
            statistic: -2 + Math.random() * 4,
            pValue,
            criticalValue: -1.96 + Math.random() * 3.92,
            significant: pValue < 0.05,
            interpretation: pValue < 0.05 
              ? 'The result is statistically significant (p < 0.05)'
              : 'The result is not statistically significant (p ≥ 0.05)'
          },
          confidenceInterval: {
            lower: baseResult.summary.mean! - 2 * baseResult.summary.std!,
            upper: baseResult.summary.mean! + 2 * baseResult.summary.std!,
            level: confidenceLevel
          }
        }
      
      case 'distribution':
        const skewness = -2 + Math.random() * 4
        const kurtosis = -2 + Math.random() * 4
        return {
          ...baseResult,
          distribution: {
            skewness,
            kurtosis,
            normality: Math.random() > 0.3,
            shapiroWilk: {
              statistic: 0.8 + Math.random() * 0.2,
              pValue: Math.random()
            }
          }
        }
      
      default:
        return baseResult
    }
  }

  const exportResults = (format: string) => {
    if (!selectedResult) {
      toast.error('Please select a result to export')
      return
    }

    const result = results.find(r => r.type === selectedResult)
    if (!result) return

    let content = ''
    let mimeType = ''
    let filename = ''

    switch (format) {
      case 'json':
        content = JSON.stringify(result, null, 2)
        mimeType = 'application/json'
        filename = `analysis_${result.type}_${new Date().toISOString().split('T')[0]}.json`
        break
      case 'csv':
        const csvData = [
          ['Metric', 'Value'],
          ['Count', result.summary.count],
          ['Mean', result.summary.mean?.toFixed(4) || 'N/A'],
          ['Median', result.summary.median?.toFixed(4) || 'N/A'],
          ['Mode', result.summary.mode?.toFixed(4) || 'N/A'],
          ['Standard Deviation', result.summary.std?.toFixed(4) || 'N/A'],
          ['Variance', result.summary.variance?.toFixed(4) || 'N/A'],
          ['Minimum', result.summary.min?.toFixed(4) || 'N/A'],
          ['Maximum', result.summary.max?.toFixed(4) || 'N/A'],
          ['Range', result.summary.range?.toFixed(4) || 'N/A']
        ]
        content = csvData.map(row => row.join(',')).join('\n')
        mimeType = 'text/csv'
        filename = `analysis_${result.type}_${new Date().toISOString().split('T')[0]}.csv`
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
    
    toast.success(`Results exported as ${format}`)
  }

  const getSignificanceIcon = (significant?: boolean) => {
    if (significant === undefined) return null
    return significant ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
    )
  }

  const getCorrelationStrength = (value: number) => {
    const abs = Math.abs(value)
    if (abs >= 0.8) return { label: 'Very Strong', color: 'text-red-600' }
    if (abs >= 0.6) return { label: 'Strong', color: 'text-orange-600' }
    if (abs >= 0.4) return { label: 'Moderate', color: 'text-yellow-600' }
    if (abs >= 0.2) return { label: 'Weak', color: 'text-blue-600' }
    return { label: 'Very Weak', color: 'text-gray-600' }
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <Tabs defaultValue="analysis" className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis">Run Analysis</TabsTrigger>
          <TabsTrigger value="results">View Results</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Analysis Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Analysis Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="analysisType">Analysis Type</Label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select analysis type" />
                    </SelectTrigger>
                    <SelectContent>
                      {analysisTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Columns to Analyze</Label>
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

                {analysisType === 'hypothesis_test' && (
                  <>
                    <div>
                      <Label htmlFor="testType">Test Type</Label>
                      <Select value={testType} onValueChange={setTestType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                        <SelectContent>
                          {testTypes.map(test => (
                            <SelectItem key={test.value} value={test.value}>
                              {test.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="alternative">Alternative Hypothesis</Label>
                      <Select value={alternative} onValueChange={setAlternative}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select alternative" />
                        </SelectTrigger>
                        <SelectContent>
                          {alternatives.map(alt => (
                            <SelectItem key={alt.value} value={alt.value}>
                              {alt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="confidenceLevel">Confidence Level</Label>
                  <Select value={confidenceLevel.toString()} onValueChange={(value) => setConfidenceLevel(parseFloat(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select confidence level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.90">90%</SelectItem>
                      <SelectItem value="0.95">95%</SelectItem>
                      <SelectItem value="0.99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={performAnalysis} 
                  disabled={isAnalyzing || selectedColumns.length === 0}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Help */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Descriptive Statistics</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Provides basic statistical measures including mean, median, mode, 
                      standard deviation, variance, and quartiles.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Correlation Analysis</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Measures the strength and direction of linear relationships between variables 
                      using Pearson, Spearman, and Kendall correlation coefficients.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Hypothesis Testing</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Tests statistical hypotheses about population parameters using various 
                      parametric and non-parametric tests.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Distribution Analysis</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Examines the shape and characteristics of data distributions, 
                      including normality tests, skewness, and kurtosis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {results.length > 0 ? (
            <div className="space-y-4">
              {/* Results List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Analysis Results</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Select value={selectedResult} onValueChange={setSelectedResult}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select result to view" />
                        </SelectTrigger>
                        <SelectContent>
                          {results.map((result, index) => (
                            <SelectItem key={result.type} value={result.type}>
                              {analysisTypes.find(t => t.value === result.type)?.label} - {result.createdAt.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedResult && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportResults('json')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            JSON
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportResults('csv')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            CSV
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedResult && (() => {
                    const result = results.find(r => r.type === selectedResult)!
                    return (
                      <div className="space-y-6">
                        {/* Summary Statistics */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 border rounded-md">
                              <div className="text-2xl font-bold text-blue-600">
                                {result.summary.count}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Count</div>
                            </div>
                            <div className="text-center p-4 border rounded-md">
                              <div className="text-2xl font-bold text-green-600">
                                {result.summary.mean?.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Mean</div>
                            </div>
                            <div className="text-center p-4 border rounded-md">
                              <div className="text-2xl font-bold text-purple-600">
                                {result.summary.median?.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Median</div>
                            </div>
                            <div className="text-center p-4 border rounded-md">
                              <div className="text-2xl font-bold text-orange-600">
                                {result.summary.std?.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Std Dev</div>
                            </div>
                          </div>
                        </div>

                        {/* Test Results */}
                        {result.testResults && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                              Test Results
                              {getSignificanceIcon(result.testResults.significant)}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 border rounded-md">
                                <div className="text-xl font-bold">
                                  {result.testResults.statistic.toFixed(4)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Statistic</div>
                              </div>
                              <div className="text-center p-4 border rounded-md">
                                <div className="text-xl font-bold">
                                  {result.testResults.pValue.toFixed(4)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">p-value</div>
                              </div>
                              <div className="text-center p-4 border rounded-md">
                                <div className="text-xl font-bold">
                                  {result.testResults.criticalValue?.toFixed(4)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Critical Value</div>
                              </div>
                              <div className="text-center p-4 border rounded-md">
                                <div className="text-xl font-bold">
                                  {result.testResults.significant ? 'Yes' : 'No'}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Significant</div>
                              </div>
                            </div>
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <p className="text-sm">{result.testResults.interpretation}</p>
                            </div>
                          </div>
                        )}

                        {/* Correlation Results */}
                        {result.correlation && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Correlation Analysis</h3>
                            <div className="space-y-3">
                              {Object.entries(result.correlation).map(([type, value]) => {
                                const strength = getCorrelationStrength(value)
                                return (
                                  <div key={type} className="flex items-center justify-between p-3 border rounded-md">
                                    <span className="font-medium capitalize">{type} Correlation</span>
                                    <div className="flex items-center space-x-2">
                                      <span className={`font-bold ${strength.color}`}>
                                        {value.toFixed(4)}
                                      </span>
                                      <Badge variant="outline" className={strength.color}>
                                        {strength.label}
                                      </Badge>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Distribution Results */}
                        {result.distribution && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Distribution Analysis</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 border rounded-md">
                                <div className="text-xl font-bold">
                                  {result.distribution.skewness.toFixed(4)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Skewness</div>
                              </div>
                              <div className="text-center p-4 border rounded-md">
                                <div className="text-xl font-bold">
                                  {result.distribution.kurtosis.toFixed(4)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Kurtosis</div>
                              </div>
                              <div className="text-center p-4 border rounded-md">
                                <div className="text-xl font-bold">
                                  {result.distribution.normality ? 'Yes' : 'No'}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Normal</div>
                              </div>
                              <div className="text-center p-4 border rounded-md">
                                <div className="text-xl font-bold">
                                  {result.distribution.shapiroWilk?.pValue.toFixed(4)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Shapiro p-value</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  Run an analysis to see results here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
