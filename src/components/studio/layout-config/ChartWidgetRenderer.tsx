import React from 'react'
import { BarChart3, LineChart, PieChart, AreaChart, Loader2, Target, Gauge, TrendingUp, Grid, Circle } from 'lucide-react'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { ChartErrorBoundary } from './ChartErrorBoundary'
import { applyAggregations, getAggregationConfig } from './dataAggregationUtils'
import { AggregationType } from './ChartDataSourceConfig'

interface ChartWidgetRendererProps {
  widget: {
    type: string
  }
  props: any
  style: React.CSSProperties
  chartData: any[]
  dataLoading: boolean
  dataError: string | null
  isMobile?: boolean
}

export function ChartWidgetRenderer({ widget, props, style, chartData, dataLoading, dataError, isMobile }: ChartWidgetRendererProps) {
  // Extract chart type: use chartType property if set, otherwise extract from widget.type
  const chartType = props.chartType || widget.type.replace('-chart', '')
  
  // Convert chartDimensions object to dimensions/measures arrays if chartDimensions exists
  const chartDimensions = props.chartDimensions as Record<string, string | string[]> | undefined
  const aggregations = (props.chartDimensionAggregations || {}) as Record<string, Record<string, AggregationType>>
  
  let dimensions: string[] = props.dimensions || []
  let measures: string[] = props.measures || []
  
  // Chart dimension configuration mapping
  const CHART_DIMENSIONS_MAP: Record<string, { dimensionKeys: string[], measureKeys: string[] }> = {
    'bar-chart': { dimensionKeys: ['x', 'series'], measureKeys: ['y'] },
    'line-chart': { dimensionKeys: ['x', 'series'], measureKeys: ['y'] },
    'area-chart': { dimensionKeys: ['x', 'series'], measureKeys: ['y'] },
    'pie-chart': { dimensionKeys: ['category'], measureKeys: ['value'] },
    'donut-chart': { dimensionKeys: ['category'], measureKeys: ['value'] },
    'scatter-chart': { dimensionKeys: ['x', 'color'], measureKeys: ['y', 'size'] },
    'table': { dimensionKeys: ['rows', 'columns'], measureKeys: ['values'] },
    'pivot-table': { dimensionKeys: ['rows'], measureKeys: ['values', 'columns'] },
    'radar-chart': { dimensionKeys: ['category'], measureKeys: ['value'] },
    'gauge-chart': { dimensionKeys: ['min', 'max'], measureKeys: ['value'] },
    'funnel-chart': { dimensionKeys: ['category'], measureKeys: ['value'] },
    'waterfall-chart': { dimensionKeys: ['x'], measureKeys: ['y'] },
    'treemap-chart': { dimensionKeys: ['category'], measureKeys: ['value'] },
    'heatmap-chart': { dimensionKeys: ['x', 'y'], measureKeys: ['value'] },
    'bubble-chart': { dimensionKeys: ['x', 'color'], measureKeys: ['y', 'size'] },
    'combo-chart': { dimensionKeys: ['x', 'series'], measureKeys: ['y'] },
  }
  
  if (chartDimensions && typeof chartDimensions === 'object') {
    const mapping = CHART_DIMENSIONS_MAP[widget.type] || CHART_DIMENSIONS_MAP['bar-chart']
    
    // Extract dimensions (typically category/grouping attributes)
    dimensions = []
    mapping.dimensionKeys.forEach(key => {
      const value = chartDimensions[key]
      if (Array.isArray(value)) {
        dimensions.push(...value.filter(v => v))
      } else if (value) {
        dimensions.push(value)
      }
    })
    
    // Extract measures (typically numeric/value attributes)
    measures = []
    mapping.measureKeys.forEach(key => {
      const value = chartDimensions[key]
      if (Array.isArray(value)) {
        measures.push(...value.filter(v => v))
      } else if (value) {
        measures.push(value)
      }
    })
  }
  
  // Apply date range filter if configured (before aggregations)
  let processedData = chartData
  const dateRangeConfig = (props.dateRangeConfig as { attribute?: string; startDate?: string; endDate?: string }) || null
  if (dateRangeConfig && dateRangeConfig.attribute && (dateRangeConfig.startDate || dateRangeConfig.endDate) && processedData && Array.isArray(processedData)) {
    const dateAttr = dateRangeConfig.attribute
    processedData = processedData.filter((row: any) => {
      const dateValue = row[dateAttr]
      if (dateValue === null || dateValue === undefined) return false
      
      // Parse date value (support multiple formats)
      let rowDate: Date | null = null
      if (dateValue instanceof Date) {
        rowDate = dateValue
      } else if (typeof dateValue === 'string') {
        rowDate = new Date(dateValue)
      } else if (typeof dateValue === 'number') {
        rowDate = new Date(dateValue)
      }
      
      if (!rowDate || isNaN(rowDate.getTime())) return false
      
      // Check start date
      if (dateRangeConfig.startDate) {
        const startDate = new Date(dateRangeConfig.startDate)
        startDate.setHours(0, 0, 0, 0)
        rowDate.setHours(0, 0, 0, 0)
        if (rowDate < startDate) return false
      }
      
      // Check end date
      if (dateRangeConfig.endDate) {
        const endDate = new Date(dateRangeConfig.endDate)
        endDate.setHours(23, 59, 59, 999)
        const rowDateEnd = new Date(rowDate)
        rowDateEnd.setHours(23, 59, 59, 999)
        if (rowDateEnd > endDate) return false
      }
      
      return true
    })
  }

  // Apply aggregations to data if we have dimensions and measures
  if (chartDimensions && processedData && Array.isArray(processedData) && processedData.length > 0) {
    const mapping = CHART_DIMENSIONS_MAP[widget.type] || CHART_DIMENSIONS_MAP['bar-chart']
    
    // Only apply aggregations if we have both dimensions and measures configured
    if (dimensions.length > 0 && measures.length > 0) {
      try {
        const aggConfig = getAggregationConfig(
          chartDimensions,
          aggregations,
          mapping.dimensionKeys,
          mapping.measureKeys
        )
        
        // Apply aggregations
        processedData = applyAggregations(processedData, aggConfig)
      } catch (error) {
        console.error('Error applying aggregations:', error)
        // Fall back to raw data if aggregation fails
        processedData = processedData
      }
    }
  }
  
  const hasData = processedData && Array.isArray(processedData) && processedData.length > 0
  const hasDimensions = dimensions.length > 0
  const hasMeasures = measures.length > 0
  
  // Validate data structure before rendering
  const isValidData = hasData && processedData.every((item: any) => 
    typeof item === 'object' && item !== null
  )
  
  // Show loading state
  if (dataLoading && props.dataSource !== 'sample') {
    return (
      <div className="w-full h-full p-3 flex flex-col items-center justify-center" style={style}>
        <Loader2 className="h-8 w-8 mb-2 text-muted-foreground animate-spin" />
        <div className="text-xs text-muted-foreground text-center">
          Loading data...
        </div>
      </div>
    )
  }
  
  // Show error state
  if (dataError && props.dataSource !== 'sample') {
    return (
      <div className="w-full h-full p-3 flex flex-col items-center justify-center" style={style}>
        <BarChart3 className="h-8 w-8 mb-2 text-red-500" />
        <div className="text-xs text-red-500 text-center font-medium">
          Data Error
        </div>
        <div className="text-xs text-muted-foreground text-center mt-1 px-2">
          {dataError}
        </div>
      </div>
    )
  }
  
  // For table charts, only need columns (measures) - dimensions (rows) are optional
  const isTableChart = chartType === 'table' || chartType === 'TABLE' || widget.type.includes('table')
  const canRenderChart = isTableChart 
    ? (isValidData && measures.length > 0)  // Table only needs columns (measures)
    : (isValidData && hasDimensions && hasMeasures)  // Other charts need both
  
  // If we have data configured, render the actual chart
  if (canRenderChart) {
    // Map widget chart types to ChartRenderer chart types
    const chartTypeMap: Record<string, string> = {
      'bar': 'BAR',
      'line': 'LINE',
      'area': 'AREA',
      'pie': 'PIE',
      'donut': 'DONUT',
      'scatter': 'SCATTER',
      'radar': 'RADAR',
      'gauge': 'GAUGE',
      'funnel': 'FUNNEL',
      'waterfall': 'WATERFALL',
      'treemap': 'TREEMAP',
      'heatmap': 'HEATMAP',
      'bubble': 'BUBBLE_MAP',
      'combo': 'COMPOSED'
    }

    const renderChartType = chartTypeMap[chartType] || chartType.toUpperCase() || 'BAR'

    // Use error boundary for chart rendering
    return (
      <div className="w-full h-full flex flex-col" style={style}>
        {/* Optional Header */}
        {(props.showHeader ?? true) && (
          <div
            className="w-full flex items-center gap-2 px-3 py-2 shrink-0"
            style={{
              background: props.headerBackgroundColor || 'transparent',
              justifyContent: (props.titleAlign || 'left') === 'center' ? 'center' : (props.titleAlign || 'left') === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            {/* Header Icon */}
            {props.headerIcon && props.headerIcon !== 'none' && (() => {
              const iconSize = 14
              const iconColor = props.titleColor || style.color || '#111827'
              const iconMap: Record<string, React.ReactNode> = {
                bar: <BarChart3 size={iconSize} style={{ color: iconColor }} />,
                line: <LineChart size={iconSize} style={{ color: iconColor }} />,
                area: <AreaChart size={iconSize} style={{ color: iconColor }} />,
                pie: <PieChart size={iconSize} style={{ color: iconColor }} />,
                donut: <PieChart size={iconSize} style={{ color: iconColor }} />,
                scatter: <Circle size={iconSize} style={{ color: iconColor }} />,
                radar: <Target size={iconSize} style={{ color: iconColor }} />,
                gauge: <Gauge size={iconSize} style={{ color: iconColor }} />,
                funnel: <TrendingUp size={iconSize} style={{ color: iconColor }} />,
                waterfall: <BarChart3 size={iconSize} style={{ color: iconColor }} />,
                treemap: <Grid size={iconSize} style={{ color: iconColor }} />,
                heatmap: <Grid size={iconSize} style={{ color: iconColor }} />,
                bubble: <Circle size={iconSize} style={{ color: iconColor }} />,
                combo: <BarChart3 size={iconSize} style={{ color: iconColor }} />,
              }
              return iconMap[props.headerIcon] || null
            })()}
            <div
              className="truncate"
              style={{
                fontSize: props.titleFontSize ? `${props.titleFontSize}px` : undefined,
                color: props.titleColor || style.color,
                fontWeight: props.titleFontWeight || 600,
                textAlign: props.titleAlign || 'left',
                width: '100%'
              }}
            >
              {props.title || ''}
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0">
          <ChartErrorBoundary>
            <ChartRenderer
              type={widget.type}
              chartType={renderChartType}
              data={processedData}
              dimensions={dimensions}
              measures={measures}
              filters={[]}
              title={props.title || ''}
              className="w-full h-full"
              config={{
                chartDimensionsEffectiveTypes: props.chartDimensionsEffectiveTypes || {},
                chartDimensionTypeSettings: props.chartDimensionTypeSettings || {},
                chartDimensionDisplayNames: props.chartDimensionDisplayNames || {},
                // Legend configuration
                legend: { 
                  show: props.showLegend ?? true, 
                  fontSize: props.legendFontSize ?? 12, 
                  fontFamily: props.legendFontFamily ?? 'Roboto', 
                  color: props.legendColor ?? '#111827',
                  position: props.legendPosition || 'bottom'
                },
                showLegend: props.showLegend ?? true,
                // Grid configuration
                grid: { 
                  dash: props.gridDash ?? '3 3', 
                  color: props.gridColor ?? '#f0f0f0' 
                },
                showGrid: props.showGrid ?? true,
                // X-Axis configuration
                xAxis: { 
                  show: props.showXAxis ?? true, 
                  title: props.xAxisLabel ?? '', 
                  titleFontSize: props.xAxisTitleFontSize ?? 12, 
                  titleColor: props.xAxisTitleColor ?? '#111827', 
                  tickFontSize: props.xAxisTickFontSize ?? 12, 
                  tickColor: props.xAxisTickColor ?? '#111827', 
                  fontFamily: props.xAxisFontFamily ?? 'Roboto', 
                  showGrid: props.showGrid ?? true 
                },
                // Y-Axis configuration
                yAxis: { 
                  show: props.showYAxis ?? true, 
                  title: props.yAxisLabel ?? '', 
                  titleFontSize: props.yAxisTitleFontSize ?? 12, 
                  titleColor: props.yAxisTitleColor ?? '#111827', 
                  tickFontSize: props.yAxisTickFontSize ?? 12, 
                  tickColor: props.yAxisTickColor ?? '#111827', 
                  fontFamily: props.yAxisFontFamily ?? 'Roboto',
                  min: props.yAxisMin,
                  max: props.yAxisMax
                },
                // Tooltip configuration
                tooltip: { 
                  fontSize: props.tooltipFontSize ?? 12, 
                  fontFamily: props.tooltipFontFamily ?? 'Roboto' 
                },
                // Number format configuration
                numberFormat: {
                  type: props.numberFormatType || 'auto',
                  decimalPlaces: props.decimalPlaces ?? 2,
                  thousandsSeparator: props.thousandsSeparator ?? true,
                  currencySymbol: props.currencySymbol || '$'
                },
                // Pie/Donut configuration
                pie: { 
                  outerRadius: props.pieOuterRadius ?? 80, 
                  innerRadius: props.innerRadius ?? (chartType === 'donut' ? 40 : 0)
                },
                // Data labels configuration
                dataLabels: { 
                  show: props.showLabels ?? true, 
                  showLine: props.showLabelLines ?? false 
                },
                // Bar/Line extra configuration
                bar: {
                  mode: props.barMode || 'grouped',
                  orientation: props.barOrientation || 'vertical'
                },
                line: {
                  curve: props.lineCurve || 'monotone'
                },
                // Series styles (per measure)
                series: props.seriesStyles || {}
              }}
            />
          </ChartErrorBoundary>
        </div>
      </div>
    )
  }

  // Otherwise show icon placeholder
  const ChartIcon = 
    chartType === 'bar' || chartType === 'waterfall' ? BarChart3 :
    chartType === 'line' || chartType === 'area' ? LineChart :
    chartType === 'pie' || chartType === 'donut' ? PieChart :
    chartType === 'area' ? AreaChart :
    BarChart3

  return (
    <div className="w-full h-full p-3 flex flex-col items-center justify-center" style={style}>
      <ChartIcon className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mb-2 text-muted-foreground`} />
      <div className="text-xs text-muted-foreground text-center">
        {props.title || widget.type.replace('-chart', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </div>
      {(!hasData || !hasDimensions || !hasMeasures) && (
        <div className="text-xs text-muted-foreground text-center mt-1">
          Configure data source
        </div>
      )}
    </div>
  )
}

