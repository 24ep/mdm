'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3,
  Brain,
  Database,
  FileText,
  Code,
  Calculator,
  TrendingUp,
  PieChart,
  Scatter,
  LineChart,
  Activity,
  Layers,
  Target,
  Zap,
  Sparkles,
  NotebookPen,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Send,
  Smile,
  Paperclip,
  UserPlus,
  UserCheck,
  UserX,
  SortAsc,
  SortDesc,
  Maximize2,
  Minimize2,
  SplitSquareHorizontal,
  SplitSquareVertical,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Menu,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Grid,
  List,
  Layout,
  Palette,
  Sun,
  Moon,
  Monitor,
  Globe,
  Lock,
  Unlock,
  Star,
  StarOff,
  Bookmark,
  History,
  Share,
  Edit,
  Terminal,
  Users,
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Notebook, NotebookCell } from './DeepNoteLayout'

interface NotebookTemplatesProps {
  onSelectTemplate: (template: Notebook) => void
  onClose: () => void
}

export function NotebookTemplates({ onSelectTemplate, onClose }: NotebookTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const templates = {
    'data-analysis': [
      {
        id: 'eda-template',
        name: 'Exploratory Data Analysis',
        description: 'Complete EDA workflow with data loading, cleaning, and visualization',
        icon: BarChart3,
        color: 'blue',
        cells: [
          {
            id: 'cell-1',
            type: 'markdown',
            content: '# Exploratory Data Analysis\n\nThis notebook demonstrates a comprehensive EDA workflow.\n\n## Steps:\n1. Data Loading\n2. Data Overview\n3. Data Cleaning\n4. Statistical Analysis\n5. Visualization\n6. Insights & Conclusions',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          },
          {
            id: 'cell-2',
            type: 'code',
            content: '# Data Loading\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nfrom scipy import stats\n\n# Load your dataset\n# df = pd.read_csv(\'your_data.csv\')\n\n# For demo purposes, create sample data\nnp.random.seed(42)\ndf = pd.DataFrame({\n    \'age\': np.random.normal(35, 10, 1000),\n    \'income\': np.random.normal(50000, 15000, 1000),\n    \'education\': np.random.choice([\'High School\', \'Bachelor\', \'Master\', \'PhD\'], 1000),\n    \'experience\': np.random.normal(10, 5, 1000)\n})\n\nprint("Dataset loaded successfully!")\nprint(f"Shape: {df.shape}")\nprint(f"Columns: {list(df.columns)}")',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          },
          {
            id: 'cell-3',
            type: 'code',
            content: '# Data Overview\ndf.head()\ndf.info()\ndf.describe()\n\n# Check for missing values\nprint("Missing values:")\nprint(df.isnull().sum())\n\n# Check data types\nprint("\\nData types:")\nprint(df.dtypes)',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          },
          {
            id: 'cell-4',
            type: 'code',
            content: '# Data Visualization\nplt.figure(figsize=(15, 10))\n\n# Age distribution\nplt.subplot(2, 3, 1)\nplt.hist(df[\'age\'], bins=30, alpha=0.7, color=\'skyblue\')\nplt.title(\'Age Distribution\')\nplt.xlabel(\'Age\')\nplt.ylabel(\'Frequency\')\n\n# Income distribution\nplt.subplot(2, 3, 2)\nplt.hist(df[\'income\'], bins=30, alpha=0.7, color=\'lightgreen\')\nplt.title(\'Income Distribution\')\nplt.xlabel(\'Income\')\nplt.ylabel(\'Frequency\')\n\n# Education distribution\nplt.subplot(2, 3, 3)\ndf[\'education\'].value_counts().plot(kind=\'bar\', color=\'coral\')\nplt.title(\'Education Distribution\')\nplt.xlabel(\'Education\')\nplt.ylabel(\'Count\')\nplt.xticks(rotation=45)\n\n# Age vs Income scatter\nplt.subplot(2, 3, 4)\nplt.scatter(df[\'age\'], df[\'income\'], alpha=0.6, color=\'purple\')\nplt.title(\'Age vs Income\')\nplt.xlabel(\'Age\')\nplt.ylabel(\'Income\')\n\n# Experience vs Income\nplt.subplot(2, 3, 5)\nplt.scatter(df[\'experience\'], df[\'income\'], alpha=0.6, color=\'orange\')\nplt.title(\'Experience vs Income\')\nplt.xlabel(\'Experience\')\nplt.ylabel(\'Income\')\n\n# Correlation heatmap\nplt.subplot(2, 3, 6)\nnumeric_cols = df.select_dtypes(include=[np.number]).columns\ncorrelation_matrix = df[numeric_cols].corr()\nsns.heatmap(correlation_matrix, annot=True, cmap=\'coolwarm\', center=0)\nplt.title(\'Correlation Matrix\')\n\nplt.tight_layout()\nplt.show()',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          },
          {
            id: 'cell-5',
            type: 'markdown',
            content: '## Key Insights\n\n- **Data Quality**: Check for missing values and outliers\n- **Distributions**: Understand the shape of your data\n- **Relationships**: Look for correlations between variables\n- **Patterns**: Identify trends and anomalies\n\n### Next Steps:\n1. Handle missing values if any\n2. Remove or transform outliers\n3. Feature engineering\n4. Statistical tests\n5. Advanced visualizations',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          }
        ]
      },
      {
        id: 'time-series-template',
        name: 'Time Series Analysis',
        description: 'Analyze temporal data with forecasting and trend analysis',
        icon: TrendingUp,
        color: 'green',
        cells: [
          {
            id: 'cell-1',
            type: 'markdown',
            content: '# Time Series Analysis\n\nThis notebook covers comprehensive time series analysis techniques.\n\n## Topics:\n- Data preparation\n- Trend analysis\n- Seasonality detection\n- Forecasting\n- Model evaluation',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          },
          {
            id: 'cell-2',
            type: 'code',
            content: '# Time Series Libraries\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nfrom statsmodels.tsa.seasonal import seasonal_decompose\nfrom statsmodels.tsa.stattools import adfuller\nfrom statsmodels.tsa.arima.model import ARIMA\nfrom sklearn.metrics import mean_squared_error, mean_absolute_error\n\n# Load time series data\n# df = pd.read_csv(\'time_series_data.csv\', parse_dates=[\'date\'], index_col=\'date\')\n\n# Create sample time series data\nnp.random.seed(42)\ndates = pd.date_range(start=\'2020-01-01\', end=\'2023-12-31\', freq=\'D\')\ntrend = np.linspace(100, 200, len(dates))\nseasonal = 10 * np.sin(2 * np.pi * np.arange(len(dates)) / 365.25)\nnoise = np.random.normal(0, 5, len(dates))\nvalues = trend + seasonal + noise\n\ndf = pd.DataFrame({\n    \'date\': dates,\n    \'value\': values\n}).set_index(\'date\')\n\nprint("Time series data created!")\nprint(f"Shape: {df.shape}")\nprint(f"Date range: {df.index.min()} to {df.index.max()}")',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          }
        ]
      }
    ],
    'machine-learning': [
      {
        id: 'ml-pipeline-template',
        name: 'Machine Learning Pipeline',
        description: 'Complete ML workflow from data preprocessing to model deployment',
        icon: Brain,
        color: 'purple',
        cells: [
          {
            id: 'cell-1',
            type: 'markdown',
            content: '# Machine Learning Pipeline\n\nThis notebook demonstrates a complete ML workflow.\n\n## Pipeline Steps:\n1. Data Collection & Exploration\n2. Data Preprocessing\n3. Feature Engineering\n4. Model Selection\n5. Model Training\n6. Model Evaluation\n7. Hyperparameter Tuning\n8. Model Deployment',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          },
          {
            id: 'cell-2',
            type: 'code',
            content: '# ML Libraries\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nfrom sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV\nfrom sklearn.preprocessing import StandardScaler, LabelEncoder\nfrom sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.svm import SVC\nfrom sklearn.metrics import classification_report, confusion_matrix, roc_auc_score\nfrom sklearn.pipeline import Pipeline\nimport joblib\n\nprint("ML libraries imported successfully!")',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          }
        ]
      }
    ],
    'visualization': [
      {
        id: 'dashboard-template',
        name: 'Interactive Dashboard',
        description: 'Create interactive visualizations and dashboards',
        icon: PieChart,
        color: 'orange',
        cells: [
          {
            id: 'cell-1',
            type: 'markdown',
            content: '# Interactive Dashboard\n\nCreate beautiful and interactive visualizations.\n\n## Features:\n- Multiple chart types\n- Interactive elements\n- Responsive design\n- Export capabilities',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          }
        ]
      }
    ],
    'data-science': [
      {
        id: 'complete-ds-template',
        name: 'Complete Data Science Project',
        description: 'End-to-end data science project template',
        icon: Target,
        color: 'red',
        cells: [
          {
            id: 'cell-1',
            type: 'markdown',
            content: '# Complete Data Science Project\n\nThis is a comprehensive template for data science projects.\n\n## Project Structure:\n1. Problem Definition\n2. Data Collection\n3. Data Exploration\n4. Data Preprocessing\n5. Feature Engineering\n6. Model Development\n7. Model Evaluation\n8. Results & Insights\n9. Deployment\n10. Monitoring',
            status: 'idle',
            timestamp: new Date(),
            metadata: {}
          }
        ]
      }
    ]
  }

  const categories = [
    { id: 'all', name: 'All Templates', icon: Grid },
    { id: 'data-analysis', name: 'Data Analysis', icon: BarChart3 },
    { id: 'machine-learning', name: 'Machine Learning', icon: Brain },
    { id: 'visualization', name: 'Visualization', icon: PieChart },
    { id: 'data-science', name: 'Data Science', icon: Target }
  ]

  const getTemplatesForCategory = () => {
    if (selectedCategory === 'all') {
      return Object.values(templates).flat()
    }
    return templates[selectedCategory as keyof typeof templates] || []
  }

  const createNotebookFromTemplate = (template: any) => {
    const notebook: Notebook = {
      id: `notebook-${Date.now()}`,
      name: template.name,
      description: template.description,
      cells: template.cells,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [selectedCategory],
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
    onSelectTemplate(notebook)
  }

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      red: 'bg-red-50 border-red-200 text-red-800'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notebook Templates</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Choose a template to get started quickly</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="flex h-[60vh]">
          {/* Categories Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    selectedCategory === category.id
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getTemplatesForCategory().map((template) => (
                <Card 
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => createNotebookFromTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        getColorClasses(template.color)
                      )}>
                        <template.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {template.cells.length} cells
                      </Badge>
                      <Button size="sm" variant="outline">
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {getTemplatesForCategory().length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No templates available for the selected category.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
