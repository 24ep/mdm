'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Upload, FileText, FileJson, FileCode } from 'lucide-react'
import toast from 'react-hot-toast'

interface QueryExport {
  name: string
  query: string
  description?: string
  createdAt: string
  tags?: string[]
  metadata?: {
    author?: string
    version?: string
    notes?: string
  }
}

interface QueryExportImportProps {
  query: string
  queryName?: string
  isOpen: boolean
  onClose: () => void
  onImport?: (query: string, metadata?: any) => void
}

export function QueryExportImport({ query, queryName, isOpen, onClose, onImport }: QueryExportImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const exportQuery = (format: 'json' | 'sql' | 'text') => {
    if (!query.trim()) {
      toast.error('Query is empty')
      return
    }

    const exportData: QueryExport = {
      name: queryName || 'Untitled Query',
      query,
      createdAt: new Date().toISOString(),
      metadata: {
        version: '1.0',
        notes: 'Exported from BigQuery Interface'
      }
    }

    let content: string
    let filename: string
    let mimeType: string

    switch (format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2)
        filename = `${queryName || 'query'}.json`
        mimeType = 'application/json'
        break
      case 'sql':
        content = `-- ${queryName || 'Untitled Query'}\n-- Exported: ${new Date().toLocaleString()}\n\n${query}`
        filename = `${queryName || 'query'}.sql`
        mimeType = 'text/sql'
        break
      case 'text':
        content = `${queryName || 'Untitled Query'}\n\n${query}`
        filename = `${queryName || 'query'}.txt`
        mimeType = 'text/plain'
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    toast.success(`Query exported as ${format.toUpperCase()}`)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const fileExtension = file.name.split('.').pop()?.toLowerCase()

        if (fileExtension === 'json') {
          const data = JSON.parse(content) as QueryExport
          if (data.query) {
            if (onImport) {
              onImport(data.query, data.metadata)
            }
            toast.success(`Query "${data.name}" imported successfully`)
            onClose()
          } else {
            toast.error('Invalid query file format')
          }
        } else if (fileExtension === 'sql' || fileExtension === 'txt') {
          // Extract query from SQL file (skip comments)
          const lines = content.split('\n')
          const queryLines = lines.filter(line => {
            const trimmed = line.trim()
            return trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*')
          })
          const importedQuery = queryLines.join('\n').trim()
          
          if (importedQuery) {
            if (onImport) {
              onImport(importedQuery)
            }
            toast.success('Query imported successfully')
            onClose()
          } else {
            toast.error('No query found in file')
          }
        } else {
          toast.error('Unsupported file format. Use .json, .sql, or .txt')
        }
      } catch (error) {
        toast.error('Failed to import query file')
        console.error('Import error:', error)
      }
    }

    reader.readAsText(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export / Import Query</DialogTitle>
          <DialogDescription>
            Export queries to files or import queries from saved files
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Export your query in various formats for backup, sharing, or version control.
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => exportQuery('json')}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <FileJson className="h-6 w-6 text-blue-600" />
                  <span className="text-sm">JSON</span>
                  <span className="text-xs text-gray-500">With metadata</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => exportQuery('sql')}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <FileCode className="h-6 w-6 text-green-600" />
                  <span className="text-sm">SQL</span>
                  <span className="text-xs text-gray-500">SQL file</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => exportQuery('text')}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <FileText className="h-6 w-6 text-gray-600" />
                  <span className="text-sm">Text</span>
                  <span className="text-xs text-gray-500">Plain text</span>
                </Button>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>JSON format</strong> includes query, metadata, and description.
                <br />
                <strong>SQL format</strong> is a standard SQL file that can be opened in any SQL editor.
                <br />
                <strong>Text format</strong> is a simple plain text file.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Import queries from previously exported files.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.sql,.txt"
                onChange={handleImport}
                className="hidden"
              />

              <Button
                onClick={handleImportClick}
                className="w-full h-24 flex flex-col items-center justify-center gap-2"
              >
                <Upload className="h-6 w-6" />
                <span>Choose File to Import</span>
                <span className="text-xs font-normal">Supports .json, .sql, .txt files</span>
              </Button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Supported formats:</strong>
                <br />
                • JSON files exported from this interface
                <br />
                • Standard SQL files (.sql)
                <br />
                • Plain text files (.txt) containing SQL queries
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

