'use client'

import { useState } from 'react'
import { ApiResponse } from '../types'
import { CodeEditor } from '@/components/ui/code-editor'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Download, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface ResponseViewerProps {
  response: ApiResponse
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body')

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-500'
    if (statusCode >= 300 && statusCode < 400) return 'bg-yellow-500'
    if (statusCode >= 400) return 'bg-red-500'
    return 'bg-gray-500'
  }

  const formatBody = (body: string): { formatted: string; language: string } => {
    if (!body) return { formatted: '', language: 'text' }

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(body)
      return {
        formatted: JSON.stringify(parsed, null, 2),
        language: 'json',
      }
    } catch {
      // Check if it's HTML
      if (body.trim().startsWith('<')) {
        return { formatted: body, language: 'html' }
      }
      // Check if it's XML
      if (body.trim().startsWith('<?xml') || body.trim().startsWith('<')) {
        return { formatted: body, language: 'xml' }
      }
      // Default to text
      return { formatted: body, language: 'text' }
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([response.body], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `response-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const { formatted, language } = formatBody(response.body)

  return (
    <div className="h-full flex flex-col border-t border-border">
      {/* Status Bar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/30">
        <div className="flex items-center gap-3">
          {response.error ? (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">Error</span>
            </>
          ) : (
            <>
              <div className={`w-2 h-2 rounded-full ${getStatusColor(response.statusCode)}`} />
              <span className="text-sm font-medium">
                {response.statusCode} {response.statusText}
              </span>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {response.responseTime}ms
              </Badge>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {response.error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border-b border-border">
          <p className="text-sm text-red-600 dark:text-red-400">{response.error}</p>
        </div>
      )}

      {/* Response Content */}
      {!response.error && (
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="border-b border-border">
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>

          <TabsContent value="body" className="flex-1 overflow-auto m-0">
            <div className="h-full">
              <CodeEditor
                value={formatted}
                onChange={() => {}}
                language={language}
                height="100%"
                readOnly
              />
            </div>
          </TabsContent>

          <TabsContent value="headers" className="flex-1 overflow-auto p-4 m-0">
            <div className="space-y-2">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-muted-foreground min-w-[200px]">{key}:</span>
                  <span className="flex-1 break-all">{value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

