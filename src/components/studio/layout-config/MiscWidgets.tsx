import React from 'react'
import { Calendar, Map, TrendingUp, Image as ImageIcon } from 'lucide-react'
import { computeWidgetStyle, WidgetStyleProps } from './widgetStyles'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { ChartErrorBoundary } from './ChartErrorBoundary'

interface MiscWidgetProps extends WidgetStyleProps {
  widget: {
    type: string
    width?: number
    height?: number
  }
  isMobile?: boolean
  chartData?: any[]
  dimensions?: string[]
  measures?: string[]
}

export function CalendarWidget({ props, style }: { props: MiscWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full p-2 flex items-center justify-center" style={style}>
      <div className="flex flex-col items-center">
        <Calendar className="h-8 w-8 mb-2 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Calendar</span>
      </div>
    </div>
  )
}

export function MapWidget({ props, style }: { props: MiscWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full p-2 flex items-center justify-center" style={style}>
      <div className="flex flex-col items-center">
        <Map className="h-8 w-8 mb-2 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Map</span>
      </div>
    </div>
  )
}

export function CardWidget({ props, style }: { props: MiscWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full p-3 flex flex-col" style={style}>
      <h3 className="text-sm font-semibold mb-2">{(props as any).title || 'Card Title'}</h3>
      <p className="text-xs text-muted-foreground flex-1">{(props as any).content || 'Card content'}</p>
    </div>
  )
}

export function ScorecardWidget({ props, style }: { props: MiscWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full p-3 flex flex-col items-center justify-center" style={style}>
      <div className="text-2xl font-bold mb-1">{(props as any).value || '0'}</div>
      <div className="text-xs text-muted-foreground">{(props as any).label || 'Scorecard'}</div>
    </div>
  )
}

export function TimeSeriesWidget({ props, style, chartData, dimensions, measures }: { 
  props: MiscWidgetProps; 
  style: React.CSSProperties
  chartData?: any[]
  dimensions?: string[]
  measures?: string[]
}) {
  const hasData = chartData && Array.isArray(chartData) && chartData.length > 0
  const hasDimensions = dimensions && dimensions.length > 0
  const hasMeasures = measures && measures.length > 0
  const isValidData = hasData && chartData && chartData.every((item: any) => typeof item === 'object' && item !== null)
  
  if (isValidData && hasDimensions && hasMeasures) {
    return (
      <div className="w-full h-full flex flex-col" style={style}>
        {((props as any).showHeader ?? true) && (
          <div
            className="w-full flex items-center gap-2 px-3 py-2 shrink-0"
            style={{
              background: (props as any).headerBackgroundColor || 'transparent',
              justifyContent: ((props as any).titleAlign || 'left') === 'center' ? 'center' : ((props as any).titleAlign || 'left') === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            <TrendingUp className="h-3.5 w-3.5" style={{ color: (props as any).titleColor || style.color || '#111827' }} />
            <div
              className="truncate"
              style={{
                fontSize: (props as any).titleFontSize ? `${(props as any).titleFontSize}px` : undefined,
                color: (props as any).titleColor || style.color,
                fontWeight: (props as any).titleFontWeight || 600,
              }}
            >
              {(props as any).title || 'Time Series'}
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0">
          <ChartErrorBoundary>
            <ChartRenderer
              type={(props as any).widget?.type || 'time-series'}
              chartType="LINE"
              data={chartData}
              dimensions={dimensions || []}
              measures={measures || []}
              filters={[]}
              title={(props as any).title || ''}
              className="w-full h-full"
              config={{
                chartDimensionsEffectiveTypes: (props as any).chartDimensionsEffectiveTypes || {},
                legend: { 
                  show: (props as any).showLegend, 
                  fontSize: (props as any).legendFontSize, 
                  fontFamily: (props as any).legendFontFamily, 
                  color: (props as any).legendColor 
                },
                grid: { 
                  dash: (props as any).gridDash, 
                  color: (props as any).gridColor 
                },
                showGrid: (props as any).showGrid,
                xAxis: { 
                  show: (props as any).showXAxis, 
                  title: (props as any).xAxisLabel, 
                  titleFontSize: (props as any).xAxisTitleFontSize, 
                  titleColor: (props as any).xAxisTitleColor, 
                  tickFontSize: (props as any).xAxisTickFontSize, 
                  tickColor: (props as any).xAxisTickColor, 
                  fontFamily: (props as any).xAxisFontFamily, 
                  showGrid: (props as any).xAxisShowGrid 
                },
                yAxis: { 
                  show: (props as any).showYAxis, 
                  title: (props as any).yAxisLabel, 
                  titleFontSize: (props as any).yAxisTitleFontSize, 
                  titleColor: (props as any).yAxisTitleColor, 
                  tickFontSize: (props as any).yAxisTickFontSize, 
                  tickColor: (props as any).yAxisTickColor, 
                  fontFamily: (props as any).yAxisFontFamily 
                },
                tooltip: { 
                  fontSize: (props as any).tooltipFontSize, 
                  fontFamily: (props as any).tooltipFontFamily 
                },
              }}
            />
          </ChartErrorBoundary>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full h-full p-3 flex flex-col items-center justify-center" style={style}>
      <TrendingUp className={`${props.isMobile ? 'h-8 w-8' : 'h-12 w-12'} mb-2 text-muted-foreground`} />
      <div className="text-xs text-muted-foreground text-center">
        {(props as any).title || 'Time Series'}
      </div>
      {(!hasData || !hasDimensions || !hasMeasures) && (
        <div className="text-xs text-muted-foreground text-center mt-1">
          Configure data source
        </div>
      )}
    </div>
  )
}

