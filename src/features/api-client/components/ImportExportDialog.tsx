'use client'

import { useState } from 'react'
import { ApiCollection, ApiRequest, ApiEnvironment } from '../types'
import { exportCollection, importCollection, requestToCurl, curlToRequest, exportEnvironment } from '../lib/import-export'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CodeEditor } from '@/components/ui/code-editor'
import { Download, Upload, FileText } from 'lucide-react'

interface ImportExportDialogProps {
  collection?: ApiCollection
  request?: ApiRequest
  environment?: ApiEnvironment
  environmentVariables?: Array<{ key: string; value: string }>
  onImport?: (collection: ApiCollection) => void
}

export function ImportExportDialog({
  collection,
  request,
  environment,
  environmentVariables = [],
  onImport,
}: ImportExportDialogProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportData, setExportData] = useState('')
  const [importData, setImportData] = useState('')
  const [open, setOpen] = useState(false)

  const handleExport = () => {
    if (collection) {
      const exported = exportCollection(collection)
      setExportData(exported)
      setActiveTab('export')
    } else if (request) {
      const curl = requestToCurl(request, environmentVariables)
      setExportData(curl)
      setActiveTab('export')
    } else if (environment) {
      const exported = exportEnvironment(environment)
      setExportData(exported)
      setActiveTab('export')
    }
  }

  const handleImport = () => {
    try {
      if (collection) {
        const imported = importCollection(importData)
        onImport?.(imported)
        setOpen(false)
      }
    } catch (error) {
      alert('Failed to import: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = collection
      ? `${collection.name || 'collection'}.json`
      : request
      ? `${request.name || 'request'}.curl`
      : `${environment?.name || 'environment'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileText className="h-4 w-4 mr-2" />
          {collection || environment ? 'Export' : 'Import/Export'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {collection ? 'Export Collection' : request ? 'Export as cURL' : environment ? 'Export Environment' : 'Import/Export'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="export">Export</TabsTrigger>
            {collection && <TabsTrigger value="import">Import</TabsTrigger>}
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <CodeEditor
              value={exportData}
              onChange={setExportData}
              language={request ? 'bash' : 'json'}
              height="400px"
            />
          </TabsContent>

          {collection && (
            <TabsContent value="import" className="space-y-4">
              <CodeEditor
                value={importData}
                onChange={setImportData}
                language="json"
                height="400px"
                placeholder="Paste collection JSON here..."
              />
              <div className="flex justify-end">
                <Button onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

