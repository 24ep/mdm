'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  BarChart3,
  LineChart,
  PieChart,
  Scatter,
  TrendingUp,
  Activity,
  Layers,
  Settings,
  Play,
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
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'histogram' | 'box' | 'heatmap'

interface ChartConfig {
  type: ChartType
  title: string
  xAxis: string
  yAxis: string
  color?: string
  size?: string
  groupBy?: string
  aggregation?: 'sum' | 'count' | 'mean' | 'median' | 'min' | 'max'
  showLegend: boolean
  showGrid: boolean
  showTooltip: boolean
  width: number
  height: number
}

interface DataVisualizationProps {
  id: string
  config: ChartConfig
  data?: any[]
  timestamp: Date
  isActive: boolean
  onConfigChange: (config: ChartConfig) => void
  onDataChange: (data: any[]) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onFocus: () => void
}

export function DataVisualization({
  id,
  config,
  data = [],
  timestamp,
  isActive,
  onConfigChange,
  onDataChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onFocus
}: DataVisualizationProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: <LineChart className="h-4 w-4" /> },
    { value: 'bar', label: 'Bar Chart', icon: <BarChart3 className="h-4 w-4" /> },
    { value: 'pie', label: 'Pie Chart', icon: <PieChart className="h-4 w-4" /> },
    { value: 'scatter', label: 'Scatter Plot', icon: <Scatter className="h-4 w-4" /> },
    { value: 'area', label: 'Area Chart', icon: <Activity className="h-4 w-4" /> },
    { value: 'histogram', label: 'Histogram', icon: <Layers className="h-4 w-4" /> },
    { value: 'box', label: 'Box Plot', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'heatmap', label: 'Heatmap', icon: <Layers className="h-4 w-4" /> }
  ]

  const aggregations = [
    { value: 'sum', label: 'Sum' },
    { value: 'count', label: 'Count' },
    { value: 'mean', label: 'Mean' },
    { value: 'median', label: 'Median' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' }
  ]

  const defaultConfig: ChartConfig = {
    type: 'bar',
    title: 'New Chart',
    xAxis: '',
    yAxis: '',
    color: '#3B82F6',
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    width: 800,
    height: 400
  }

  const generateSampleData = (type: ChartType) => {
    const sampleData = []
    
    switch (type) {
      case 'line':
      case 'bar':
      case 'area':
        for (let i = 0; i < 12; i++) {
          sampleData.push({
            month: `Month ${i + 1}`,
            value: Math.floor(Math.random() * 100) + 10,
            category: i % 2 === 0 ? 'A' : 'B'
          })
        }
        break
      case 'pie':
        sampleData.push(
          { category: 'Desktop', value: 45 },
          { category: 'Mobile', value: 35 },
          { category: 'Tablet', value: 20 }
        )
        break
      case 'scatter':
        for (let i = 0; i < 50; i++) {
          sampleData.push({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 20 + 5,
            category: Math.random() > 0.5 ? 'Group A' : 'Group B'
          })
        }
        break
      case 'histogram':
        for (let i = 0; i < 100; i++) {
          sampleData.push({
            value: Math.random() * 100,
            category: Math.floor(Math.random() * 5)
          })
        }
        break
      case 'box':
        const categories = ['A', 'B', 'C', 'D']
        categories.forEach(cat => {
          for (let i = 0; i < 20; i++) {
            sampleData.push({
              category: cat,
              value: Math.random() * 100 + (cat === 'A' ? 0 : cat === 'B' ? 20 : cat === 'C' ? 40 : 60)
            })
          }
        })
        break
      case 'heatmap':
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            sampleData.push({
              x: i,
              y: j,
              value: Math.random() * 100
            })
          }
        }
        break
    }
    
    return sampleData
  }

  const renderChart = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas size
    canvas.width = config.width
    canvas.height = config.height

    // Draw chart based on type
    switch (config.type) {
      case 'bar':
        renderBarChart(ctx, data)
        break
      case 'line':
        renderLineChart(ctx, data)
        break
      case 'pie':
        renderPieChart(ctx, data)
        break
      case 'scatter':
        renderScatterPlot(ctx, data)
        break
      default:
        renderPlaceholder(ctx)
    }
  }

  const renderBarChart = (ctx: CanvasRenderingContext2D, data: any[]) => {
    if (data.length === 0) return

    const padding = 40
    const chartWidth = config.width - padding * 2
    const chartHeight = config.height - padding * 2

    // Draw axes
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, config.height - padding)
    ctx.lineTo(config.width - padding, config.height - padding)
    ctx.stroke()

    // Draw bars
    const barWidth = chartWidth / data.length * 0.8
    const maxValue = Math.max(...data.map(d => d.value || 0))

    data.forEach((item, index) => {
      const barHeight = ((item.value || 0) / maxValue) * chartHeight
      const x = padding + (index * chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2
      const y = config.height - padding - barHeight

      ctx.fillStyle = config.color || '#3B82F6'
      ctx.fillRect(x, y, barWidth, barHeight)

      // Draw value label
      ctx.fillStyle = '#374151'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(item.value?.toString() || '0', x + barWidth / 2, y - 5)
    })

    // Draw title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(config.title, config.width / 2, 25)
  }

  const renderLineChart = (ctx: CanvasRenderingContext2D, data: any[]) => {
    if (data.length === 0) return

    const padding = 40
    const chartWidth = config.width - padding * 2
    const chartHeight = config.height - padding * 2

    // Draw axes
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, config.height - padding)
    ctx.lineTo(config.width - padding, config.height - padding)
    ctx.stroke()

    // Draw line
    const maxValue = Math.max(...data.map(d => d.value || 0))
    const minValue = Math.min(...data.map(d => d.value || 0))
    const valueRange = maxValue - minValue || 1

    ctx.strokeStyle = config.color || '#3B82F6'
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((item, index) => {
      const x = padding + (index * chartWidth / (data.length - 1))
      const y = config.height - padding - ((item.value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw points
    ctx.fillStyle = config.color || '#3B82F6'
    data.forEach((item, index) => {
      const x = padding + (index * chartWidth / (data.length - 1))
      const y = config.height - padding - ((item.value - minValue) / valueRange) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(config.title, config.width / 2, 25)
  }

  const renderPieChart = (ctx: CanvasRenderingContext2D, data: any[]) => {
    if (data.length === 0) return

    const centerX = config.width / 2
    const centerY = config.height / 2
    const radius = Math.min(config.width, config.height) / 2 - 60

    const total = data.reduce((sum, item) => sum + (item.value || 0), 0)
    let currentAngle = 0

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI

      ctx.fillStyle = colors[index % colors.length]
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.closePath()
      ctx.fill()

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20)
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20)

      ctx.fillStyle = '#374151'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(item.category || `Item ${index + 1}`, labelX, labelY)

      currentAngle += sliceAngle
    })

    // Draw title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(config.title, config.width / 2, 30)
  }

  const renderScatterPlot = (ctx: CanvasRenderingContext2D, data: any[]) => {
    if (data.length === 0) return

    const padding = 40
    const chartWidth = config.width - padding * 2
    const chartHeight = config.height - padding * 2

    // Draw axes
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, config.height - padding)
    ctx.lineTo(config.width - padding, config.height - padding)
    ctx.stroke()

    // Draw points
    const maxX = Math.max(...data.map(d => d.x || 0))
    const maxY = Math.max(...data.map(d => d.y || 0))
    const minX = Math.min(...data.map(d => d.x || 0))
    const minY = Math.min(...data.map(d => d.y || 0))

    data.forEach((item) => {
      const x = padding + ((item.x - minX) / (maxX - minX)) * chartWidth
      const y = config.height - padding - ((item.y - minY) / (maxY - minY)) * chartHeight
      const size = item.size || 5

      ctx.fillStyle = config.color || '#3B82F6'
      ctx.beginPath()
      ctx.arc(x, y, size, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(config.title, config.width / 2, 25)
  }

  const renderPlaceholder = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#F3F4F6'
    ctx.fillRect(0, 0, config.width, config.height)

    ctx.fillStyle = '#9CA3AF'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Select a chart type and generate data to see visualization', config.width / 2, config.height / 2)
  }

  useEffect(() => {
    renderChart()
  }, [config, data])

  const handleGenerateData = async () => {
    setIsGenerating(true)
    try {
      const sampleData = generateSampleData(config.type)
      onDataChange(sampleData)
      toast.success('Sample data generated')
    } catch (error) {
      toast.error('Failed to generate data')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportChart = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `${config.title.replace(/\s+/g, '_')}.png`
    link.href = canvas.toDataURL()
    link.click()
    
    toast.success('Chart exported')
  }

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    toast.success('Chart configuration copied')
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      isActive ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Visualization</span>
            <Badge variant="outline" className="text-xs">
              {timestamp.toLocaleTimeString()}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">
              {config.type}
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
              onClick={() => setIsEditing(!isEditing)}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyConfig}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={exportChart}
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
          {isEditing ? (
            <div className="space-y-4">
              {/* Chart Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chart-type">Chart Type</Label>
                  <Select
                    value={config.type}
                    onValueChange={(value: ChartType) => onConfigChange({ ...config, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chartTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="chart-title">Title</Label>
                  <Input
                    id="chart-title"
                    value={config.title}
                    onChange={(e) => onConfigChange({ ...config, title: e.target.value })}
                    placeholder="Chart title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="x-axis">X Axis</Label>
                  <Input
                    id="x-axis"
                    value={config.xAxis}
                    onChange={(e) => onConfigChange({ ...config, xAxis: e.target.value })}
                    placeholder="X axis field"
                  />
                </div>

                <div>
                  <Label htmlFor="y-axis">Y Axis</Label>
                  <Input
                    id="y-axis"
                    value={config.yAxis}
                    onChange={(e) => onConfigChange({ ...config, yAxis: e.target.value })}
                    placeholder="Y axis field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={config.width}
                    onChange={(e) => onConfigChange({ ...config, width: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={config.height}
                    onChange={(e) => onConfigChange({ ...config, height: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={config.color}
                    onChange={(e) => onConfigChange({ ...config, color: e.target.value })}
                  />
                </div>
              </div>

              {/* Chart Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateData}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Generate Data
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Chart Display */}
              <div className="border rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>

              {/* Chart Info */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {data.length} data points • {config.width}×{config.height}px
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit Chart
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
