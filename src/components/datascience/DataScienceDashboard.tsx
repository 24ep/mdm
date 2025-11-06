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
  Zap,
  Users,
  GitBranch,
  Clock,
  Cloud,
  Search
} from 'lucide-react'
import { DataVisualization } from './DataVisualization'
import { DataImportExport } from './DataImportExport'
import { SQLIntegration } from './SQLIntegration'
import { MLPipeline } from './MLPipeline'
import { StatisticalAnalysis } from './StatisticalAnalysis'
import { DataProfiling } from './DataProfiling'
import { CollaborationFeatures } from './CollaborationFeatures'
import { VersionControl } from './VersionControl'
import { SchedulingAutomation } from './SchedulingAutomation'
import { CloudIntegration } from './CloudIntegration'
import { DeepNoteLayoutRefactored as DeepNoteLayout } from './DeepNoteLayoutRefactored'
import { NotebookTemplates } from './NotebookTemplates'
import { generateNotebookId } from './utils'
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
  const [activeTab, setActiveTab] = useState<'overview' | 'notebooks' | 'data' | 'sql' | 'viz' | 'ml' | 'stats' | 'profiling' | 'collaboration' | 'version' | 'scheduling' | 'cloud'>('overview')
  const [notebookView, setNotebookView] = useState<'table' | 'grid'>('table')
  const [selectedNotebook, setSelectedNotebook] = useState<any | null>(null)
  const [notebooks, setNotebooks] = useState<any[]>([])
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)

  // Start with empty state; populate via real imports, queries, or APIs
  useEffect(() => {
    setSampleData([])
    setDataColumns([])
    setRecentActivity([])
    setNotebooks([])
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
        <TabsList className="grid w-full grid-cols-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notebooks">Notebooks</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="sql">SQL</TabsTrigger>
          <TabsTrigger value="viz">Visualization</TabsTrigger>
          <TabsTrigger value="ml">ML Pipeline</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="profiling">Profiling</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="version">Version Control</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="cloud">Cloud</TabsTrigger>
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
                    onClick={() => setActiveTab('collaboration')}
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Collaborate</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('version')}
                  >
                    <GitBranch className="h-6 w-6" />
                    <span className="text-sm">Version Control</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('scheduling')}
                  >
                    <Clock className="h-6 w-6" />
                    <span className="text-sm">Schedule</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('cloud')}
                  >
                    <Cloud className="h-6 w-6" />
                    <span className="text-sm">Cloud</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notebooks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notebooks</CardTitle>
                {!selectedNotebook && (
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setShowCreateModal(true)} size="sm">
                      Create New
                    </Button>
                    <Button variant={notebookView === 'table' ? 'default' : 'outline'} onClick={() => setNotebookView('table')} size="sm">
                      Table
                    </Button>
                    <Button variant={notebookView === 'grid' ? 'default' : 'outline'} onClick={() => setNotebookView('grid')} size="sm">
                      Grid
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedNotebook ? (
                <div className="space-y-4">
                  {notebookView === 'table' ? (
                    <div className="w-full overflow-x-auto">
                      <table className="min-w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left text-sm font-medium text-gray-600 px-4 py-2 border-b">Name</th>
                            <th className="text-left text-sm font-medium text-gray-600 px-4 py-2 border-b">Author</th>
                            <th className="text-left text-sm font-medium text-gray-600 px-4 py-2 border-b">Tags</th>
                            <th className="text-left text-sm font-medium text-gray-600 px-4 py-2 border-b">Cells</th>
                            <th className="text-left text-sm font-medium text-gray-600 px-4 py-2 border-b">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notebooks.map((nb) => (
                            <tr key={nb.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedNotebook(nb)}>
                              <td className="px-4 py-2 border-b text-sm font-medium text-blue-600">{nb.name}</td>
                              <td className="px-4 py-2 border-b text-sm text-gray-700">{nb.author}</td>
                              <td className="px-4 py-2 border-b text-sm text-gray-700">
                                <div className="flex flex-wrap gap-1">
                                  {(nb.tags || []).map((t: string) => (
                                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-2 border-b text-sm text-gray-700">{nb.cells?.length || 0}</td>
                              <td className="px-4 py-2 border-b text-sm text-gray-700">{new Date(nb.updatedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {notebooks.map((nb) => (
                        <div key={nb.id} className="border rounded-lg p-4 hover:shadow cursor-pointer" onClick={() => setSelectedNotebook(nb)}>
                          <div className="text-base font-semibold text-gray-900">{nb.name}</div>
                          <div className="text-xs text-gray-500 mt-1">by {nb.author}</div>
                          <div className="text-sm text-gray-600 mt-2 line-clamp-2">{nb.description}</div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex flex-wrap gap-1">
                              {(nb.tags || []).map((t: string) => (
                                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                              ))}
                            </div>
                            <div className="text-xs text-gray-500">{nb.cells?.length || 0} cells</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedNotebook(null)}>Back</Button>
                      <div className="text-sm text-gray-600">Viewing: <span className="font-medium text-gray-900">{selectedNotebook.name}</span></div>
                    </div>
                  </div>
                  <div className="h-[600px]">
                    <DeepNoteLayout
                      initialNotebook={{
                        id: selectedNotebook.id,
                        name: selectedNotebook.name,
                        description: selectedNotebook.description || '',
                        cells: selectedNotebook.cells || [],
                        createdAt: selectedNotebook.createdAt || new Date(),
                        updatedAt: selectedNotebook.updatedAt || new Date(),
                        tags: selectedNotebook.tags || [],
                        isPublic: selectedNotebook.isPublic || false,
                        author: selectedNotebook.author || 'Unknown',
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
                </div>
              )}
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

        <TabsContent value="collaboration">
          <CollaborationFeatures
            notebookId="notebook-1"
            onShare={(shareConfig) => {
              console.log('Sharing notebook with config:', shareConfig)
            }}
            onInviteUser={(email, role) => {
              console.log('Inviting user:', email, 'with role:', role)
            }}
            onComment={(comment) => {
              console.log('New comment:', comment)
            }}
            onUpdatePermissions={(userId, permissions) => {
              console.log('Updating permissions for user:', userId, permissions)
            }}
          />
        </TabsContent>

        <TabsContent value="version">
          <VersionControl
            notebookId="notebook-1"
            onCommit={(commit) => {
              console.log('New commit:', commit)
            }}
            onBranch={(branch) => {
              console.log('New branch:', branch)
            }}
            onMerge={(merge) => {
              console.log('Merge request:', merge)
            }}
            onRevert={(version) => {
              console.log('Reverting to version:', version)
            }}
            onExport={(version, format) => {
              console.log('Exporting version:', version, 'as', format)
            }}
          />
        </TabsContent>

        <TabsContent value="scheduling">
          <SchedulingAutomation
            notebookId="notebook-1"
            onSchedule={(schedule) => {
              console.log('New schedule:', schedule)
            }}
            onRunNow={(schedule) => {
              console.log('Running schedule now:', schedule)
            }}
            onStop={(scheduleId) => {
              console.log('Stopping schedule:', scheduleId)
            }}
            onDelete={(scheduleId) => {
              console.log('Deleting schedule:', scheduleId)
            }}
            onUpdate={(schedule) => {
              console.log('Updating schedule:', schedule)
            }}
          />
        </TabsContent>

        <TabsContent value="cloud">
          <CloudIntegration
            onConnect={(config) => {
              console.log('Connecting to cloud:', config)
            }}
            onDisconnect={(configId) => {
              console.log('Disconnecting from cloud:', configId)
            }}
            onSync={(configId) => {
              console.log('Syncing cloud resources:', configId)
            }}
            onDeploy={(deployment) => {
              console.log('Deploying to cloud:', deployment)
            }}
          />
        </TabsContent>
      </Tabs>
      {showCreateModal && !showTemplatesModal && !selectedNotebook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Notebook</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose how you want to start</p>
            </div>
            <div className="p-6 space-y-3">
              <Button className="w-full" onClick={() => { setShowTemplatesModal(true) }}>
                Create from Template
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  const newNb = {
                    id: generateNotebookId(),
                    name: 'Untitled Notebook',
                    description: '',
                    cells: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    tags: [],
                    isPublic: false,
                    author: 'Current User',
                    theme: 'light',
                    settings: {
                      autoSave: true,
                      executionMode: 'sequential',
                      showLineNumbers: true,
                      fontSize: 14,
                      tabSize: 2,
                      wordWrap: true
                    }
                  }
                  setNotebooks(prev => [newNb, ...prev])
                  setSelectedNotebook(newNb)
                  setShowCreateModal(false)
                }}
              >
                Create from New
              </Button>
              <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTemplatesModal && showCreateModal && !selectedNotebook && (
        <NotebookTemplates 
          onSelectTemplate={(tpl) => {
            setNotebooks(prev => [tpl, ...prev])
            setSelectedNotebook(tpl)
            setShowTemplatesModal(false)
            setShowCreateModal(false)
          }} 
          onClose={() => setShowTemplatesModal(false)} 
        />
      )}
    </div>
  )
}
