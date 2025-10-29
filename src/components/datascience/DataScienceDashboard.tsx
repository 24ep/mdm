'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Database, 
  Upload, 
  Download, 
  Code, 
  Brain,
  TrendingUp,
  Settings,
  Play,
  RefreshCw,
  Eye,
  FileText,
  Zap
} from 'lucide-react'
import { DataVisualization } from './DataVisualization'
import { DataImportExport } from './DataImportExport'
import { SQLIntegration } from './SQLIntegration'
import { MLPipeline } from './MLPipeline'
import { StatisticalAnalysis } from './StatisticalAnalysis'
import { DataProfiling } from './DataProfiling'
import { DeepNoteLayoutRefactored as DeepNoteLayout } from './DeepNoteLayout'
import { cn } from '@/lib/utils'

interface DataScienceDashboardProps {
  className?: string
}

interface DashboardStats {
  totalNotebooks: number
  activeNotebooks: number
  totalQueries: number
  dataSources: number
  visualizations: number
  lastActivity: Date
}

export function DataScienceDashboard({ className }: DataScienceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'notebooks' | 'data' | 'sql' | 'viz' | 'ml' | 'stats' | 'profiling'>('overview')
  const [stats, setStats] = useState<DashboardStats>({
    totalNotebooks: 0,
    activeNotebooks: 0,
    totalQueries: 0,
    dataSources: 0,
    visualizations: 0,
    lastActivity: new Date()
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [sampleData, setSampleData] = useState<any[]>([])
  const [dataColumns, setDataColumns] = useState<string[]>([])

  // Load sample data
  useEffect(() => {
    const sample = [
      { id: 1, name: 'Product A', category: 'Electronics', price: 299.99, sales: 150, rating: 4.5 },
      { id: 2, name: 'Product B', category: 'Clothing', price: 49.99, sales: 200, rating: 4.2 },
      { id: 3, name: 'Product C', category: 'Electronics', price: 199.99, sales: 75, rating: 4.8 },
      { id: 4, name: 'Product D', category: 'Home', price: 89.99, sales: 120, rating: 4.1 },
      { id: 5, name: 'Product E', category: 'Clothing', price: 29.99, sales: 300, rating: 3.9 }
    ]
    
    setSampleData(sample)
    setDataColumns(Object.keys(sample[0]))
    setStats(prev => ({
      ...prev,
      totalNotebooks: 12,
      activeNotebooks: 3,
      totalQueries: 45,
      dataSources: 8,
      visualizations: 23
    }))

    setRecentActivity([
      { id: 1, type: 'notebook', action: 'Created', name: 'Sales Analysis', time: '2 hours ago' },
      { id: 2, type: 'query', action: 'Executed', name: 'SELECT * FROM products', time: '4 hours ago' },
      { id: 3, type: 'viz', action: 'Generated', name: 'Revenue Chart', time: '6 hours ago' },
      { id: 4, type: 'data', action: 'Imported', name: 'customer_data.csv', time: '1 day ago' },
      { id: 5, type: 'ml', action: 'Trained', name: 'Price Prediction Model', time: '2 days ago' }
    ])
  }, [])

  const handleDataImported = (data: any[], metadata: any) => {
    setSampleData(data)
    setDataColumns(metadata.columns || Object.keys(data[0] || {}))
    setStats(prev => ({
      ...prev,
      dataSources: prev.dataSources + 1,
      lastActivity: new Date()
    }))
  }

  const handleQueryExecuted = (query: string, results: any[], metadata: any) => {
    setStats(prev => ({
      ...prev,
      totalQueries: prev.totalQueries + 1,
      lastActivity: new Date()
    }))
  }

  const handleVisualizationCreated = (config: any) => {
    setStats(prev => ({
      ...prev,
      visualizations: prev.visualizations + 1,
      lastActivity: new Date()
    }))
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'notebook': return <FileText className="h-4 w-4" />
      case 'query': return <Database className="h-4 w-4" />
      case 'viz': return <BarChart3 className="h-4 w-4" />
      case 'data': return <Upload className="h-4 w-4" />
      case 'ml': return <Brain className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'notebook': return 'text-blue-600'
      case 'query': return 'text-green-600'
      case 'viz': return 'text-purple-600'
      case 'data': return 'text-orange-600'
      case 'ml': return 'text-pink-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Science Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive data analysis and machine learning platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Quick Start
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notebooks">Notebooks</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="sql">SQL</TabsTrigger>
          <TabsTrigger value="viz">Visualization</TabsTrigger>
          <TabsTrigger value="ml">ML Pipeline</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="profiling">Profiling</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalNotebooks}</p>
                    <p className="text-sm text-gray-600">Notebooks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Play className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeNotebooks}</p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Database className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalQueries}</p>
                    <p className="text-sm text-gray-600">Queries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Upload className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.dataSources}</p>
                    <p className="text-sm text-gray-600">Data Sources</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.visualizations}</p>
                    <p className="text-sm text-gray-600">Charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <div className={cn("p-2 rounded-lg", getActivityColor(activity.type))}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action} {activity.name}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('notebooks')}
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">New Notebook</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('data')}
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Import Data</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('sql')}
                  >
                    <Database className="h-6 w-6" />
                    <span className="text-sm">SQL Query</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('viz')}
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Create Chart</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('ml')}
                  >
                    <Brain className="h-6 w-6" />
                    <span className="text-sm">ML Pipeline</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('stats')}
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm">Statistics</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('profiling')}
                  >
                    <Search className="h-6 w-6" />
                    <span className="text-sm">Data Profiling</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('overview')}
                  >
                    <Eye className="h-6 w-6" />
                    <span className="text-sm">Overview</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notebooks">
          <Card>
            <CardHeader>
              <CardTitle>Jupyter Notebooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <DeepNoteLayout
                  initialNotebook={{
                    id: 'dashboard-notebook-1',
                    name: 'Data Science Analysis',
                    description: 'Comprehensive data analysis notebook',
                    cells: [
                      {
                        id: 'cell-1',
                        type: 'markdown',
                        content: '# Data Science Analysis\n\nThis notebook demonstrates various data science techniques.',
                        status: 'idle',
                        timestamp: new Date(),
                        metadata: {}
                      },
                      {
                        id: 'cell-2',
                        type: 'code',
                        content: '# Import libraries\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nprint("Libraries imported successfully!")',
                        status: 'idle',
                        timestamp: new Date(),
                        metadata: {}
                      }
                    ],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    tags: ['data-science', 'analysis'],
                    isPublic: false,
                    author: 'Data Scientist',
                    theme: 'light',
                    settings: {
                      autoSave: true,
                      executionMode: 'sequential',
                      showLineNumbers: true,
                      fontSize: 14,
                      tabSize: 2,
                      wordWrap: true
                    }
                  }}
                  enableCollaboration={true}
                  enableFileManager={true}
                  enableExport={true}
                  enableVersionControl={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <DataImportExport
            onDataImported={handleDataImported}
            onDataExported={(format, data) => {
              console.log(`Exported ${data.length} rows as ${format}`)
            }}
          />
        </TabsContent>

        <TabsContent value="sql">
          <SQLIntegration
            onQueryExecuted={handleQueryExecuted}
            onConnectionEstablished={(connection) => {
              console.log('Connected to:', connection.name)
            }}
          />
        </TabsContent>

        <TabsContent value="viz">
          <DataVisualization
            data={sampleData}
            columns={dataColumns}
            onUpdate={handleVisualizationCreated}
          />
        </TabsContent>

        <TabsContent value="ml">
          <MLPipeline
            data={sampleData}
            onTrainModel={(config) => {
              console.log('Training model with config:', config)
              return Promise.resolve({
                modelId: 'model-1',
                algorithm: config.algorithm,
                accuracy: 0.85,
                precision: 0.82,
                recall: 0.80,
                f1Score: 0.81,
                confusionMatrix: [[45, 5], [8, 42]],
                featureImportance: {},
                trainingTime: 5000,
                model: {}
              })
            }}
            onPredict={(modelId, data) => {
              console.log('Making predictions with model:', modelId)
              return Promise.resolve(data.map(() => ({
                prediction: 'Class A',
                confidence: 0.8,
                probabilities: { 'Class A': 0.8, 'Class B': 0.2 }
              })))
            }}
            onSaveModel={(model) => {
              console.log('Saving model:', model)
            }}
            onLoadModel={(modelId) => {
              console.log('Loading model:', modelId)
              return {
                id: modelId,
                name: 'Sample Model',
                algorithm: 'random_forest',
                accuracy: 0.85,
                createdAt: new Date(),
                status: 'trained' as const,
                config: {
                  algorithm: 'random_forest',
                  targetColumn: 'target',
                  featureColumns: ['feature1', 'feature2'],
                  testSize: 0.2,
                  randomState: 42,
                  hyperparameters: {}
                }
              }
            }}
          />
        </TabsContent>

        <TabsContent value="stats">
          <StatisticalAnalysis
            data={sampleData}
            onAnalyze={(analysisType, config) => {
              console.log('Running analysis:', analysisType, config)
              return Promise.resolve({
                type: analysisType,
                summary: {
                  count: sampleData.length,
                  mean: 50,
                  median: 45,
                  std: 15,
                  min: 10,
                  max: 90
                },
                createdAt: new Date()
              })
            }}
            onExportResults={(results, format) => {
              console.log('Exporting results as:', format)
            }}
          />
        </TabsContent>

        <TabsContent value="profiling">
          <DataProfiling
            data={sampleData}
            onProfile={(config) => {
              console.log('Profiling data with config:', config)
              return Promise.resolve({
                overview: {
                  totalRows: sampleData.length,
                  totalColumns: dataColumns.length,
                  memoryUsage: '1.2 MB',
                  duplicateRows: 0,
                  duplicatePercentage: 0,
                  qualityScore: 85,
                  profilingTime: 2000
                },
                columns: dataColumns.map(col => ({
                  name: col,
                  dataType: 'string' as const,
                  count: sampleData.length,
                  nullCount: 0,
                  nullPercentage: 0,
                  uniqueCount: sampleData.length,
                  uniquePercentage: 100,
                  duplicateCount: 0,
                  duplicatePercentage: 0,
                  qualityIssues: []
                })),
                qualitySummary: {
                  totalIssues: 0,
                  criticalIssues: 0,
                  warningIssues: 0,
                  infoIssues: 0
                },
                recommendations: [],
                createdAt: new Date()
              })
            }}
            onExportProfile={(profile, format) => {
              console.log('Exporting profile as:', format)
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
