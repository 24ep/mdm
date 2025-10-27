'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain,
  Target,
  TrendingUp,
  BarChart3,
  Play,
  Pause,
  Square,
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
  Clock,
  Zap,
  Layers,
  Activity,
  Settings,
  FileCode,
  Database,
  Calculator
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export type MLTaskType = 'classification' | 'regression' | 'clustering' | 'dimensionality_reduction'
export type MLAlgorithm = 'linear_regression' | 'logistic_regression' | 'random_forest' | 'svm' | 'kmeans' | 'pca' | 'neural_network'

interface MLModel {
  id: string
  name: string
  taskType: MLTaskType
  algorithm: MLAlgorithm
  status: 'idle' | 'training' | 'trained' | 'error'
  accuracy?: number
  loss?: number
  metrics?: { [key: string]: number }
  trainingTime?: number
  parameters: { [key: string]: any }
  createdAt: Date
}

interface TrainingData {
  features: string[]
  target?: string
  data: any[]
  trainSize: number
  testSize: number
}

interface MLPipelineProps {
  id: string
  data: any[]
  timestamp: Date
  isActive: boolean
  onDataChange: (data: any[]) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onFocus: () => void
}

export function MLPipeline({
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
}: MLPipelineProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('models')
  const [models, setModels] = useState<MLModel[]>([])
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [showPredictions, setShowPredictions] = useState(false)

  const columns = data.length > 0 ? Object.keys(data[0]) : []
  const numericColumns = columns.filter(col => 
    data.every(row => typeof row[col] === 'number' || !isNaN(Number(row[col])))
  )

  const taskTypes = [
    { value: 'classification', label: 'Classification', icon: <Target className="h-4 w-4" /> },
    { value: 'regression', label: 'Regression', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'clustering', label: 'Clustering', icon: <Layers className="h-4 w-4" /> },
    { value: 'dimensionality_reduction', label: 'Dimensionality Reduction', icon: <Activity className="h-4 w-4" /> }
  ]

  const algorithms = {
    classification: [
      { value: 'logistic_regression', label: 'Logistic Regression' },
      { value: 'random_forest', label: 'Random Forest' },
      { value: 'svm', label: 'Support Vector Machine' },
      { value: 'neural_network', label: 'Neural Network' }
    ],
    regression: [
      { value: 'linear_regression', label: 'Linear Regression' },
      { value: 'random_forest', label: 'Random Forest' },
      { value: 'neural_network', label: 'Neural Network' }
    ],
    clustering: [
      { value: 'kmeans', label: 'K-Means' }
    ],
    dimensionality_reduction: [
      { value: 'pca', label: 'Principal Component Analysis' }
    ]
  }

  const createModel = (taskType: MLTaskType, algorithm: MLAlgorithm) => {
    const newModel: MLModel = {
      id: `model-${Date.now()}`,
      name: `${algorithm.replace('_', ' ')} Model`,
      taskType,
      algorithm,
      status: 'idle',
      parameters: getDefaultParameters(algorithm),
      createdAt: new Date()
    }

    setModels(prev => [...prev, newModel])
    setSelectedModel(newModel)
    toast.success('Model created')
  }

  const getDefaultParameters = (algorithm: MLAlgorithm) => {
    switch (algorithm) {
      case 'linear_regression':
        return { learning_rate: 0.01, max_iterations: 1000 }
      case 'logistic_regression':
        return { learning_rate: 0.01, max_iterations: 1000, regularization: 'l2' }
      case 'random_forest':
        return { n_estimators: 100, max_depth: 10, min_samples_split: 2 }
      case 'svm':
        return { kernel: 'rbf', C: 1.0, gamma: 'scale' }
      case 'kmeans':
        return { n_clusters: 3, max_iterations: 300 }
      case 'pca':
        return { n_components: 2 }
      case 'neural_network':
        return { hidden_layers: [64, 32], learning_rate: 0.001, epochs: 100 }
      default:
        return {}
    }
  }

  const prepareTrainingData = (features: string[], target?: string) => {
    if (data.length === 0) return null

    const trainSize = Math.floor(data.length * 0.8)
    const testSize = data.length - trainSize

    return {
      features,
      target,
      data: data.map(row => ({
        features: features.map(f => Number(row[f]) || 0),
        target: target ? Number(row[target]) || 0 : undefined
      })),
      trainSize,
      testSize
    }
  }

  const trainModel = async (model: MLModel) => {
    if (!trainingData) {
      toast.error('Please prepare training data first')
      return
    }

    setIsTraining(true)
    setTrainingProgress(0)
    
    // Update model status
    setModels(prev => prev.map(m => 
      m.id === model.id ? { ...m, status: 'training' } : m
    ))

    try {
      // Simulate training process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setTrainingProgress(i)
      }

      // Mock training results
      const mockMetrics = {
        accuracy: Math.random() * 0.3 + 0.7, // 70-100%
        precision: Math.random() * 0.3 + 0.7,
        recall: Math.random() * 0.3 + 0.7,
        f1_score: Math.random() * 0.3 + 0.7,
        loss: Math.random() * 0.5 + 0.1 // 0.1-0.6
      }

      const trainingTime = Math.floor(Math.random() * 10000) + 1000 // 1-11 seconds

      // Update model with results
      setModels(prev => prev.map(m => 
        m.id === model.id ? {
          ...m,
          status: 'trained',
          accuracy: mockMetrics.accuracy,
          loss: mockMetrics.loss,
          metrics: mockMetrics,
          trainingTime
        } : m
      ))

      toast.success(`Model trained successfully! Accuracy: ${(mockMetrics.accuracy * 100).toFixed(1)}%`)
    } catch (error) {
      setModels(prev => prev.map(m => 
        m.id === model.id ? { ...m, status: 'error' } : m
      ))
      toast.error('Model training failed')
    } finally {
      setIsTraining(false)
      setTrainingProgress(0)
    }
  }

  const makePredictions = async (model: MLModel) => {
    if (!trainingData || model.status !== 'trained') {
      toast.error('Model must be trained first')
      return
    }

    try {
      // Mock predictions
      const mockPredictions = trainingData.data.map((item, index) => ({
        id: index,
        actual: item.target,
        predicted: item.target + (Math.random() - 0.5) * 2, // Add some noise
        confidence: Math.random() * 0.3 + 0.7 // 70-100%
      }))

      setPredictions(mockPredictions)
      setShowPredictions(true)
      toast.success('Predictions generated')
    } catch (error) {
      toast.error('Prediction failed')
    }
  }

  const deleteModel = (modelId: string) => {
    setModels(prev => prev.filter(m => m.id !== modelId))
    if (selectedModel?.id === modelId) {
      setSelectedModel(null)
    }
    toast.success('Model deleted')
  }

  const exportModel = (model: MLModel) => {
    const modelData = {
      ...model,
      trainingData,
      predictions: showPredictions ? predictions : undefined
    }
    
    const dataStr = JSON.stringify(modelData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${model.name.replace(/\s+/g, '_')}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('Model exported')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'trained': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'training': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Play className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trained': return 'text-green-600'
      case 'training': return 'text-blue-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      isActive ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">ML Pipeline</span>
            <Badge variant="outline" className="text-xs">
              {timestamp.toLocaleTimeString()}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {models.length} models
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
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            </TabsList>

            <TabsContent value="models" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Machine Learning Models</h3>
                <div className="flex items-center gap-2">
                  {taskTypes.map((task) => (
                    <Select key={task.value} onValueChange={(algorithm) => createModel(task.value as MLTaskType, algorithm as MLAlgorithm)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder={task.label} />
                      </SelectTrigger>
                      <SelectContent>
                        {algorithms[task.value as keyof typeof algorithms]?.map((algo) => (
                          <SelectItem key={algo.value} value={algo.value}>
                            {algo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {models.map((model) => (
                  <Card key={model.id} className={cn(
                    "transition-all duration-200",
                    selectedModel?.id === model.id ? "ring-2 ring-blue-500" : "hover:shadow-md"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(model.status)}
                          <div>
                            <h4 className="font-medium">{model.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="capitalize">{model.taskType}</span>
                              <span>•</span>
                              <span className="capitalize">{model.algorithm.replace('_', ' ')}</span>
                              {model.accuracy && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600">
                                    {(model.accuracy * 100).toFixed(1)}% accuracy
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {model.status === 'trained' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => makePredictions(model)}
                            >
                              <Target className="h-3 w-3 mr-1" />
                              Predict
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedModel(model)}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportModel(model)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteModel(model.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {models.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No models created yet. Select a task type to create your first model.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              <h3 className="text-lg font-semibold">Training Configuration</h3>
              
              {selectedModel && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <h4 className="font-medium">{selectedModel.name}</h4>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Features</Label>
                          <Select onValueChange={(value) => {
                            const features = value.split(',')
                            setTrainingData(prepareTrainingData(features))
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select features" />
                            </SelectTrigger>
                            <SelectContent>
                              {numericColumns.map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedModel.taskType !== 'clustering' && selectedModel.taskType !== 'dimensionality_reduction' && (
                          <div>
                            <Label>Target Variable</Label>
                            <Select onValueChange={(value) => {
                              if (trainingData) {
                                setTrainingData({ ...trainingData, target: value })
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target" />
                              </SelectTrigger>
                              <SelectContent>
                                {numericColumns.map(col => (
                                  <SelectItem key={col} value={col}>{col}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {isTraining && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Training Progress</span>
                            <span className="text-sm text-gray-600">{trainingProgress}%</span>
                          </div>
                          <Progress value={trainingProgress} className="w-full" />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => trainModel(selectedModel)}
                          disabled={isTraining || !trainingData}
                        >
                          {isTraining ? (
                            <>
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                              Training...
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Train Model
                            </>
                          )}
                        </Button>
                        
                        {selectedModel.status === 'trained' && (
                          <Button
                            variant="outline"
                            onClick={() => makePredictions(selectedModel)}
                          >
                            <Target className="h-3 w-3 mr-1" />
                            Make Predictions
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Model Predictions</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPredictions(!showPredictions)}
                >
                  {showPredictions ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showPredictions ? 'Hide' : 'Show'} Predictions
                </Button>
              </div>

              {showPredictions && predictions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Predicted</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {predictions.slice(0, 20).map((prediction) => (
                        <tr key={prediction.id}>
                          <td className="px-3 py-2 text-sm text-gray-900">{prediction.id}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{prediction.actual?.toFixed(2)}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{prediction.predicted?.toFixed(2)}</td>
                          <td className="px-3 py-2 text-sm">
                            <span className={cn(
                              "font-medium",
                              prediction.confidence > 0.8 ? "text-green-600" :
                              prediction.confidence > 0.6 ? "text-yellow-600" : "text-red-600"
                            )}>
                              {(prediction.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {Math.abs(prediction.actual - prediction.predicted).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {predictions.length > 20 && (
                    <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                      Showing 20 of {predictions.length} predictions
                    </div>
                  )}
                </div>
              )}

              {(!showPredictions || predictions.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No predictions available. Train a model and make predictions first.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="evaluation" className="space-y-4">
              <h3 className="text-lg font-semibold">Model Evaluation</h3>
              
              {selectedModel?.metrics && (
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <h4 className="font-medium">Performance Metrics</h4>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(selectedModel.metrics).map(([metric, value]) => (
                        <div key={metric} className="flex justify-between">
                          <span className="text-sm text-gray-600 capitalize">
                            {metric.replace('_', ' ')}:
                          </span>
                          <span className="text-sm font-medium">
                            {typeof value === 'number' ? value.toFixed(4) : value}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h4 className="font-medium">Training Info</h4>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Training Time:</span>
                        <span className="text-sm font-medium">
                          {selectedModel.trainingTime ? `${selectedModel.trainingTime}ms` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Algorithm:</span>
                        <span className="text-sm font-medium capitalize">
                          {selectedModel.algorithm.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Task Type:</span>
                        <span className="text-sm font-medium capitalize">
                          {selectedModel.taskType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={cn("text-sm font-medium", getStatusColor(selectedModel.status))}>
                          {selectedModel.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!selectedModel?.metrics && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No evaluation metrics available. Train a model first.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  )
}
