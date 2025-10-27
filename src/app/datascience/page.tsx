'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  FileCode,
  Database,
  BarChart3,
  Calculator,
  Brain,
  Play,
  Save,
  Download,
  Upload,
  Plus,
  Settings,
  History,
  Bookmark,
  Share,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Zap,
  Target,
  TrendingUp,
  PieChart,
  Scatter,
  Activity,
  Layers,
  Users,
  File,
  Folder,
  Star,
  Globe,
  Lock,
  Unlock,
  Crown,
  Edit,
  Eye as EyeIcon,
  MessageCircle,
  Video,
  Mic,
  Phone,
  MoreHorizontal,
  Send,
  Smile,
  Paperclip,
  Archive,
  StarOff,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Layout,
  Palette,
  Sun,
  Moon,
  Monitor,
  Maximize,
  Minimize,
  Split,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  Square,
  RotateCcw,
  Copy,
  Trash2,
  Edit as EditIcon,
  Code,
  FileText,
  Terminal,
  FileImage,
  FileSpreadsheet,
  FolderOpen,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  RefreshCw as RefreshCwIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Clock as ClockIcon,
  AlertCircle as AlertCircleIcon,
  Info,
  Menu,
  MoreHorizontal as MoreHorizontalIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Import our enhanced components
import { 
  DataScienceNotebook, 
  Notebook, 
  NotebookCell, 
  CellType,
  notebookEngine,
  createNotebookId,
  createCellId,
  formatExecutionTime
} from '@/components/datascience'

