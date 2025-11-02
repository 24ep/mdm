'use client'

import React, { useMemo } from 'react'
import { PlacedWidget } from './widgets'
import { BarChart3, LineChart, PieChart, AreaChart, Table as TableIcon, Image as ImageIcon, Video as VideoIcon, Type, Link2, Calendar, Map, Loader2 } from 'lucide-react'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { ChartErrorBoundary } from './ChartErrorBoundary'
import { useDataSource } from './useDataSource'

interface WidgetRendererProps {
  widget: PlacedWidget
  isMobile?: boolean
  spaceId?: string
}

export const WidgetRenderer = React.memo(function WidgetRenderer({ widget, isMobile = false, spaceId }: WidgetRendererProps) {
  const props = widget.properties || {}
  
  // Use data source hook for API/database/data-model sources
  const { data: fetchedData, loading: dataLoading, error: dataError } = useDataSource({
    dataSource: props.dataSource || 'sample',
    apiUrl: props.apiUrl,
    apiMethod: props.apiMethod || 'GET',
    apiHeaders: props.apiHeaders || '{}',
    sqlQuery: props.sqlQuery,
    dbConnection: props.dbConnection,
    dataModelId: props.dataModelId,
    spaceId: spaceId,
    sampleData: props.sampleData || [],
    autoRefresh: props.autoRefresh || false,
    refreshInterval: props.refreshInterval || 0
  })
  
  // Determine which data to use
  const chartData = useMemo(() => {
    if (props.dataSource === 'sample') {
      return props.sampleData || []
    }
    return fetchedData
  }, [props.dataSource, props.sampleData, fetchedData])
  
  // Handle border sides configuration
  const borderSides = props.borderSides || {
    top: true,
    right: true,
    bottom: true,
    left: true
  }
  
  const borderColor = (props.showBorder && props.borderWidth) ? (props.borderColor || '#e5e7eb') : undefined
  const borderWidth = (props.showBorder && props.borderWidth) ? props.borderWidth : 0
  const borderStyle = (props.showBorder && props.borderWidth) ? (props.borderStyle || 'solid') : undefined
  
  // Handle border radius - support both legacy (number) and new (object with per-side values)
  const getBorderRadius = () => {
    if (!props.borderRadius) return undefined
    
    // Legacy format: single number
    if (typeof props.borderRadius === 'number') {
      return `${props.borderRadius}px`
    }
    
    // New format: object with per-side values
    if (typeof props.borderRadius === 'object' && props.borderRadius !== null) {
      const br = props.borderRadius as any
      const topLeft = br.topLeft ? `${br.topLeft.value}${br.topLeft.unit}` : '0px'
      const topRight = br.topRight ? `${br.topRight.value}${br.topRight.unit}` : '0px'
      const bottomRight = br.bottomRight ? `${br.bottomRight.value}${br.bottomRight.unit}` : '0px'
      const bottomLeft = br.bottomLeft ? `${br.bottomLeft.value}${br.bottomLeft.unit}` : '0px'
      
      return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`
    }
    
    return undefined
  }
  
  const style: React.CSSProperties = {
    backgroundColor: (props.showBackground !== false && props.backgroundColor) ? props.backgroundColor : 'transparent',
    color: props.textColor || '#000000',
    fontFamily: props.fontFamily || 'inherit',
    fontSize: props.fontSize ? `${props.fontSize}px` : undefined,
    fontWeight: props.fontWeight || 'normal',
    textAlign: props.textAlign || 'left',
    borderTop: borderColor && borderSides.top ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
    borderRight: borderColor && borderSides.right ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
    borderBottom: borderColor && borderSides.bottom ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
    borderLeft: borderColor && borderSides.left ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
    borderRadius: getBorderRadius(),
    padding: props.padding ? `${props.padding}px` : undefined,
    margin: props.margin ? `${props.margin}px` : undefined,
    opacity: props.opacity !== undefined ? props.opacity : 1,
    boxShadow: props.shadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
  }

  // Text Widget
  if (widget.type === 'text') {
    return (
      <div 
        className="w-full h-full flex items-center p-2"
        style={style}
      >
        <span style={{
          fontSize: props.titleFontSize ? `${props.titleFontSize}px` : style.fontSize,
          fontWeight: props.fontWeight || 'normal',
        }}>
          {props.text || 'Text Widget'}
        </span>
      </div>
    )
  }

  // Image Widget
  if (widget.type === 'image') {
    return (
      <div className="w-full h-full flex items-center justify-center p-2" style={style}>
        {props.imageUrl ? (
          <img 
            src={props.imageUrl} 
            alt={props.imageAlt || 'Image'} 
            className="max-w-full max-h-full object-contain"
            style={{ objectFit: props.objectFit || 'contain' }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mb-2" />
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>
    )
  }

  // Video Widget
  if (widget.type === 'video') {
    return (
      <div className="w-full h-full flex items-center justify-center p-2" style={style}>
        {props.videoUrl ? (
          <video 
            src={props.videoUrl}
            controls
            autoPlay={props.autoplay}
            loop={props.loop}
            muted={props.muted}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <VideoIcon className="h-8 w-8 mb-2" />
            <span className="text-xs">No video</span>
          </div>
        )}
      </div>
    )
  }

  // Iframe Widget
  if (widget.type === 'iframe') {
    return (
      <div className="w-full h-full p-2" style={style}>
        {props.iframeUrl ? (
          <iframe 
            src={props.iframeUrl}
            className="w-full h-full border-0 rounded"
            allowFullScreen={props.allowFullscreen}
            title="Embedded Content"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ImageIcon className="h-8 w-8 mb-2" />
            <span className="text-xs">No URL</span>
          </div>
        )}
      </div>
    )
  }

  // Link Widget
  if (widget.type === 'link') {
    return (
      <div className="w-full h-full flex items-center justify-center p-2" style={style}>
        <a 
          href={props.linkUrl || '#'}
          target={props.target || '_self'}
          className="text-blue-600 hover:underline"
          style={{ color: props.textColor || '#2563eb' }}
        >
          {props.linkText || 'Link'}
        </a>
      </div>
    )
  }

  // Button Widget
  if (widget.type === 'button') {
    return (
      <div className="w-full h-full flex items-center justify-center p-2" style={style}>
        <button
          className="px-4 py-2 rounded transition-colors"
          style={{
            backgroundColor: props.backgroundColor || '#3b82f6',
            color: props.textColor || '#ffffff',
            fontSize: props.fontSize ? `${props.fontSize}px` : undefined,
            fontWeight: props.fontWeight || '500',
            borderColor: props.borderColor,
            borderWidth: props.borderWidth ? `${props.borderWidth}px` : undefined,
            borderStyle: props.borderStyle || 'solid',
            borderRadius: props.borderRadius ? `${props.borderRadius}px` : '4px',
          }}
        >
          {props.buttonText || 'Button'}
        </button>
      </div>
    )
  }

  // Rectangle Shape
  if (widget.type === 'rectangle') {
    return (
      <div 
        className="w-full h-full"
        style={{
          backgroundColor: (props.showBackground !== false && props.backgroundColor) ? props.backgroundColor : '#e5e7eb',
          borderColor: (props.showBorder && props.borderWidth) ? (props.borderColor || '#d1d5db') : undefined,
          borderWidth: (props.showBorder && props.borderWidth) ? `${props.borderWidth}px` : '0px',
          borderStyle: (props.showBorder && props.borderWidth) ? (props.borderStyle || 'solid') : undefined,
          borderRadius: props.borderRadius ? `${props.borderRadius}px` : '0px',
        }}
      />
    )
  }

  // Circle Shape
  if (widget.type === 'circle') {
    return (
      <div 
        className="w-full h-full rounded-full"
        style={{
          backgroundColor: (props.showBackground !== false && props.backgroundColor) ? props.backgroundColor : '#e5e7eb',
          borderColor: (props.showBorder && props.borderWidth) ? (props.borderColor || '#d1d5db') : undefined,
          borderWidth: (props.showBorder && props.borderWidth) ? `${props.borderWidth}px` : '0px',
          borderStyle: (props.showBorder && props.borderWidth) ? (props.borderStyle || 'solid') : undefined,
        }}
      />
    )
  }

  // Triangle Shape
  if (widget.type === 'triangle') {
    const size = Math.min(widget.width || 200, widget.height || 200)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size / 2}px solid transparent`,
            borderRight: `${size / 2}px solid transparent`,
            borderBottom: `${size}px solid ${props.backgroundColor || '#e5e7eb'}`,
          }}
        />
      </div>
    )
  }

  // Hexagon Shape
  if (widget.type === 'hexagon') {
    const size = Math.min(widget.width || 200, widget.height || 200)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <svg width={size} height={size} viewBox="0 0 100 100">
          <polygon
            points="50,5 95,25 95,75 50,95 5,75 5,25"
            fill={props.backgroundColor || '#e5e7eb'}
            stroke={props.borderColor || '#d1d5db'}
            strokeWidth={props.borderWidth || 1}
          />
        </svg>
      </div>
    )
  }

  // Divider Widget
  if (widget.type === 'divider') {
    return (
      <div className="w-full h-full flex items-center justify-center p-2">
        <div 
          className="w-full"
          style={{
            height: props.thickness ? `${props.thickness}px` : '1px',
            backgroundColor: props.color || props.borderColor || '#e5e7eb',
          }}
        />
      </div>
    )
  }

  // Spacer Widget
  if (widget.type === 'spacer') {
    return (
      <div className="w-full h-full" style={{ backgroundColor: 'transparent' }} />
    )
  }

  // HTML Widget
  if (widget.type === 'html') {
    return (
      <div 
        className="w-full h-full overflow-auto p-2"
        style={style}
        dangerouslySetInnerHTML={{ __html: props.html || '<p>HTML content</p>' }}
      />
    )
  }

  // Container Widget
  if (widget.type === 'container') {
    return (
      <div 
        className="w-full h-full p-2"
        style={style}
      >
        {/* Container for nesting other widgets */}
        <div className="text-xs text-muted-foreground text-center">Container</div>
      </div>
    )
  }

  // Table Widget
  if (widget.type === 'table' || widget.type === 'pivot-table') {
    const showHeader = props.showHeader !== false
    const stripedRows = props.stripedRows || false
    const rows = props.rows || 3
    const columns = props.columns || 3
    
    return (
      <div className="w-full h-full overflow-auto p-2" style={style}>
        <table className="w-full border-collapse">
          {showHeader && (
            <thead>
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th 
                    key={i}
                    className="border p-1 text-xs font-semibold"
                    style={{ borderColor: props.borderColor || '#e5e7eb' }}
                  >
                    Header {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr 
                key={rowIdx}
                className={stripedRows && rowIdx % 2 === 1 ? 'bg-muted/50' : ''}
              >
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td 
                    key={colIdx}
                    className="border p-1 text-xs"
                    style={{ borderColor: props.borderColor || '#e5e7eb' }}
                  >
                    Cell {rowIdx + 1},{colIdx + 1}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Calendar Widget
  if (widget.type === 'calendar') {
    return (
      <div className="w-full h-full p-2 flex items-center justify-center" style={style}>
        <div className="flex flex-col items-center">
          <Calendar className="h-8 w-8 mb-2 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Calendar</span>
        </div>
      </div>
    )
  }

  // Map Widget
  if (widget.type === 'map') {
    return (
      <div className="w-full h-full p-2 flex items-center justify-center" style={style}>
        <div className="flex flex-col items-center">
          <Map className="h-8 w-8 mb-2 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Map</span>
        </div>
      </div>
    )
  }

  // Card Widget
  if (widget.type === 'card') {
    return (
      <div className="w-full h-full p-3 flex flex-col" style={style}>
        <h3 className="text-sm font-semibold mb-2">{props.title || 'Card Title'}</h3>
        <p className="text-xs text-muted-foreground flex-1">{props.content || 'Card content'}</p>
      </div>
    )
  }

  // Scorecard Widget
  if (widget.type === 'scorecard') {
    return (
      <div className="w-full h-full p-3 flex flex-col items-center justify-center" style={style}>
        <div className="text-2xl font-bold mb-1">{props.value || '0'}</div>
        <div className="text-xs text-muted-foreground">{props.label || 'Scorecard'}</div>
      </div>
    )
  }

  // Filter Widgets
  if (widget.type.includes('filter')) {
    const filterType = widget.type.replace('-filter', '')
    
    return (
      <div className="w-full h-full p-2 flex items-center" style={style}>
        {filterType === 'text' || filterType === 'search' ? (
          <input 
            type="text"
            placeholder={props.placeholder || 'Filter...'}
            className="w-full px-2 py-1 text-xs border-0 bg-gray-100 rounded-[4px]"
          />
        ) : filterType === 'number' ? (
          <input 
            type="number"
            placeholder={props.placeholder || 'Number...'}
            className="w-full px-2 py-1 text-xs border-0 bg-gray-100 rounded-[4px]"
          />
        ) : filterType === 'date' ? (
          <input 
            type="date"
            className="w-full px-2 py-1 text-xs border-0 bg-gray-100 rounded-[4px]"
          />
        ) : filterType === 'dropdown' ? (
          <select 
            className="w-full px-2 py-1 text-xs border-0 bg-gray-100 rounded-[4px]"
          >
            <option>Select...</option>
          </select>
        ) : filterType === 'checkbox' ? (
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-xs">{props.label || 'Checkbox'}</span>
          </div>
        ) : filterType === 'slider' || filterType === 'range' ? (
          <input 
            type="range"
            min={props.min || 0}
            max={props.max || 100}
            className="w-full"
          />
        ) : (
          <div className="text-xs text-muted-foreground w-full text-center">
            {widget.type.replace('-filter', '').replace(/-/g, ' ')}
          </div>
        )}
      </div>
    )
  }

  // Chart Widgets - Render actual chart if data is configured
  if (widget.type.includes('chart')) {
    const chartType = widget.type.replace('-chart', '')
    const hasData = chartData && Array.isArray(chartData) && chartData.length > 0
    const hasDimensions = props.dimensions && Array.isArray(props.dimensions) && props.dimensions.length > 0
    const hasMeasures = props.measures && Array.isArray(props.measures) && props.measures.length > 0
    
    // Validate data structure before rendering
    const isValidData = hasData && chartData.every((item: any) => 
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
    
    // If we have data configured, render the actual chart
    if (isValidData && hasDimensions && hasMeasures) {
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
        <div className="w-full h-full" style={style}>
          <ChartErrorBoundary>
            <ChartRenderer
              type={widget.type}
              chartType={renderChartType}
              data={chartData}
              dimensions={props.dimensions || []}
              measures={props.measures || []}
              filters={[]}
              title={props.title || ''}
              className="w-full h-full"
              config={{}}
            />
          </ChartErrorBoundary>
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

  // Default fallback
  return (
    <div className="w-full h-full flex items-center justify-center p-2" style={style}>
      <div className="text-xs text-muted-foreground text-center">
        {widget.type}
      </div>
    </div>
  )
})

