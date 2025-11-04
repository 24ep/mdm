import { ChartDimension } from './chartDataSourceTypes'

// Dimensions that are value/metric dimensions and require aggregation
export const VALUE_METRIC_DIMENSIONS = new Set([
  'value', 'values', 'y', // Common value/metric dimension keys
])

// Check if a dimension key is a value/metric dimension
export function isValueMetricDimension(dimKey: string): boolean {
  return VALUE_METRIC_DIMENSIONS.has(dimKey)
}

// Chart type configuration - defines what inputs each chart type needs
export const CHART_DIMENSIONS: Record<string, ChartDimension[]> = {
  'bar-chart': [
    { key: 'x', label: 'X-Axis (Category)', required: true },
    { key: 'y', label: 'Y-Axis (Value)', required: true },
    { key: 'series', label: 'Series (Optional)', required: false },
  ],
  'line-chart': [
    { key: 'x', label: 'X-Axis (Category)', required: true },
    { key: 'y', label: 'Y-Axis (Value)', required: true },
    { key: 'series', label: 'Series (Optional)', required: false },
  ],
  'area-chart': [
    { key: 'x', label: 'X-Axis (Category)', required: true },
    { key: 'y', label: 'Y-Axis (Value)', required: true },
    { key: 'series', label: 'Series (Optional)', required: false },
  ],
  'pie-chart': [
    { key: 'category', label: 'Category', required: true },
    { key: 'value', label: 'Value', required: true },
  ],
  'donut-chart': [
    { key: 'category', label: 'Category', required: true },
    { key: 'value', label: 'Value', required: true },
  ],
  'scatter-chart': [
    { key: 'x', label: 'X-Axis', required: true },
    { key: 'y', label: 'Y-Axis', required: true },
    { key: 'size', label: 'Size (Optional)', required: false },
    { key: 'color', label: 'Color (Optional)', required: false },
  ],
  'table': [
    { key: 'columns', label: 'Columns', required: true, multiple: true },
    { key: 'rows', label: 'Rows (Optional)', required: false, multiple: true },
  ],
  'pivot-table': [
    { key: 'rows', label: 'Rows', required: true, multiple: true },
    { key: 'columns', label: 'Columns', required: false, multiple: true },
    { key: 'values', label: 'Values', required: true, multiple: true },
  ],
  'radar-chart': [
    { key: 'category', label: 'Category', required: true },
    { key: 'value', label: 'Value', required: true },
  ],
  'gauge-chart': [
    { key: 'value', label: 'Value', required: true },
    { key: 'min', label: 'Min (Optional)', required: false },
    { key: 'max', label: 'Max (Optional)', required: false },
  ],
  'funnel-chart': [
    { key: 'category', label: 'Category', required: true },
    { key: 'value', label: 'Value', required: true },
  ],
  'waterfall-chart': [
    { key: 'x', label: 'X-Axis (Category)', required: true },
    { key: 'y', label: 'Y-Axis (Value)', required: true },
  ],
  'treemap-chart': [
    { key: 'category', label: 'Category', required: true },
    { key: 'value', label: 'Value', required: true },
  ],
  'heatmap-chart': [
    { key: 'x', label: 'X-Axis', required: true },
    { key: 'y', label: 'Y-Axis', required: true },
    { key: 'value', label: 'Value', required: true },
  ],
  'bubble-chart': [
    { key: 'x', label: 'X-Axis', required: true },
    { key: 'y', label: 'Y-Axis', required: true },
    { key: 'size', label: 'Size', required: true },
    { key: 'color', label: 'Color (Optional)', required: false },
  ],
  'combo-chart': [
    { key: 'x', label: 'X-Axis (Category)', required: true },
    { key: 'y', label: 'Y-Axis (Value)', required: true },
    { key: 'series', label: 'Series (Optional)', required: false },
  ],
}

