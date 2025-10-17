'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Layout, 
  History, 
  Palette, 
  Eye, 
  Settings,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Save,
  Trash2,
  Edit,
  Play,
  Pause,
  Filter,
  Search,
  X
} from 'lucide-react'

interface SecondaryContentProps {
  activeTab: string
  onClose: () => void
  onTabChange: (tab: string) => void
  onAction?: (action: string, data?: any) => void
}

export function SecondaryContent({ activeTab, onClose, onTabChange, onAction }: SecondaryContentProps) {
  const renderChartsContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Chart Management</h3>
        <Button size="sm" onClick={() => onAction?.('add-chart')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Chart
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chart Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {['Bar Chart', 'Line Chart', 'Pie Chart', 'Area Chart', 'Scatter Plot', 'Gauge'].map((chart) => (
              <Button 
                key={chart} 
                variant="outline" 
                size="sm" 
                className="h-auto p-3"
                onClick={() => onAction?.('add-chart-type', { type: chart })}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {chart}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Sales Database</span>
              <Badge variant="outline">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Marketing API</span>
              <Badge variant="outline">Active</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onAction?.('add-data-source')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTemplatesContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dashboard Templates</h3>
        <Button size="sm" onClick={() => onAction?.('import-template')}>
          <Download className="h-4 w-4 mr-2" />
          Import
        </Button>
      </div>
      
      <Tabs defaultValue="prebuilt" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prebuilt">Pre-built</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prebuilt" className="space-y-3">
          {['Sales Dashboard', 'Marketing Analytics', 'Financial Overview', 'HR Dashboard'].map((template) => (
            <Card key={template} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{template}</h4>
                    <p className="text-sm text-muted-foreground">Pre-built template</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAction?.('use-template', { name: template })}
                  >
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-3">
          <div className="text-center py-8 text-muted-foreground">
            <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No custom templates</p>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderVersionsContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Version History</h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Save Version
        </Button>
      </div>
      
      <div className="space-y-2">
        {[
          { name: 'Current Version', date: '2 minutes ago', author: 'You', isCurrent: true },
          { name: 'Added new charts', date: '1 hour ago', author: 'John Doe', isCurrent: false },
          { name: 'Updated styling', date: '2 hours ago', author: 'Jane Smith', isCurrent: false },
          { name: 'Initial version', date: 'Yesterday', author: 'You', isCurrent: false }
        ].map((version, index) => (
          <Card key={index} className={`cursor-pointer hover:shadow-md transition-shadow ${
            version.isCurrent ? 'border-primary bg-primary/5' : ''
          }`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-sm">{version.name}</h4>
                    {version.isCurrent && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {version.date} • {version.author}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost">
                    <Eye className="h-3 w-3" />
                  </Button>
                  {!version.isCurrent && (
                    <Button size="sm" variant="ghost">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderStylingContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Styling & Themes</h3>
        <Button size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import Theme
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <h4 className="font-medium">Light Theme</h4>
              <p className="text-sm text-muted-foreground">Default light theme</p>
            </div>
            <Button size="sm" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Themes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['Light Theme', 'Dark Theme', 'Corporate Theme', 'Colorful Theme'].map((theme) => (
              <div key={theme} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{theme}</span>
                <Button size="sm" variant="outline">
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom Styling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" size="sm" className="w-full">
              <Palette className="h-4 w-4 mr-2" />
              Color Palette
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Typography
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              <Layout className="h-4 w-4 mr-2" />
              Layout Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderDataPreviewContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Data Preview</h3>
        <Button size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded">
              <div>
                <h4 className="font-medium text-sm">Sales Database</h4>
                <p className="text-xs text-muted-foreground">1,234 records</p>
              </div>
              <Badge variant="outline" className="text-green-600">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <div>
                <h4 className="font-medium text-sm">Marketing API</h4>
                <p className="text-xs text-muted-foreground">567 records</p>
              </div>
              <Badge variant="outline" className="text-green-600">Connected</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Schema Validation</span>
              <Badge variant="outline" className="text-green-600">Passed</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Data Quality</span>
              <Badge variant="outline" className="text-green-600">Good</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Performance</span>
              <Badge variant="outline" className="text-yellow-600">Slow</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-mono bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
            <div>Date: 2024-01-01, Sales: 1500, Region: North</div>
            <div>Date: 2024-01-02, Sales: 2300, Region: South</div>
            <div>Date: 2024-01-03, Sales: 1800, Region: East</div>
            <div>Date: 2024-01-04, Sales: 2100, Region: West</div>
            <div>Date: 2024-01-05, Sales: 1900, Region: North</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSettingsContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dashboard Settings</h3>
        <Button size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Auto-save</span>
            <Button size="sm" variant="outline">Enabled</Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Grid snapping</span>
            <Button size="sm" variant="outline">Enabled</Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Pixel mode</span>
            <Button size="sm" variant="outline">Disabled</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Data refresh interval</span>
            <Button size="sm" variant="outline">30s</Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Cache enabled</span>
            <Button size="sm" variant="outline">Yes</Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Real-time updates</span>
            <Button size="sm" variant="outline">Enabled</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Collaboration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Comments enabled</span>
            <Button size="sm" variant="outline">Yes</Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Version control</span>
            <Button size="sm" variant="outline">Enabled</Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Sharing</span>
            <Button size="sm" variant="outline">Private</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'charts':
        return renderChartsContent()
      case 'templates':
        return renderTemplatesContent()
      case 'versions':
        return renderVersionsContent()
      case 'styling':
        return renderStylingContent()
      case 'data':
        return renderDataPreviewContent()
      case 'settings':
        return renderSettingsContent()
      default:
        return <div>Select a tool from the menu</div>
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex">
      <div className="bg-white w-96 h-full shadow-xl flex flex-col ml-80">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold capitalize">{activeTab} Tools</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </div>
      </div>

      {/* Overlay to close */}
      <div className="flex-1" onClick={onClose} />
    </div>
  )
}
