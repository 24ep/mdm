'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface ChartControlsProps {
  chartType: string
  chartConfig: {
    dimensions: string[]
    measures: string[]
    title: string
  }
  availableColumns: string[]
  numericColumns: string[]
  onChartTypeChange: (type: string) => void
  onDimensionChange: (dimension: string) => void
  onMeasureChange: (measure: string) => void
}

export function ChartControls({
  chartType,
  chartConfig,
  availableColumns,
  numericColumns,
  onChartTypeChange,
  onDimensionChange,
  onMeasureChange
}: ChartControlsProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Data Visualization</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="chart-type" className="text-xs text-gray-600">Chart:</Label>
            <Select value={chartType} onValueChange={onChartTypeChange}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BAR">Bar Chart</SelectItem>
                <SelectItem value="LINE">Line Chart</SelectItem>
                <SelectItem value="PIE">Pie Chart</SelectItem>
                <SelectItem value="AREA">Area Chart</SelectItem>
                <SelectItem value="SCATTER">Scatter Plot</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="dimension" className="text-xs text-gray-600">X-Axis:</Label>
            <Select 
              value={chartConfig.dimensions[0] || ''} 
              onValueChange={onDimensionChange}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Select dimension" />
              </SelectTrigger>
              <SelectContent>
                {availableColumns.map(column => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="measure" className="text-xs text-gray-600">Y-Axis:</Label>
            <Select 
              value={chartConfig.measures[0] || ''} 
              onValueChange={onMeasureChange}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Select measure" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map(column => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
