'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Circle as Scatter, 
  TrendingUp,
  Download,
  Settings,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Palette,
  Grid,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataVisualizationProps {
  data: any[]
  columns: string[]
  onUpdate?: (config: VisualizationConfig) => void
  className?: string
}

interface VisualizationConfig {
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'histogram' | 'box' | 'heatmap'
  xAxis: string
  yAxis: string
  colorBy?: string
  groupBy?: string
  title: string
  width: number
  height: number
  showLegend: boolean
  showGrid: boolean
  theme: 'light' | 'dark'
}

const defaultConfig: VisualizationConfig = {
  type: 'bar',
  xAxis: '',
  yAxis: '',
  colorBy: '',
  groupBy: '',
  title: 'Data Visualization',
  width: 800,
  height: 400,
  showLegend: true,
  showGrid: true,
  theme: 'light'
}

export function DataVisualization({ data, columns, onUpdate, className }: DataVisualizationProps) {
  const [config, setConfig] = useState<VisualizationConfig>(defaultConfig)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Update config when data changes
  useEffect(() => {
    if (columns.length > 0) {
      setConfig(prev => ({
        ...prev,
        xAxis: columns[0] || '',
        yAxis: columns[1] || ''
      }))
    }
  }, [columns])

  // Generate visualization
  const generateVisualization = async () => {
    if (!data.length || !config.xAxis || !config.yAxis) return

    setIsGenerating(true)
    
    try {
      // Simulate chart generation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real implementation, this would use a charting library like Chart.js, D3.js, or Plotly
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          drawChart(ctx, canvas.width, canvas.height)
        }
      }
      
      onUpdate?.(config)
    } catch (error) {
      console.error('Error generating visualization:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Simple chart drawing function (placeholder)
  const drawChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height)
    
    // Set background
    ctx.fillStyle = config.theme === 'dark' ? '#1f2937' : '#ffffff'
    ctx.fillRect(0, 0, width, height)
    
    // Draw grid
    if (config.showGrid) {
      ctx.strokeStyle = config.theme === 'dark' ? '#374151' : '#e5e7eb'
      ctx.lineWidth = 1
      
      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = (width / 10) * i
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      
      // Horizontal grid lines
      for (let i = 0; i <= 10; i++) {
        const y = (height / 10) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }
    
    // Draw sample data based on chart type
    ctx.fillStyle = '#3b82f6'
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    
    if (config.type === 'bar') {
      drawBarChart(ctx, width, height)
    } else if (config.type === 'line') {
      drawLineChart(ctx, width, height)
    } else if (config.type === 'scatter') {
      drawScatterChart(ctx, width, height)
    } else if (config.type === 'pie') {
      drawPieChart(ctx, width, height)
    }
    
    // Draw title
    ctx.fillStyle = config.theme === 'dark' ? '#ffffff' : '#000000'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(config.title, width / 2, 30)
  }

  const drawBarChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const barWidth = width / data.length * 0.8
    const maxValue = Math.max(...data.map(d => d[config.yAxis] || 0))
    
    data.forEach((item, index) => {
      const value = item[config.yAxis] || 0
      const barHeight = (value / maxValue) * (height - 100)
      const x = (width / data.length) * index + (width / data.length - barWidth) / 2
      const y = height - 50 - barHeight
      
      ctx.fillRect(x, y, barWidth, barHeight)
    })
  }

  const drawLineChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const maxValue = Math.max(...data.map(d => d[config.yAxis] || 0))
    const minValue = Math.min(...data.map(d => d[config.yAxis] || 0))
    
    ctx.beginPath()
    data.forEach((item, index) => {
      const value = item[config.yAxis] || 0
      const x = (width / (data.length - 1)) * index
      const y = height - 50 - ((value - minValue) / (maxValue - minValue)) * (height - 100)
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
  }

  const drawScatterChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const maxX = Math.max(...data.map(d => d[config.xAxis] || 0))
    const minX = Math.min(...data.map(d => d[config.xAxis] || 0))
    const maxY = Math.max(...data.map(d => d[config.yAxis] || 0))
    const minY = Math.min(...data.map(d => d[config.yAxis] || 0))
    
    data.forEach((item) => {
      const x = ((item[config.xAxis] - minX) / (maxX - minX)) * (width - 100) + 50
      const y = height - 50 - ((item[config.yAxis] - minY) / (maxY - minY)) * (height - 100)
      
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  const drawPieChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 3
    
    const total = data.reduce((sum, item) => sum + (item[config.yAxis] || 0), 0)
    let currentAngle = 0
    
    data.forEach((item, index) => {
      const value = item[config.yAxis] || 0
      const sliceAngle = (value / total) * 2 * Math.PI
      
      ctx.fillStyle = `hsl(${index * 60}, 70%, 50%)`
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.closePath()
      ctx.fill()
      
      currentAngle += sliceAngle
    })
  }

  const exportChart = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const link = document.createElement('a')
      link.download = `${config.title.replace(/\s+/g, '_')}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'scatter', label: 'Scatter Plot', icon: Scatter },
    { value: 'pie', label: 'Pie Chart', icon: PieChart },
    { value: 'histogram', label: 'Histogram', icon: TrendingUp },
    { value: 'box', label: 'Box Plot', icon: Grid },
    { value: 'heatmap', label: 'Heatmap', icon: Layers }
  ]

  return (
    <div className={cn("space-y-4", className)}>
      {/* Side-by-side Preview (70) and Config (30) */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
        {/* Preview 70% */}
        <div className="md:col-span-7">
          <Card>
            <CardContent className="p-4">
              <div className={cn(
                "flex justify-center",
                isFullscreen ? "fixed inset-0 z-50 bg-white p-4" : ""
              )}>
                <canvas
                  ref={canvasRef}
                  width={config.width}
                  height={config.height}
                  className="border border-gray-200 rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Config 30% */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Visualization Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            {/* Chart Type */}
            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Select 
                value={config.type} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* X Axis */}
            <div className="space-y-2">
              <Label>X Axis</Label>
              <Select 
                value={config.xAxis} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, xAxis: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select X axis" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Y Axis */}
            <div className="space-y-2">
              <Label>Y Axis</Label>
              <Select 
                value={config.yAxis} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, yAxis: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Y axis" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Chart title"
              />
            </div>

            {/* Width */}
            <div className="space-y-2">
              <Label>Width</Label>
              <Input
                type="number"
                value={config.width}
                onChange={(e) => setConfig(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                min="200"
                max="2000"
              />
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label>Height</Label>
              <Input
                type="number"
                value={config.height}
                onChange={(e) => setConfig(prev => ({ ...prev, height: parseInt(e.target.value) || 400 }))}
                min="200"
                max="1200"
              />
            </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.showLegend}
                onChange={(e) => setConfig(prev => ({ ...prev, showLegend: e.target.checked }))}
                className="rounded"
              />
              Show Legend
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.showGrid}
                onChange={(e) => setConfig(prev => ({ ...prev, showGrid: e.target.checked }))}
                className="rounded"
              />
              Show Grid
            </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
            <Button 
              onClick={generateVisualization}
              disabled={isGenerating || !config.xAxis || !config.yAxis}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Chart'}
            </Button>
            
            <Button variant="outline" onClick={exportChart}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}