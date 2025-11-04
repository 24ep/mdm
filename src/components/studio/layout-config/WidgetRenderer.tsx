'use client'

import React, { useMemo } from 'react'
import { PlacedWidget } from './widgets'
import { BarChart3, LineChart, PieChart, AreaChart, Table as TableIcon, Image as ImageIcon, Video as VideoIcon, Type, Link2, Calendar, Map, Loader2, Target, Gauge, TrendingUp, Grid, Circle } from 'lucide-react'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { ChartErrorBoundary } from './ChartErrorBoundary'
import { useDataSource } from './useDataSource'
import { pivotTableData, getPivotCellValue, getPivotConfig } from './tablePivotUtils'
import { applyAggregations, getAggregationConfig } from './dataAggregationUtils'
import { AggregationType } from './ChartDataSourceConfig'

interface WidgetRendererProps {
  widget: PlacedWidget
  isMobile?: boolean
  spaceId?: string
}

export const WidgetRenderer = React.memo(function WidgetRenderer({ widget, isMobile = false, spaceId }: WidgetRendererProps) {
  const props = widget.properties || {}
  
  // Debug: Log when properties change (remove in production)
  // console.log('WidgetRenderer props:', props)
  
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

  // Table Widget - with Looker Studio-style pivot logic
  if (widget.type === 'table' || widget.type === 'pivot-table') {
    const showHeader = props.showHeader !== false
    const stripedRows = props.stripedRows || false
    
    // Extract dimensions from chartDimensions configuration
    const chartDimensions = props.chartDimensions as Record<string, string | string[]> | undefined
    
    // Get pivot configuration
    const pivotConfig = getPivotConfig(chartDimensions, widget.type)
    const { columnAttrs, rowAttrs, valueAttrs } = pivotConfig
    
    // Determine if we need to pivot (when columns dimension has attributes)
    const shouldPivot = columnAttrs.length > 0
    const hasRows = rowAttrs.length > 0
    const hasValues = valueAttrs.length > 0
    
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
    
    // Debug: Log current state to help diagnose issues
    if (process.env.NODE_ENV === 'development') {
      console.log('[Table Widget Debug]', {
        widgetType: widget.type,
        chartDimensions,
        columnAttrs,
        rowAttrs,
        valueAttrs,
        shouldPivot,
        chartDataLength: chartData?.length,
        hasChartData: !!chartData,
        dataSource: props.dataSource,
        dataModelId: props.dataModelId
      })
    }
    
    // Check if we have any configured attributes
    const hasAnyAttrs = columnAttrs.length > 0 || rowAttrs.length > 0 || valueAttrs.length > 0
    
    if (hasAnyAttrs && chartData && Array.isArray(chartData) && chartData.length > 0) {
      // Filter data to only include rows with selected attributes
      const filteredData = chartData.filter((row: any) => {
        if (!row || typeof row !== 'object') return false
        // Check if row has at least one of the selected attributes
        const allAttrs = [...columnAttrs, ...rowAttrs, ...valueAttrs]
        return allAttrs.some(attr => row[attr] !== undefined)
      })
      
      if (filteredData.length > 0) {
        // Pivot the data if columns are configured
        if (shouldPivot) {
          const { pivotedData, columnHeaders } = pivotTableData(filteredData, pivotConfig)
          
          if (pivotedData.length > 0 && columnHeaders.length > 0) {
            return (
              <div className="w-full h-full overflow-auto p-2" style={style}>
                <table className="w-full border-collapse">
                  {showHeader && (
                    <thead>
                      <tr>
                        {/* Row attribute columns first */}
                        {rowAttrs.map((attr, i) => (
                          <th 
                            key={`row-${i}`}
                            className="border p-1 text-xs font-semibold text-left"
                            style={{ borderColor: props.borderColor || '#e5e7eb' }}
                          >
                            {attr}
                          </th>
                        ))}
                        {/* Pivoted column headers from column attributes */}
                        {columnHeaders.map((header, i) => (
                          <th 
                            key={`col-${i}`}
                            className="border p-1 text-xs font-semibold text-left"
                            style={{ borderColor: props.borderColor || '#e5e7eb' }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {pivotedData.map((rowData: any, rowIdx: number) => (
                      <tr 
                        key={rowIdx}
                        className={stripedRows && rowIdx % 2 === 1 ? 'bg-muted/50' : ''}
                      >
                        {/* Row attribute values */}
                        {rowAttrs.map((attr, i) => (
                          <td 
                            key={`row-cell-${i}`}
                            className="border p-1 text-xs"
                            style={{ borderColor: props.borderColor || '#e5e7eb' }}
                          >
                            {rowData.__rowValues?.[attr] !== undefined && rowData.__rowValues[attr] !== null
                              ? String(rowData.__rowValues[attr])
                              : ''}
                          </td>
                        ))}
                        {/* Pivoted column cells */}
                        {columnHeaders.map((header, i) => (
                          <td 
                            key={`pivot-cell-${i}`}
                            className="border p-1 text-xs"
                            style={{ borderColor: props.borderColor || '#e5e7eb' }}
                          >
                            {hasValues && valueAttrs.length > 0
                              ? valueAttrs.map(valueAttr => getPivotCellValue(rowData, header, valueAttr, rowAttrs, columnAttrs, hasValues)).filter(Boolean).join(', ')
                              : getPivotCellValue(rowData, header, undefined, rowAttrs, columnAttrs, hasValues)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        } else {
          // Non-pivoted table: show all attributes as columns
          const allAttrs = [...rowAttrs, ...valueAttrs].filter(Boolean)
          if (allAttrs.length > 0) {
            return (
              <div className="w-full h-full overflow-auto p-2" style={style}>
                <table className="w-full border-collapse">
                  {showHeader && (
                    <thead>
                      <tr>
                        {allAttrs.map((attr, i) => (
                          <th 
                            key={i}
                            className="border p-1 text-xs font-semibold text-left"
                            style={{ borderColor: props.borderColor || '#e5e7eb' }}
                          >
                            {attr}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {filteredData.map((row: any, rowIdx: number) => (
                      <tr 
                        key={rowIdx}
                        className={stripedRows && rowIdx % 2 === 1 ? 'bg-muted/50' : ''}
                      >
                        {allAttrs.map((attr, colIdx) => {
                          const cellValue = row[attr]
                          return (
                            <td 
                              key={colIdx}
                              className="border p-1 text-xs"
                              style={{ borderColor: props.borderColor || '#e5e7eb' }}
                            >
                              {cellValue !== undefined && cellValue !== null 
                                ? String(cellValue) 
                                : ''}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        }
      }
      
      // Show table structure but no data message
      const displayColumns = shouldPivot && columnAttrs.length > 0
        ? [...rowAttrs, ...(pivotTableData(filteredData, pivotConfig).columnHeaders)]
        : [...rowAttrs, ...valueAttrs]
      
      if (displayColumns.length > 0) {
        return (
          <div className="w-full h-full overflow-auto p-2" style={style}>
            <table className="w-full border-collapse">
              {showHeader && (
                <thead>
                  <tr>
                    {displayColumns.map((colName, i) => (
                      <th 
                        key={i}
                        className="border p-1 text-xs font-semibold text-left"
                        style={{ borderColor: props.borderColor || '#e5e7eb' }}
                      >
                        {colName}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td colSpan={displayColumns.length} className="border p-4 text-xs text-center text-muted-foreground">
                    {dataLoading ? 'Loading data...' : 'No data available'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      }
    }
    
    // Show placeholder if no columns configured
    return (
      <div className="w-full h-full overflow-auto p-2" style={style}>
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <TableIcon className="h-8 w-8 mb-2" />
          <div className="text-xs text-center">
            Configure columns in data source settings
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-red-500 mt-2 text-center">
              Debug: chartDimensions = {JSON.stringify(chartDimensions)}
            </div>
          )}
        </div>
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

  // Time Series Widget - similar to line chart but specifically for time-based data
  if (widget.type === 'time-series') {
    // Use the same chart rendering logic as line-chart
    const chartType = props.chartType || 'line'
    const chartDimensions = props.chartDimensions as Record<string, string | string[]> | undefined
    let dimensions: string[] = props.dimensions || []
    let measures: string[] = props.measures || []
    
    if (chartDimensions && typeof chartDimensions === 'object') {
      dimensions = []
      measures = []
      
      // Time series typically has time/date on x-axis and values on y-axis
      const timeAttr = chartDimensions.time || chartDimensions.x || chartDimensions.date
      const valueAttrs = chartDimensions.values || chartDimensions.y || []
      
      if (timeAttr) {
        dimensions.push(...(Array.isArray(timeAttr) ? timeAttr : [timeAttr]))
      }
      
      if (Array.isArray(valueAttrs)) {
        measures.push(...valueAttrs.filter(v => v))
      } else if (valueAttrs) {
        measures.push(valueAttrs)
      }
    }
    
    const hasData = chartData && Array.isArray(chartData) && chartData.length > 0
    const hasDimensions = dimensions.length > 0
    const hasMeasures = measures.length > 0
    const isValidData = hasData && chartData.every((item: any) => typeof item === 'object' && item !== null)
    
    if (isValidData && hasDimensions && hasMeasures) {
      return (
        <div className="w-full h-full flex flex-col" style={style}>
          {(props.showHeader ?? true) && (
            <div
              className="w-full flex items-center gap-2 px-3 py-2 shrink-0"
              style={{
                background: props.headerBackgroundColor || 'transparent',
                justifyContent: (props.titleAlign || 'left') === 'center' ? 'center' : (props.titleAlign || 'left') === 'right' ? 'flex-end' : 'flex-start',
              }}
            >
              <TrendingUp className="h-3.5 w-3.5" style={{ color: props.titleColor || style.color || '#111827' }} />
              <div
                className="truncate"
                style={{
                  fontSize: props.titleFontSize ? `${props.titleFontSize}px` : undefined,
                  color: props.titleColor || style.color,
                  fontWeight: props.titleFontWeight || 600,
                }}
              >
                {props.title || 'Time Series'}
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <ChartErrorBoundary>
              <ChartRenderer
                type={widget.type}
                chartType="LINE"
                data={chartData}
                dimensions={dimensions}
                measures={measures}
                filters={[]}
                title={props.title || ''}
                className="w-full h-full"
                config={{
                  chartDimensionsEffectiveTypes: props.chartDimensionsEffectiveTypes || {},
                  legend: { show: props.showLegend, fontSize: props.legendFontSize, fontFamily: props.legendFontFamily, color: props.legendColor },
                  grid: { dash: props.gridDash, color: props.gridColor },
                  showGrid: props.showGrid,
                  xAxis: { show: props.showXAxis, title: props.xAxisLabel, titleFontSize: props.xAxisTitleFontSize, titleColor: props.xAxisTitleColor, tickFontSize: props.xAxisTickFontSize, tickColor: props.xAxisTickColor, fontFamily: props.xAxisFontFamily, showGrid: props.xAxisShowGrid },
                  yAxis: { show: props.showYAxis, title: props.yAxisLabel, titleFontSize: props.yAxisTitleFontSize, titleColor: props.yAxisTitleColor, tickFontSize: props.yAxisTickFontSize, tickColor: props.yAxisTickColor, fontFamily: props.yAxisFontFamily },
                  tooltip: { fontSize: props.tooltipFontSize, fontFamily: props.tooltipFontFamily },
                }}
              />
            </ChartErrorBoundary>
          </div>
        </div>
      )
    }
    
    return (
      <div className="w-full h-full p-3 flex flex-col items-center justify-center" style={style}>
        <TrendingUp className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mb-2 text-muted-foreground`} />
        <div className="text-xs text-muted-foreground text-center">
          {props.title || 'Time Series'}
        </div>
        {(!hasData || !hasDimensions || !hasMeasures) && (
          <div className="text-xs text-muted-foreground text-center mt-1">
            Configure data source
          </div>
        )}
      </div>
    )
  }

  // Embed Widget - similar to iframe but for embedded content
  if (widget.type === 'embed') {
    return (
      <div className="w-full h-full p-2" style={style}>
        {props.embedUrl || props.iframeUrl ? (
          <iframe 
            src={props.embedUrl || props.iframeUrl}
            className="w-full h-full border-0 rounded"
            allowFullScreen={props.allowFullscreen}
            title="Embedded Content"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ImageIcon className="h-8 w-8 mb-2" />
            <span className="text-xs">No embed URL</span>
          </div>
        )}
      </div>
    )
  }

  // Shape Widget - generic shape that can be configured
  if (widget.type === 'shape') {
    const shapeType = props.shapeType || 'rectangle'
    
    if (shapeType === 'rectangle' || !shapeType) {
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
    
    if (shapeType === 'circle') {
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
    
    if (shapeType === 'triangle') {
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
    
    if (shapeType === 'hexagon') {
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
    
    // Default to rectangle
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

  // Chart Widgets - Render actual chart using data from database based on selected attributes
  // Data flow: Database → API (/api/data-models/{id}/data) → useDataSource → chartData → ChartRenderer
  // Only selected attributes (from chartDimensions) are used for rendering
  if (widget.type.includes('chart')) {
    // Extract chart type: use chartType property if set, otherwise extract from widget.type
    const chartType = props.chartType || widget.type.replace('-chart', '')
    
    // Convert chartDimensions object to dimensions/measures arrays if chartDimensions exists
    // chartDimensions contains the selected attribute names configured by the user
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
      'table': { dimensionKeys: ['rows'], measureKeys: ['columns'] },
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
    
    // Apply aggregations to data if we have dimensions and measures
    let processedData = chartData
    if (chartDimensions && chartData && Array.isArray(chartData) && chartData.length > 0) {
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
          processedData = applyAggregations(chartData, aggConfig)
        } catch (error) {
          console.error('Error applying aggregations:', error)
          // Fall back to raw data if aggregation fails
          processedData = chartData
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
                // Legend configuration
                legend: { 
                  show: props.showLegend ?? true, 
                  fontSize: props.legendFontSize ?? 12, 
                  fontFamily: props.legendFontFamily ?? 'Roboto', 
                  color: props.legendColor ?? '#111827' 
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

  // Default fallback
  return (
    <div className="w-full h-full flex items-center justify-center p-2" style={style}>
      <div className="text-xs text-muted-foreground text-center">
        {widget.type}
      </div>
    </div>
  )
})