export default function EnhancedDataScienceNotebookPage() {
  const [notebook, setNotebook] = useState<Notebook>({
    id: createNotebookId(),
    name: 'Advanced Data Science Analysis',
    description: 'Comprehensive data analysis with machine learning and visualization',
    cells: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['data-science', 'machine-learning', 'visualization'],
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
  })
  
  const [activeTab, setActiveTab] = useState('notebook')
  const [showDataSource, setShowDataSource] = useState(true)
  const [currentData, setCurrentData] = useState<any[]>([])
  const [dataMetadata, setDataMetadata] = useState<any>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [notebookHistory, setNotebookHistory] = useState<Notebook[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && notebook.cells.length > 0) {
      const timer = setTimeout(() => {
        handleSaveNotebook()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notebook, autoSave])

  // Load notebook from localStorage on mount
  useEffect(() => {
    const savedNotebooks = localStorage.getItem('enhanced-datascience-notebooks')
    if (savedNotebooks) {
      try {
        const notebooks = JSON.parse(savedNotebooks)
        if (notebooks.length > 0) {
          setNotebookHistory(notebooks)
          // Load the most recent notebook
          const latestNotebook = notebooks[0]
          setNotebook(latestNotebook)
          setShowWelcome(false)
        }
      } catch (error) {
        console.error('Failed to load saved notebooks:', error)
      }
    }
  }, [])

  const handleDataLoad = (data: any[], metadata: any) => {
    setCurrentData(data)
    setDataMetadata(metadata)
    
    // Create a new data exploration cell with the loaded data
    const newCell: NotebookCell = {
      id: createCellId(),
      type: 'python',
      content: `# Data loaded from ${metadata.source}
# Dataset: ${metadata.query}
# Rows: ${data.length}
# Columns: ${metadata.columns?.length || 0}

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Load the data
df = pd.DataFrame(${JSON.stringify(data.slice(0, 10))})  # First 10 rows for demo
print(f"Dataset shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print("\\nFirst few rows:")
print(df.head())

# Basic statistics
print("\\nBasic Statistics:")
print(df.describe())

# Check for missing values
print("\\nMissing Values:")
print(df.isnull().sum())`,
      status: 'idle',
      timestamp: new Date(),
      metadata: { dataSource: metadata }
    }

    setNotebook(prev => ({
      ...prev,
      cells: [...prev.cells, newCell],
      updatedAt: new Date()
    }))

    toast.success(`Data loaded: ${data.length} rows, ${metadata.columns?.length || 0} columns`)
  }

  const handleQueryExecute = async (query: string): Promise<any> => {
    setIsExecuting(true)
    try {
      // Mock query execution - replace with actual BigQuery API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data based on query
      let mockData: any[] = []
      let columns: string[] = []
      
      if (query.toLowerCase().includes('count')) {
        mockData = [{ total_rows: Math.floor(Math.random() * 10000) + 1000 }]
        columns = ['total_rows']
      } else if (query.toLowerCase().includes('select')) {
        // Generate mock data based on common patterns
        const rowCount = Math.min(100, Math.floor(Math.random() * 50) + 10)
        columns = ['id', 'name', 'value', 'category', 'date']
        mockData = Array.from({ length: rowCount }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          value: Math.floor(Math.random() * 1000),
          category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }))
      } else {
        mockData = []
        columns = []
      }

      return {
        data: mockData,
        columns,
        executionTime: Math.floor(Math.random() * 2000) + 500,
        status: 'success'
      }
    } catch (error) {
      throw new Error('Query execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleSaveNotebook = async () => {
    try {
      const updatedNotebook = { ...notebook, updatedAt: new Date() }
      setNotebook(updatedNotebook)
      
      // Save to localStorage
      const savedNotebooks = JSON.parse(localStorage.getItem('enhanced-datascience-notebooks') || '[]')
      const existingIndex = savedNotebooks.findIndex((n: Notebook) => n.id === updatedNotebook.id)
      
      if (existingIndex >= 0) {
        savedNotebooks[existingIndex] = updatedNotebook
      } else {
        savedNotebooks.unshift(updatedNotebook)
      }
      
      localStorage.setItem('enhanced-datascience-notebooks', JSON.stringify(savedNotebooks.slice(0, 10))) // Keep last 10
      setNotebookHistory(savedNotebooks.slice(0, 10))
      
      toast.success('Notebook saved')
    } catch (error) {
      toast.error('Failed to save notebook')
    }
  }

  const handleLoadNotebook = async (notebookId: string) => {
    try {
      const savedNotebooks = JSON.parse(localStorage.getItem('enhanced-datascience-notebooks') || '[]')
      const notebookToLoad = savedNotebooks.find((n: Notebook) => n.id === notebookId)
      
      if (notebookToLoad) {
        setNotebook(notebookToLoad)
        toast.success('Notebook loaded')
      } else {
        toast.error('Notebook not found')
      }
    } catch (error) {
      toast.error('Failed to load notebook')
    }
  }

  const exportNotebook = (format: 'json' | 'html' | 'pdf') => {
    const dataStr = JSON.stringify(notebook, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${notebook.name.replace(/\s+/g, '_')}.${format}`
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success(`Notebook exported as ${format}`)
  }

  const createNewNotebook = () => {
    const newNotebook: Notebook = {
      id: createNotebookId(),
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
    
    setNotebook(newNotebook)
    setShowWelcome(false)
    toast.success('New notebook created')
  }

  const createNotebookFromTemplate = (template: string) => {
    let cells: NotebookCell[] = []
    
    switch (template) {
      case 'data-analysis':
        cells = [
          {
            id: createCellId(),
            type: 'markdown',
            content: '# Data Analysis Project\n\nThis notebook demonstrates a complete data analysis workflow.\n\n## Steps:\n1. Data Loading\n2. Exploratory Data Analysis\n3. Data Cleaning\n4. Visualization\n5. Statistical Analysis',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          },
          {
            id: createCellId(),
            type: 'python',
            content: '# Data Loading\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\n# Load your dataset\n# df = pd.read_csv(\'your_data.csv\')\n\nprint("Data loaded successfully!")',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          },
          {
            id: createCellId(),
            type: 'python',
            content: '# Exploratory Data Analysis\n# Check data shape and basic info\nprint(f"Dataset shape: {df.shape}")\nprint(f"Columns: {list(df.columns)}")\nprint("\\nFirst few rows:")\nprint(df.head())\n\n# Check for missing values\nprint("\\nMissing values:")\nprint(df.isnull().sum())',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          }
        ]
        break
      case 'machine-learning':
        cells = [
          {
            id: createCellId(),
            type: 'markdown',
            content: '# Machine Learning Pipeline\n\nThis notebook demonstrates a complete ML workflow.\n\n## Steps:\n1. Data Preprocessing\n2. Feature Engineering\n3. Model Training\n4. Model Evaluation\n5. Prediction',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          },
          {
            id: createCellId(),
            type: 'python',
            content: '# Import ML libraries\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import accuracy_score, classification_report\nimport pandas as pd\nimport numpy as np\n\nprint("ML libraries imported successfully!")',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          }
        ]
        break
      case 'visualization':
        cells = [
          {
            id: createCellId(),
            type: 'markdown',
            content: '# Data Visualization Project\n\nCreate beautiful and informative visualizations.\n\n## Chart Types:\n- Line Charts\n- Bar Charts\n- Scatter Plots\n- Heatmaps\n- Box Plots',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          },
          {
            id: createCellId(),
            type: 'python',
            content: '# Visualization Setup\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nimport plotly.express as px\nimport plotly.graph_objects as go\n\n# Set style\nplt.style.use(\'seaborn-v0_8\')\nsns.set_palette("husl")\n\nprint("Visualization libraries ready!")',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          }
        ]
        break
    }
    
    const newNotebook: Notebook = {
      id: createNotebookId(),
      name: `${template.charAt(0).toUpperCase() + template.slice(1)} Template`,
      description: `Notebook created from ${template} template`,
      cells,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [template],
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
    
    setNotebook(newNotebook)
    setShowTemplates(false)
    setShowWelcome(false)
    toast.success(`Notebook created from ${template} template`)
  }

  const getTemplateIcon = (template: string) => {
    switch (template) {
      case 'data-analysis': return <BarChart3 className="h-6 w-6 text-blue-500" />
      case 'machine-learning': return <Brain className="h-6 w-6 text-purple-500" />
      case 'visualization': return <PieChart className="h-6 w-6 text-green-500" />
      default: return <FileCode className="h-6 w-6 text-gray-500" />
    }
  }

  const getTemplateDescription = (template: string) => {
    switch (template) {
      case 'data-analysis': return 'Complete data analysis workflow with EDA, cleaning, and statistical analysis'
      case 'machine-learning': return 'End-to-end ML pipeline with preprocessing, training, and evaluation'
      case 'visualization': return 'Beautiful charts and interactive visualizations for data storytelling'
      default: return 'Basic notebook template'
    }
  }

  if (showWelcome) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileCode className="h-12 w-12 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">Enhanced Data Science Notebook</h1>
            </div>
            <p className="text-xl text-gray-600 mb-6">
              A comprehensive DeepNote-style notebook with advanced features for data science and machine learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <Brain className="h-6 w-6 text-purple-500" />
                  Advanced Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Real-time collaboration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Multiple language support (Python, R, SQL, JS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Interactive visualizations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>File management system</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Export to multiple formats</span>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-yellow-500" />
                  Quick Start
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Pre-built templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Auto-save functionality</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Keyboard shortcuts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Version control</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Dark/light themes</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => setShowTemplates(true)} className="px-8">
                <Plus className="h-5 w-5 mr-2" />
                Choose Template
              </Button>
              <Button size="lg" variant="outline" onClick={createNewNotebook} className="px-8">
                <FileCode className="h-5 w-5 mr-2" />
                Start Blank
              </Button>
            </div>
            
            {notebookHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Notebooks</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {notebookHistory.slice(0, 3).map((notebook) => (
                    <Button
                      key={notebook.id}
                      variant="outline"
                      onClick={() => handleLoadNotebook(notebook.id)}
                      className="text-sm"
                    >
                      <FileCode className="h-4 w-4 mr-2" />
                      {notebook.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (showTemplates) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose a Template</h1>
            <p className="text-gray-600">Select a pre-built template to get started quickly</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['data-analysis', 'machine-learning', 'visualization'].map((template) => (
              <Card key={template} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {getTemplateIcon(template)}
                  </div>
                  <CardTitle className="capitalize">{template.replace('-', ' ')}</CardTitle>
                  <CardDescription>{getTemplateDescription(template)}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={() => createNotebookFromTemplate(template)}
                    className="w-full"
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => setShowTemplates(false)}>
              Back to Welcome
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <FileCode className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Enhanced Data Science Notebook</h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs px-3 py-1">
                {notebook.cells.length} cells
              </Badge>
              <Badge variant="secondary" className="text-xs px-3 py-1">
                {currentData.length} rows loaded
              </Badge>
              <Badge variant="outline" className="text-xs px-3 py-1">
                {notebook.tags.join(', ')}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setShowHistory(true)} className="px-4">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button size="sm" variant="outline" onClick={createNewNotebook} className="px-4">
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
            <Button size="sm" variant="outline" onClick={handleSaveNotebook} className="px-4">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportNotebook('json')} className="px-4">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowDataSource(!showDataSource)} className="px-4">
              {showDataSource ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Data Source
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Data Source Sidebar */}
        {showDataSource && (
          <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    BigQuery Connection
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV File
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <File className="h-4 w-4 mr-2" />
                    Load from Files
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Create Visualization
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="h-4 w-4 mr-2" />
                    ML Pipeline
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calculator className="h-4 w-4 mr-2" />
                    Statistical Analysis
                  </Button>
                </div>
              </div>

              {currentData.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Dataset</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{currentData.length}</div>
                        <div className="text-sm text-gray-600">Rows</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {dataMetadata?.columns?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Columns</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Last updated: {dataMetadata?.timestamp?.toLocaleString() || 'Unknown'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notebook Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 py-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="notebook">Notebook</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="visualization">Visualization</TabsTrigger>
                <TabsTrigger value="ml">ML Pipeline</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="notebook" className="flex-1 overflow-y-auto p-6">
              <DataScienceNotebook
                initialNotebook={notebook}
                onSave={handleSaveNotebook}
                onLoad={handleLoadNotebook}
                dataSource={{ data: currentData, metadata: dataMetadata }}
                enableCollaboration={true}
                enableFileManager={true}
                enableExport={true}
                enableVersionControl={true}
              />
            </TabsContent>

            <TabsContent value="data" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <Database className="h-5 w-5" />
                      Current Dataset
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {currentData.length > 0 ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{currentData.length}</div>
                            <div className="text-sm text-gray-600">Total Rows</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {dataMetadata?.columns?.length || 0}
                            </div>
                            <div className="text-sm text-gray-600">Columns</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {dataMetadata?.executionTime || 0}ms
                            </div>
                            <div className="text-sm text-gray-600">Query Time</div>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b">
                            <h4 className="font-medium">Data Preview</h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  {dataMetadata?.columns?.slice(0, 5).map((col: string, index: number) => (
                                    <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {currentData.slice(0, 10).map((row: any, rowIndex: number) => (
                                  <tr key={rowIndex}>
                                    {dataMetadata?.columns?.slice(0, 5).map((col: string, colIndex: number) => (
                                      <td key={colIndex} className="px-4 py-2 text-sm text-gray-900">
                                        {row[col]?.toString() || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No Data Loaded</h3>
                        <p>Use the data source panel to load data from BigQuery or upload files</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="visualization" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {currentData.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5" />
                        Data Visualization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Create Visualizations</h3>
                        <p>Use the notebook cells to create interactive charts and plots</p>
                        <Button className="mt-4" onClick={() => setActiveTab('notebook')}>
                          Go to Notebook
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Data to Visualize</h3>
                    <p>Load data first to create visualizations</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ml" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {currentData.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Brain className="h-5 w-5" />
                        Machine Learning Pipeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-gray-500">
                        <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">ML Pipeline Ready</h3>
                        <p>Use the notebook cells to build machine learning models</p>
                        <Button className="mt-4" onClick={() => setActiveTab('notebook')}>
                          Go to Notebook
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Data for ML</h3>
                    <p>Load data first to start machine learning workflows</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-6">
            <span className="font-medium">Notebook: {notebook.name}</span>
            <span>Cells: {notebook.cells.length}</span>
            <span>Data: {currentData.length} rows</span>
            <span className="flex items-center gap-2">
              <span>Auto-save:</span>
              <span className={`px-2 py-1 rounded text-xs ${autoSave ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {autoSave ? 'On' : 'Off'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Last saved: {notebook.updatedAt.toLocaleTimeString()}</span>
            {isExecuting && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span className="font-medium">Executing...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}