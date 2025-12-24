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
  Brain, 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  Upload, 
  BarChart3, 
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Target,
  TrendingUp,
  Zap,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface MLPipelineProps {
  data?: any[]
  onTrainModel?: (config: ModelConfig) => Promise<ModelResult>
  onPredict?: (modelId: string, data: any[]) => Promise<any[]>
  onSaveModel?: (model: TrainedModel) => void
  onLoadModel?: (modelId: string) => TrainedModel
}

interface ModelConfig {
  algorithm: string
  targetColumn: string
  featureColumns: string[]
  testSize: number
  randomState: number
  hyperparameters: Record<string, any>
}

interface ModelResult {
  modelId: string
  algorithm: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  confusionMatrix: number[][]
  featureImportance: Record<string, number>
  trainingTime: number
  model: any
}

interface TrainedModel {
  id: string
  name: string
  algorithm: string
  accuracy: number
  createdAt: Date
  status: 'trained' | 'training' | 'error'
  config: ModelConfig
  result?: ModelResult
}

interface PipelineStep {
  id: string
  name: string
  type: 'data_preprocessing' | 'feature_engineering' | 'model_training' | 'evaluation' | 'prediction'
  status: 'pending' | 'running' | 'completed' | 'error'
  duration?: number
  output?: any
}

