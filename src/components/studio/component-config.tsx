'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ColorPicker } from '@/components/ui/color-swatch'
import { 
  Database, 
  Palette, 
  Settings, 
  Filter,
  BarChart3,
  Table,
  Image,
  Calendar,
  Map,
  User,
  FileText,
  Search,
  Bell,
  Building,
  Package,
  ShoppingCart,
  Play,
  Activity,
  TrendingUp,
  PieChart,
  FileSpreadsheet
} from 'lucide-react'
import { RecordConfig } from './record-config'

interface PageComponent {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  config: any
  style: any
}

interface ComponentConfigProps {
  component: PageComponent
  onUpdate: (component: PageComponent) => void
}

const componentIcons: Record<string, any> = {
  chart: BarChart3,
  table: Table,
  metric: BarChart3,
  grid: Table,
  form: FileText,
  filter: Filter,
  search: Search,
  card: FileText,
  accordion: FileText,
  tabs: FileText,
  image: Image,
  video: Play,
  text: FileText,
  map: Map,
  location: Map,
  calendar: Calendar,
  timeline: Activity,
  profile: User,
  comments: FileText,
  notifications: Bell,
  company: Building,
  product: Package,
  order: ShoppingCart
}

export function ComponentConfig({ component, onUpdate }: ComponentConfigProps) {
  const [config, setConfig] = useState(component.config || {})
  const [style, setStyle] = useState(component.style || {})
  const [customCSS, setCustomCSS] = useState('')

  const IconComponent = componentIcons[component.type] || Settings

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onUpdate({ ...component, config: newConfig })
  }

  const handleStyleUpdate = (key: string, value: any) => {
    const newStyle = { ...style, [key]: value }
    setStyle(newStyle)
    onUpdate({ ...component, style: newStyle })
  }

  const handleCustomCSSUpdate = (css: string) => {
    setCustomCSS(css)
    // Apply custom CSS to component
    const newStyle = { ...style, customCSS: css }
    setStyle(newStyle)
    onUpdate({ ...component, style: newStyle })
  }

  const renderDataSourceConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="data-source">Data Source</Label>
          <Select 
            value={config.dataSource || 'none'} 
            onValueChange={(value) => handleConfigUpdate('dataSource', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select data source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Data Source</SelectItem>
              <SelectItem value="api">API Endpoint</SelectItem>
              <SelectItem value="database">Database Query</SelectItem>
              <SelectItem value="static">Static Data</SelectItem>
              <SelectItem value="file">File Upload</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.dataSource === 'api' && (
          <div>
            <Label htmlFor="api-url">API URL</Label>
            <Input
              id="api-url"
              value={config.apiUrl || ''}
              onChange={(e) => handleConfigUpdate('apiUrl', e.target.value)}
              placeholder="https://api.example.com/data"
            />
          </div>
        )}

        {config.dataSource === 'database' && (
          <div>
            <Label htmlFor="db-query">Database Query</Label>
            <Textarea
              id="db-query"
              value={config.dbQuery || ''}
              onChange={(e) => handleConfigUpdate('dbQuery', e.target.value)}
              placeholder="SELECT * FROM table_name"
              rows={3}
            />
          </div>
        )}

        <div>
          <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
          <Input
            id="refresh-interval"
            type="number"
            value={config.refreshInterval || 0}
            onChange={(e) => handleConfigUpdate('refreshInterval', parseInt(e.target.value) || 0)}
            placeholder="0 for no auto-refresh"
          />
        </div>

        {/* Filters */}
        <div>
          <Label>Filters</Label>
          <div className="space-y-2">
            {config.filters?.map((filter: any, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={filter.field}
                  onChange={(e) => {
                    const newFilters = [...(config.filters || [])]
                    newFilters[index] = { ...filter, field: e.target.value }
                    handleConfigUpdate('filters', newFilters)
                  }}
                  placeholder="Field name"
                />
                <Select
                  value={filter.operator}
                  onValueChange={(value) => {
                    const newFilters = [...(config.filters || [])]
                    newFilters[index] = { ...filter, operator: value }
                    handleConfigUpdate('filters', newFilters)
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater">Greater</SelectItem>
                    <SelectItem value="less">Less</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={filter.value}
                  onChange={(e) => {
                    const newFilters = [...(config.filters || [])]
                    newFilters[index] = { ...filter, value: e.target.value }
                    handleConfigUpdate('filters', newFilters)
                  }}
                  placeholder="Value"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newFilters = (config.filters || []).filter((_: any, i: number) => i !== index)
                    handleConfigUpdate('filters', newFilters)
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newFilters = [...(config.filters || []), { field: '', operator: 'equals', value: '' }]
                handleConfigUpdate('filters', newFilters)
              }}
            >
              Add Filter
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderGeneralConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="component-title">Title</Label>
          <Input
            id="component-title"
            value={config.title || ''}
            onChange={(e) => handleConfigUpdate('title', e.target.value)}
            placeholder="Component title"
          />
        </div>

        <div>
          <Label htmlFor="component-description">Description</Label>
          <Textarea
            id="component-description"
            value={config.description || ''}
            onChange={(e) => handleConfigUpdate('description', e.target.value)}
            placeholder="Component description"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="component-width">Width (px)</Label>
          <Input
            id="component-width"
            type="number"
            value={component.width}
            onChange={(e) => onUpdate({ ...component, width: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="component-height">Height (px)</Label>
          <Input
            id="component-height"
            type="number"
            value={component.height}
            onChange={(e) => onUpdate({ ...component, height: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="component-visible"
            checked={config.visible !== false}
            onCheckedChange={(checked) => handleConfigUpdate('visible', checked)}
          />
          <Label htmlFor="component-visible">Visible</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="component-loading"
            checked={config.showLoading || false}
            onCheckedChange={(checked) => handleConfigUpdate('showLoading', checked)}
          />
          <Label htmlFor="component-loading">Show Loading State</Label>
        </div>

        {/* Component-specific configurations */}
        {component.type === 'chart' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="chart-type">Chart Type</Label>
              <Select 
                value={config.chartType || 'line'} 
                onValueChange={(value) => handleConfigUpdate('chartType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="x-axis">X-Axis Field</Label>
              <Input
                id="x-axis"
                value={config.xAxis || ''}
                onChange={(e) => handleConfigUpdate('xAxis', e.target.value)}
                placeholder="Field name for X-axis"
              />
            </div>
            <div>
              <Label htmlFor="y-axis">Y-Axis Field</Label>
              <Input
                id="y-axis"
                value={config.yAxis || ''}
                onChange={(e) => handleConfigUpdate('yAxis', e.target.value)}
                placeholder="Field name for Y-axis"
              />
            </div>
          </div>
        )}

        {component.type === 'table' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="page-size">Page Size</Label>
              <Input
                id="page-size"
                type="number"
                value={config.pageSize || 10}
                onChange={(e) => handleConfigUpdate('pageSize', parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="table-sortable"
                checked={config.sortable !== false}
                onCheckedChange={(checked) => handleConfigUpdate('sortable', checked)}
              />
              <Label htmlFor="table-sortable">Sortable Columns</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="table-filterable"
                checked={config.filterable || false}
                onCheckedChange={(checked) => handleConfigUpdate('filterable', checked)}
              />
              <Label htmlFor="table-filterable">Filterable</Label>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderStyleConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="background-color">Background Color</Label>
          <ColorPicker
            value={style.backgroundColor || '#ffffff'}
            onChange={(value) => handleStyleUpdate('backgroundColor', value)}
          />
        </div>

        <div>
          <Label htmlFor="text-color">Text Color</Label>
          <ColorPicker
            value={style.color || '#000000'}
            onChange={(value) => handleStyleUpdate('color', value)}
          />
        </div>

        <div>
          <Label htmlFor="border-color">Border Color</Label>
          <ColorPicker
            value={style.borderColor || '#e5e7eb'}
            onChange={(value) => handleStyleUpdate('borderColor', value)}
          />
        </div>

        <div>
          <Label htmlFor="border-width">Border Width (px)</Label>
          <Input
            id="border-width"
            type="number"
            value={parseInt(style.borderWidth) || 1}
            onChange={(e) => handleStyleUpdate('borderWidth', `${e.target.value}px`)}
          />
        </div>

        <div>
          <Label htmlFor="border-radius">Border Radius (px)</Label>
          <Input
            id="border-radius"
            type="number"
            value={parseInt(style.borderRadius) || 0}
            onChange={(e) => handleStyleUpdate('borderRadius', `${e.target.value}px`)}
          />
        </div>

        <div>
          <Label htmlFor="padding">Padding (px)</Label>
          <Input
            id="padding"
            type="number"
            value={parseInt(style.padding) || 16}
            onChange={(e) => handleStyleUpdate('padding', `${e.target.value}px`)}
          />
        </div>

        <div>
          <Label htmlFor="font-size">Font Size (px)</Label>
          <Input
            id="font-size"
            type="number"
            value={parseInt(style.fontSize) || 14}
            onChange={(e) => handleStyleUpdate('fontSize', `${e.target.value}px`)}
          />
        </div>

        <div>
          <Label htmlFor="font-weight">Font Weight</Label>
          <Select 
            value={style.fontWeight || 'normal'} 
            onValueChange={(value) => handleStyleUpdate('fontWeight', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="lighter">Lighter</SelectItem>
              <SelectItem value="bolder">Bolder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="custom-css">Custom CSS</Label>
          <Textarea
            id="custom-css"
            value={customCSS}
            onChange={(e) => handleCustomCSSUpdate(e.target.value)}
            placeholder="/* Custom CSS styles */"
            rows={6}
            className="font-mono text-sm"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <IconComponent className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Component Configuration</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure data source, appearance, and behavior
        </p>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Records
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Style
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Source Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {renderDataSourceConfig()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <RecordConfig
            component={component}
            onUpdate={onUpdate}
          />
        </TabsContent>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">General Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {renderGeneralConfig()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Style Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {renderStyleConfig()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
