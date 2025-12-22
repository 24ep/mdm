'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Download, 
  Smartphone, 
  Globe, 
  Code, 
  Copy, 
  Check,
  FileJson,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SpacesEditorConfig } from '@/lib/space-studio-manager'
import { exportToMobileSchema, ExportResult, PartialBrandingConfig } from '@/lib/mobile-content-converter'

interface MobileExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: SpacesEditorConfig
  branding?: PartialBrandingConfig
  spaceId: string
}

export function MobileExportDialog({
  open,
  onOpenChange,
  config,
  branding,
  spaceId,
}: MobileExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'full' | 'page' | 'component'>('full')
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [outputFormat, setOutputFormat] = useState<'json'>('json')
  const [minify, setMinify] = useState(false)
  const [appName, setAppName] = useState(config?.sidebarConfig?.items?.[0]?.name || 'Mobile App')
  const [appVersion, setAppVersion] = useState('1.0.0')
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('export')

  const handleExport = async () => {
    setIsExporting(true)
    setExportResult(null)
    
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      
      const result = exportToMobileSchema(config, branding, {
        format: exportFormat,
        pageIds: exportFormat === 'page' ? selectedPages : undefined,
        outputFormat,
        minify,
        appId: `app-${spaceId}`,
        appName,
        appVersion,
        baseUrl,
      })
      
      setExportResult(result)
      
      if (result.success) {
        toast.success('Export generated successfully!')
      } else {
        toast.error(result.error || 'Export failed')
      }
    } catch (error) {
      toast.error('Failed to generate export')
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = () => {
    if (!exportResult?.data) return
    
    const content = minify 
      ? JSON.stringify(exportResult.data)
      : JSON.stringify(exportResult.data, null, 2)
    
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}-mobile-schema.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('File downloaded!')
  }

  const handleCopy = async () => {
    if (!exportResult?.data) return
    
    const content = minify 
      ? JSON.stringify(exportResult.data)
      : JSON.stringify(exportResult.data, null, 2)
    
    try {
      const { copyToClipboard } = await import('@/lib/clipboard')
      const success = await copyToClipboard(content)
      if (success) {
        setCopied(true)
        toast.success('Copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } else {
        toast.error('Failed to copy')
      }
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    )
  }

  const apiEndpoints = [
    {
      name: 'Full App Schema',
      method: 'GET',
      endpoint: `/api/mobile/content/${spaceId}`,
      description: 'Complete mobile app configuration',
    },
    {
      name: 'App Manifest',
      method: 'GET',
      endpoint: `/api/mobile/content/${spaceId}/manifest`,
      description: 'Lightweight manifest for cache validation',
    },
    {
      name: 'All Pages',
      method: 'GET',
      endpoint: `/api/mobile/content/${spaceId}/pages`,
      description: 'Paginated list of all pages',
    },
    {
      name: 'Single Page',
      method: 'GET',
      endpoint: `/api/mobile/content/${spaceId}/pages/:pageId`,
      description: 'Get a specific page schema',
    },
    {
      name: 'Assets Manifest',
      method: 'GET',
      endpoint: `/api/mobile/content/${spaceId}/assets`,
      description: 'List of assets for preloading',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Export for Mobile
          </DialogTitle>
          <DialogDescription>
            Export your page builder content as an AEM-like schema for mobile applications.
            Mobile apps can use the API endpoints or the exported JSON file.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              API Endpoints
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="flex-1 overflow-auto space-y-6 mt-4">
            {/* App Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">App Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">App Name</Label>
                  <Input
                    id="appName"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="My Mobile App"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appVersion">Version</Label>
                  <Input
                    id="appVersion"
                    value={appVersion}
                    onChange={(e) => setAppVersion(e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>
              </div>
            </div>

            {/* Export Format */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Export Format</h3>
              <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Full App Schema
                    </div>
                  </SelectItem>
                  <SelectItem value="page">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Selected Pages Only
                    </div>
                  </SelectItem>
                  <SelectItem value="component">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Components Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Selection (for page export) */}
            {exportFormat === 'page' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Select Pages</h3>
                <ScrollArea className="h-48 border rounded-md p-4">
                  <div className="space-y-2">
                    {config.pages.map((page) => (
                      <div key={page.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={page.id}
                          checked={selectedPages.includes(page.id)}
                          onCheckedChange={() => togglePageSelection(page.id)}
                        />
                        <Label 
                          htmlFor={page.id} 
                          className="flex-1 cursor-pointer flex items-center justify-between"
                        >
                          <span>{page.displayName || page.name}</span>
                          {page.isActive === false && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {selectedPages.length} page(s) selected
                </p>
              </div>
            )}

            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Options</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="minify"
                  checked={minify}
                  onCheckedChange={(v) => setMinify(v as boolean)}
                />
                <Label htmlFor="minify">Minify output (smaller file size)</Label>
              </div>
            </div>

            {/* Export Result */}
            {exportResult && (
              <div className={`p-4 rounded-md ${exportResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                {exportResult.success ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      ✓ Export generated successfully
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Size: {(exportResult.size / 1024).toFixed(2)} KB
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download JSON
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCopy}>
                        {copied ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-700 dark:text-red-300">
                    ✗ {exportResult.error}
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="api" className="flex-1 overflow-auto space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Mobile applications can fetch content dynamically using these API endpoints:
            </p>
            
            <div className="space-y-4">
              {apiEndpoints.map((api) => (
                <div key={api.endpoint} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {api.method}
                      </Badge>
                      <span className="font-medium">{api.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        window.open(api.endpoint, '_blank')
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="block text-sm bg-muted p-2 rounded font-mono">
                    {api.endpoint}
                  </code>
                  <p className="text-xs text-muted-foreground">{api.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="text-sm font-medium">Integration Example</h4>
              <pre className="text-xs overflow-x-auto p-3 bg-background rounded border">
{`// React Native / Flutter / Swift / Kotlin
const response = await fetch('${typeof window !== 'undefined' ? window.location.origin : ''}/api/mobile/content/${spaceId}');
const appSchema = await response.json();

// Check for updates
const manifest = await fetch('${typeof window !== 'undefined' ? window.location.origin : ''}/api/mobile/content/${spaceId}/manifest');
const { contentHashes } = await manifest.json();

// Compare with cached hash
if (contentHashes.combined !== cachedHash) {
  // Fetch new content
}`}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[400px] border rounded-md">
              {exportResult?.data ? (
                <pre className="text-xs p-4 font-mono">
                  {JSON.stringify(exportResult.data, null, 2)}
                </pre>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Generate an export to preview the schema</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