export function MLPipeline({ 
  data = [], 
  onTrainModel, 
  onPredict, 
  onSaveModel, 
  onLoadModel 
}: MLPipelineProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('random_forest')
  const [targetColumn, setTargetColumn] = useState<string>('')
  const [featureColumns, setFeatureColumns] = useState<string[]>([])
  const [testSize, setTestSize] = useState<number>(0.2)
  const [randomState, setRandomState] = useState<number>(42)
  const [hyperparameters, setHyperparameters] = useState<Record<string, any>>({})
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([])
  const [trainedModels, setTrainedModels] = useState<TrainedModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [predictionData, setPredictionData] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [isPredicting, setIsPredicting] = useState(false)

  const algorithms = [
    { value: 'random_forest', label: 'Random Forest', description: 'Ensemble method, good for most problems' },
    { value: 'linear_regression', label: 'Linear Regression', description: 'Simple linear model for regression' },
    { value: 'logistic_regression', label: 'Logistic Regression', description: 'Linear model for classification' },
    { value: 'svm', label: 'Support Vector Machine', description: 'Powerful for high-dimensional data' },
    { value: 'neural_network', label: 'Neural Network', description: 'Deep learning approach' },
    { value: 'gradient_boosting', label: 'Gradient Boosting', description: 'Sequential ensemble method' },
    { value: 'knn', label: 'K-Nearest Neighbors', description: 'Instance-based learning' }
  ]

  const columns = data.length > 0 ? Object.keys(data[0]) : []

  useEffect(() => {
    if (columns.length > 0) {
      setTargetColumn(columns[columns.length - 1]) // Assume last column is target
      setFeatureColumns(columns.slice(0, -1)) // All except last column
    }
  }, [data, columns])

  useEffect(() => {
    // Set default hyperparameters based on algorithm
    const defaultParams: Record<string, Record<string, any>> = {
      random_forest: { n_estimators: 100, max_depth: 10, random_state: 42 },
      linear_regression: { fit_intercept: true, normalize: false },
      logistic_regression: { C: 1.0, random_state: 42, max_iter: 1000 },
      svm: { C: 1.0, kernel: 'rbf', random_state: 42 },
      neural_network: { hidden_layer_sizes: [100, 50], max_iter: 1000, random_state: 42 },
      gradient_boosting: { n_estimators: 100, learning_rate: 0.1, max_depth: 3 },
      knn: { n_neighbors: 5, weights: 'uniform' }
    }
    setHyperparameters(defaultParams[selectedAlgorithm] || {})
  }, [selectedAlgorithm])

  const initializePipelineSteps = (): PipelineStep[] => [
    {
      id: 'step-1',
      name: 'Data Preprocessing',
      type: 'data_preprocessing',
      status: 'pending'
    },
    {
      id: 'step-2',
      name: 'Feature Engineering',
      type: 'feature_engineering',
      status: 'pending'
    },
    {
      id: 'step-3',
      name: 'Model Training',
      type: 'model_training',
      status: 'pending'
    },
    {
      id: 'step-4',
      name: 'Model Evaluation',
      type: 'evaluation',
      status: 'pending'
    }
  ]

  const trainModel = async () => {
    if (!data || data.length === 0) {
      toast.error('No data available for training')
      return
    }

    if (!targetColumn) {
      toast.error('Please select a target column')
      return
    }

    if (featureColumns.length === 0) {
      toast.error('Please select at least one feature column')
      return
    }

    setIsTraining(true)
    setTrainingProgress(0)
    setPipelineSteps(initializePipelineSteps())

    const config: ModelConfig = {
      algorithm: selectedAlgorithm,
      targetColumn,
      featureColumns,
      testSize,
      randomState,
      hyperparameters
    }

    try {
      // Simulate pipeline execution
      const steps = initializePipelineSteps()
      
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i].name)
        setPipelineSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'running' } : step
        ))
        
        // Simulate step execution time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
        
        setPipelineSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'completed', duration: 1000 + Math.random() * 2000 } : step
        ))
        
        setTrainingProgress(((i + 1) / steps.length) * 100)
      }

      // Simulate model training result
      const result: ModelResult = {
        modelId: `model-${Date.now()}`,
        algorithm: selectedAlgorithm,
        accuracy: 0.85 + Math.random() * 0.1,
        precision: 0.82 + Math.random() * 0.1,
        recall: 0.80 + Math.random() * 0.1,
        f1Score: 0.81 + Math.random() * 0.1,
        confusionMatrix: [
          [45, 5],
          [8, 42]
        ],
        featureImportance: featureColumns.reduce((acc, col) => {
          acc[col] = Math.random()
          return acc
        }, {} as Record<string, number>),
        trainingTime: 5000 + Math.random() * 3000,
        model: {}
      }

      const trainedModel: TrainedModel = {
        id: result.modelId,
        name: `${selectedAlgorithm}_${new Date().toISOString().split('T')[0]}`,
        algorithm: selectedAlgorithm,
        accuracy: result.accuracy,
        createdAt: new Date(),
        status: 'trained',
        config,
        result
      }

      setTrainedModels(prev => [trainedModel, ...prev])
      onSaveModel?.(trainedModel)
      
      toast.success(`Model trained successfully! Accuracy: ${(result.accuracy * 100).toFixed(2)}%`)
    } catch (error) {
      setPipelineSteps(prev => prev.map(step => 
        step.status === 'running' ? { ...step, status: 'error' } : step
      ))
      toast.error('Model training failed')
    } finally {
      setIsTraining(false)
      setCurrentStep('')
      setTrainingProgress(0)
    }
  }

  const makePredictions = async () => {
    if (!selectedModel) {
      toast.error('Please select a trained model')
      return
    }

    if (predictionData.length === 0) {
      toast.error('Please provide data for prediction')
      return
    }

    setIsPredicting(true)
    try {
      // Simulate prediction
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const mockPredictions = predictionData.map((_, index) => ({
        id: index,
        prediction: Math.random() > 0.5 ? 'Class A' : 'Class B',
        confidence: 0.7 + Math.random() * 0.3,
        probabilities: {
          'Class A': 0.3 + Math.random() * 0.4,
          'Class B': 0.3 + Math.random() * 0.4
        }
      }))
      
      setPredictions(mockPredictions)
      toast.success('Predictions generated successfully')
    } catch (error) {
      toast.error('Prediction failed')
    } finally {
      setIsPredicting(false)
    }
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'data_preprocessing': return <RefreshCw className="h-4 w-4" />
      case 'feature_engineering': return <Settings className="h-4 w-4" />
      case 'model_training': return <Brain className="h-4 w-4" />
      case 'evaluation': return <BarChart3 className="h-4 w-4" />
      case 'prediction': return <Target className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex-1">
      <Tabs defaultValue="training">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="training">Model Training</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          <TabsTrigger value="prediction">Prediction</TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Training Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Training Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="algorithm">Algorithm</Label>
                  <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select algorithm" />
                    </SelectTrigger>
                    <SelectContent>
                      {algorithms.map(algo => (
                        <SelectItem key={algo.value} value={algo.value}>
                          <div>
                            <div className="font-medium">{algo.label}</div>
                            <div className="text-sm text-gray-500">{algo.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetColumn">Target Column</Label>
                  <Select value={targetColumn} onValueChange={setTargetColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Feature Columns</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {columns.map(col => (
                      <label key={col} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={featureColumns.includes(col)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFeatureColumns(prev => [...prev, col])
                            } else {
                              setFeatureColumns(prev => prev.filter(c => c !== col))
                            }
                          }}
                        />
                        <span className="text-sm">{col}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testSize">Test Size</Label>
                    <Input
                      id="testSize"
                      type="number"
                      min="0.1"
                      max="0.5"
                      step="0.1"
                      value={testSize}
                      onChange={(e) => setTestSize(parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="randomState">Random State</Label>
                    <Input
                      id="randomState"
                      type="number"
                      value={randomState}
                      onChange={(e) => setRandomState(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={trainModel} 
                  disabled={isTraining || !targetColumn || featureColumns.length === 0}
                  className="w-full"
                >
                  {isTraining ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Train Model
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Training Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Training Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isTraining && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{Math.round(trainingProgress)}%</span>
                      </div>
                      <Progress value={trainingProgress} className="w-full" />
                    </div>
                    
                    {currentStep && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Current step: {currentStep}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {pipelineSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-3 p-2 border rounded-md">
                      {getStepIcon(step.type)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{step.name}</div>
                        {step.duration && (
                          <div className="text-xs text-gray-500">
                            {step.duration.toFixed(0)}ms
                          </div>
                        )}
                      </div>
                      {getStepStatusIcon(step.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trained Models */}
          <Card>
            <CardHeader>
              <CardTitle>Trained Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trainedModels.map(model => (
                  <div key={model.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {model.algorithm} • Accuracy: {(model.accuracy * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={model.status === 'trained' ? 'default' : 'secondary'}>
                        {model.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedModel(model.id)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-4">
          {selectedModel && trainedModels.find(m => m.id === selectedModel)?.result ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Model Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const result = trainedModels.find(m => m.id === selectedModel)?.result!
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 border rounded-md">
                            <div className="text-2xl font-bold text-green-600">
                              {(result.accuracy * 100).toFixed(2)}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                          </div>
                          <div className="text-center p-4 border rounded-md">
                            <div className="text-2xl font-bold text-blue-600">
                              {(result.precision * 100).toFixed(2)}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Precision</div>
                          </div>
                          <div className="text-center p-4 border rounded-md">
                            <div className="text-2xl font-bold text-purple-600">
                              {(result.recall * 100).toFixed(2)}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Recall</div>
                          </div>
                          <div className="text-center p-4 border rounded-md">
                            <div className="text-2xl font-bold text-orange-600">
                              {(result.f1Score * 100).toFixed(2)}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">F1 Score</div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Importance</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const result = trainedModels.find(m => m.id === selectedModel)?.result!
                    return (
                      <div className="space-y-2">
                        {Object.entries(result.featureImportance)
                          .sort(([,a], [,b]) => b - a)
                          .map(([feature, importance]) => (
                            <div key={feature} className="flex items-center justify-between">
                              <span className="text-sm">{feature}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${importance * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {(importance * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  Train a model to see evaluation metrics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prediction" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Make Predictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="modelSelect">Select Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a trained model" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainedModels.filter(m => m.status === 'trained').map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({(model.accuracy * 100).toFixed(2)}% accuracy)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prediction Data (JSON format)</Label>
                  <textarea
                    className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600"
                    placeholder='[{"feature1": "value1", "feature2": "value2"}, ...]'
                    onChange={(e) => {
                      try {
                        const data = JSON.parse(e.target.value)
                        setPredictionData(Array.isArray(data) ? data : [])
                      } catch {
                        setPredictionData([])
                      }
                    }}
                  />
                </div>

                <Button 
                  onClick={makePredictions}
                  disabled={!selectedModel || predictionData.length === 0 || isPredicting}
                  className="w-full"
                >
                  {isPredicting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Make Predictions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction Results</CardTitle>
              </CardHeader>
              <CardContent>
                {predictions.length > 0 ? (
                  <div className="space-y-2">
                    {predictions.map((pred, index) => (
                      <div key={index} className="p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Sample {index + 1}</span>
                          <Badge variant="outline">
                            {pred.prediction}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Confidence: {(pred.confidence * 100).toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Probabilities: {Object.entries(pred.probabilities)
                            .map(([cls, prob]: [string, any]) => `${cls}: ${(Number(prob) * 100).toFixed(1)}%`)
                            .join(', ')
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Make predictions to see results here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}