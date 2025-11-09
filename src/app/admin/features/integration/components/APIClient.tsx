'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Send,
  Plus,
  Save,
  History,
  Folder,
  Settings,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Key,
  FileText,
  Code,
  Play,
  RefreshCw,
  Download,
  Upload,
  FileCode,
  TestTube,
  Zap,
  Layers,
  CheckSquare
} from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import toast from 'react-hot-toast'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import 'highlight.js/styles/github-dark.css'
import { useThemeSafe } from '@/hooks/use-theme-safe'
import {
  HTTPMethod,
  AuthType,
  HTTPHeader,
  AuthConfig,
  RequestBody,
  APIRequest,
  APIResponse,
  RequestHistory,
  RequestCollection,
  Environment,
  APITest,
  APITemplate
} from '../types'

export function APIClient() {
  const { isDark, mounted } = useThemeSafe()
  const [currentRequest, setCurrentRequest] = useState<APIRequest>({
    id: 'new',
    name: 'New Request',
    method: 'GET',
    url: '',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    body: { type: 'none' },
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const [authConfig, setAuthConfig] = useState<AuthConfig>({ type: 'none' })
  const [response, setResponse] = useState<APIResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<RequestHistory[]>([])
  const [collections, setCollections] = useState<RequestCollection[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showHeaders, setShowHeaders] = useState(true)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveCollectionId, setSaveCollectionId] = useState<string | null>(null)
  const [preRequestScript, setPreRequestScript] = useState('')
  const [tests, setTests] = useState<APITest[]>([])
  const [requestMode, setRequestMode] = useState<'rest' | 'graphql'>('rest')
  const [graphqlQuery, setGraphqlQuery] = useState('')
  const [graphqlVariables, setGraphqlVariables] = useState('')
  const [templates, setTemplates] = useState<APITemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [testResults, setTestResults] = useState<Array<{ name: string; passed: boolean; error?: string }>>([])

  useEffect(() => {
    loadHistory()
    loadCollections()
    loadEnvironments()
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/api-client/templates?public=true')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        })))
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/admin/api-client/history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp),
          request: { ...h.request, createdAt: new Date(h.request.createdAt), updatedAt: new Date(h.request.updatedAt) }
        })))
      }
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/admin/api-client/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          requests: c.requests.map((r: any) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt)
          }))
        })))
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    }
  }

  const loadEnvironments = async () => {
    try {
      const response = await fetch('/api/admin/api-client/environments')
      if (response.ok) {
        const data = await response.json()
        setEnvironments(data.environments.map((e: any) => ({
          ...e,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt)
        })))
      }
    } catch (error) {
      console.error('Error loading environments:', error)
    }
  }

  const replaceVariables = (text: string): string => {
    if (!selectedEnvironment) return text
    const env = environments.find(e => e.id === selectedEnvironment)
    if (!env) return text

    let result = text
    env.variables.forEach(variable => {
      if (variable.enabled) {
        const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g')
        result = result.replace(regex, variable.value)
      }
    })
    return result
  }

  const executeRequest = async () => {
    if (!currentRequest.url) {
      toast.error('Please enter a URL')
      return
    }

    setIsLoading(true)
    setResponse(null)

    try {
      const url = replaceVariables(currentRequest.url)
      const headers: Record<string, string> = {}

      // Add headers
      currentRequest.headers
        .filter(h => h.enabled && h.key)
        .forEach(h => {
          headers[h.key] = replaceVariables(h.value)
        })

      // Add auth headers
      if (authConfig.type === 'bearer' && authConfig.bearerToken) {
        headers['Authorization'] = `Bearer ${replaceVariables(authConfig.bearerToken)}`
      } else if (authConfig.type === 'basic' && authConfig.basicUsername && authConfig.basicPassword) {
        const credentials = btoa(`${replaceVariables(authConfig.basicUsername)}:${replaceVariables(authConfig.basicPassword)}`)
        headers['Authorization'] = `Basic ${credentials}`
      } else if (authConfig.type === 'apikey' && authConfig.apiKeyName && authConfig.apiKeyValue) {
        if (authConfig.apiKeyLocation === 'header') {
          headers[authConfig.apiKeyName] = replaceVariables(authConfig.apiKeyValue)
        }
      }

      // Build body
      let body: string | undefined
      if (currentRequest.body) {
        if (currentRequest.body.type === 'json' && currentRequest.body.json) {
          body = replaceVariables(currentRequest.body.json)
          headers['Content-Type'] = 'application/json'
        } else if (currentRequest.body.type === 'raw' && currentRequest.body.raw) {
          body = replaceVariables(currentRequest.body.raw)
        } else if (currentRequest.body.type === 'x-www-form-urlencoded' && currentRequest.body.urlEncoded) {
          const params = new URLSearchParams()
          currentRequest.body.urlEncoded
            .filter(p => p.enabled && p.key)
            .forEach(p => {
              params.append(p.key, replaceVariables(p.value))
            })
          body = params.toString()
          headers['Content-Type'] = 'application/x-www-form-urlencoded'
        }
      }

      const startTime = Date.now()
      // Get environment variables
      const envVars: Record<string, string> = {}
      if (selectedEnvironment) {
        const env = environments.find(e => e.id === selectedEnvironment)
        if (env) {
          env.variables.forEach(v => {
            if (v.enabled) {
              envVars[v.key] = v.value
            }
          })
        }
      }

      const endpoint = requestMode === 'graphql' 
        ? '/api/admin/api-client/graphql'
        : '/api/admin/api-client/execute'

      const requestBody = requestMode === 'graphql'
        ? {
            url,
            query: graphqlQuery,
            variables: graphqlVariables,
            headers
          }
        : {
            method: currentRequest.method,
            url,
            headers,
            body,
            preRequestScript,
            tests,
            environment: envVars
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      const endTime = Date.now()

      if (data.error) {
        setResponse({
          status: 0,
          statusText: 'Error',
          headers: {},
          body: data.error,
          size: 0,
          time: endTime - startTime,
          timestamp: new Date()
        })
      } else {
        const responseData = data.response || data
        setResponse({
          ...responseData,
          testResults: data.testResults
        })
        setTestResults(data.testResults || [])
        
        // Save to history
        const historyItem: RequestHistory = {
          id: Date.now().toString(),
          requestId: currentRequest.id,
          request: {
            ...currentRequest,
            preRequestScript,
            tests
          },
          response: responseData,
          timestamp: new Date()
        }
        setHistory(prev => [historyItem, ...prev])
        
        // Save to backend
        await fetch('/api/admin/api-client/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...historyItem,
            testResults: data.testResults
          })
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: errorMessage,
        size: 0,
        time: 0,
        timestamp: new Date()
      })
      toast.error('Request failed: ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const addHeader = () => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '', enabled: true }]
    }))
  }

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: prev.headers.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      )
    }))
  }

  const removeHeader = (index: number) => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }))
  }

  const formatResponseBody = (body: string): string => {
    try {
      const parsed = JSON.parse(body)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return body
    }
  }

  const highlightCode = (code: string, language: string = 'json'): string => {
    try {
      const highlighted = hljs.highlight(code, { language })
      return highlighted.value
    } catch {
      return code
    }
  }

  const detectContentType = (body: string, headers: Record<string, string>): string => {
    const contentType = headers['content-type'] || headers['Content-Type'] || ''
    
    if (contentType.includes('json')) return 'json'
    if (contentType.includes('xml')) return 'xml'
    if (contentType.includes('html')) return 'html'
    if (contentType.includes('javascript')) return 'javascript'
    
    try {
      JSON.parse(body)
      return 'json'
    } catch {
      return 'plaintext'
    }
  }

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response.body)
      toast.success('Response copied to clipboard')
    }
  }

  const saveRequest = async () => {
    if (!currentRequest.name || currentRequest.name === 'New Request') {
      toast.error('Please enter a request name')
      return
    }

    try {
      const requestToSave: APIRequest = {
        ...currentRequest,
        id: currentRequest.id === 'new' ? Date.now().toString() : currentRequest.id,
        auth: authConfig,
        preRequestScript,
        tests,
        updatedAt: new Date()
      }

      if (saveCollectionId) {
        // Add to existing collection
        const response = await fetch(`/api/admin/api-client/collections/${saveCollectionId}/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestToSave)
        })

        if (response.ok) {
          toast.success('Request saved to collection')
          setShowSaveDialog(false)
          setSaveCollectionId(null)
          loadCollections()
        } else {
          toast.error('Failed to save request')
        }
      } else {
        // Create new collection
        const response = await fetch('/api/admin/api-client/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentRequest.name + ' Collection',
            requests: [requestToSave]
          })
        })

        if (response.ok) {
          toast.success('Request saved to new collection')
          setShowSaveDialog(false)
          setSaveCollectionId(null)
          loadCollections()
        } else {
          toast.error('Failed to save request')
        }
      }
    } catch (error) {
      console.error('Error saving request:', error)
      toast.error('Failed to save request')
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500'
    if (status >= 300 && status < 400) return 'text-yellow-500'
    if (status >= 400) return 'text-red-500'
    return 'text-gray-500'
  }

  const exportCollection = async () => {
    try {
      const collectionIds = selectedCollection ? [selectedCollection] : collections.map(c => c.id)
      const response = await fetch('/api/admin/api-client/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionIds })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'postman-collection.json'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Collection exported successfully')
      } else {
        toast.error('Failed to export collection')
      }
    } catch (error) {
      console.error('Error exporting collection:', error)
      toast.error('Failed to export collection')
    }
  }

  const importCollection = async (file: File) => {
    try {
      const text = await file.text()
      const postmanCollection = JSON.parse(text)

      const response = await fetch('/api/admin/api-client/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postmanCollection)
      })

      if (response.ok) {
        toast.success('Collection imported successfully')
        loadCollections()
        setShowImportDialog(false)
      } else {
        toast.error('Failed to import collection')
      }
    } catch (error) {
      console.error('Error importing collection:', error)
      toast.error('Failed to import collection')
    }
  }

  const useTemplate = async (template: APITemplate) => {
    try {
      // Update usage count
      await fetch(`/api/admin/api-client/templates/${template.id}/use`, {
        method: 'POST'
      })

      // Load template into current request
      setCurrentRequest({
        id: 'new',
        name: template.name,
        method: (template.method as HTTPMethod) || 'GET',
        url: template.url || '',
        headers: (template.headers as HTTPHeader[]) || [],
        body: template.body,
        description: template.description,
        tags: template.tags,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      if (template.auth) setAuthConfig(template.auth)
      if (template.preRequestScript) setPreRequestScript(template.preRequestScript)
      if (template.tests) setTests(template.tests)
      setShowTemplates(false)
      toast.success('Template loaded')
    } catch (error) {
      console.error('Error using template:', error)
      toast.error('Failed to load template')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            API Client
          </h2>
          <p className="text-muted-foreground">
            Test and debug APIs with a Postman-like interface
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedEnvironment || '__none__'} onValueChange={(value) => setSelectedEnvironment(value === '__none__' ? null : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No Environment</SelectItem>
              {environments.map(env => (
                <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Builder */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Request</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Request Name"
                    value={currentRequest.name}
                    onChange={(e) => setCurrentRequest(prev => ({ ...prev, name: e.target.value }))}
                    className="w-[200px]"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Request Mode Toggle */}
              <div className="flex items-center gap-2">
                <Label>Mode:</Label>
                <Select value={requestMode} onValueChange={(value: 'rest' | 'graphql') => setRequestMode(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rest">REST</SelectItem>
                    <SelectItem value="graphql">GraphQL</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
                  <Layers className="h-4 w-4 mr-2" />
                  Templates
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={exportCollection}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Method and URL */}
              <div className="flex gap-2">
                {requestMode === 'rest' && (
                  <Select
                    value={currentRequest.method}
                    onValueChange={(value: HTTPMethod) =>
                      setCurrentRequest(prev => ({ ...prev, method: value }))
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Input
                  placeholder={requestMode === 'graphql' ? "https://api.example.com/graphql" : "https://api.example.com/endpoint"}
                  value={currentRequest.url}
                  onChange={(e) =>
                    setCurrentRequest(prev => ({ ...prev, url: e.target.value }))
                  }
                  className="flex-1"
                />
                <Button onClick={executeRequest} disabled={isLoading}>
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* GraphQL Query Editor */}
              {requestMode === 'graphql' && (
                <div className="border rounded p-4 space-y-4">
                  <div>
                    <Label>GraphQL Query</Label>
                    <div className="border rounded mt-2">
                      <CodeMirror
                        value={graphqlQuery}
                        onChange={setGraphqlQuery}
                        height="300px"
                        theme={isDark ? oneDark : undefined}
                        extensions={[
                          javascript(),
                          EditorView.lineWrapping,
                          syntaxHighlighting(HighlightStyle.define([
                            { tag: tags.keyword, color: '#0077aa' },
                            { tag: tags.string, color: '#669900' },
                            { tag: tags.comment, color: '#999988', fontStyle: 'italic' },
                          ]))
                        ]}
                        placeholder="query {
  user(id: 1) {
    name
    email
  }
}"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Variables (JSON)</Label>
                    <div className="border rounded mt-2">
                      <CodeMirror
                        value={graphqlVariables}
                        onChange={setGraphqlVariables}
                        height="150px"
                        theme={isDark ? oneDark : undefined}
                        extensions={[
                          javascript(),
                          EditorView.lineWrapping,
                          syntaxHighlighting(HighlightStyle.define([
                            { tag: tags.keyword, color: '#0077aa' },
                            { tag: tags.string, color: '#669900' },
                          ]))
                        ]}
                        placeholder='{
  "id": 1
}'
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs for Params, Headers, Body, Auth, Scripts, Tests */}
              <Tabs defaultValue="headers">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="params">Params</TabsTrigger>
                  <TabsTrigger value="headers">
                    Headers
                    <Badge variant="secondary" className="ml-2">
                      {currentRequest.headers.filter(h => h.enabled).length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="auth">Auth</TabsTrigger>
                  <TabsTrigger value="pre-request">
                    <Zap className="h-4 w-4 mr-2" />
                    Pre-request
                  </TabsTrigger>
                  <TabsTrigger value="tests">
                    <TestTube className="h-4 w-4 mr-2" />
                    Tests
                    {tests.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {tests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="headers" className="space-y-2">
                  <div className="space-y-2">
                    {currentRequest.headers.map((header, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Key"
                          value={header.key}
                          onChange={(e) => updateHeader(index, 'key', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Value"
                          value={header.value}
                          onChange={(e) => updateHeader(index, 'value', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateHeader(index, 'enabled', !header.enabled)}
                        >
                          {header.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeHeader(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addHeader}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Header
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="body" className="space-y-2">
                  <Select
                    value={currentRequest.body?.type || 'none'}
                    onValueChange={(value) =>
                      setCurrentRequest(prev => ({
                        ...prev,
                        body: { ...prev.body!, type: value as any }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="raw">Raw</SelectItem>
                      <SelectItem value="x-www-form-urlencoded">x-www-form-urlencoded</SelectItem>
                    </SelectContent>
                  </Select>
                  {currentRequest.body?.type === 'json' && (
                    <Textarea
                      placeholder='{"key": "value"}'
                      value={currentRequest.body.json || ''}
                      onChange={(e) =>
                        setCurrentRequest(prev => ({
                          ...prev,
                          body: { ...prev.body!, json: e.target.value }
                        }))
                      }
                      className="font-mono text-sm"
                      rows={10}
                    />
                  )}
                  {currentRequest.body?.type === 'raw' && (
                    <Textarea
                      placeholder="Raw body content"
                      value={currentRequest.body.raw || ''}
                      onChange={(e) =>
                        setCurrentRequest(prev => ({
                          ...prev,
                          body: { ...prev.body!, raw: e.target.value }
                        }))
                      }
                      className="font-mono text-sm"
                      rows={10}
                    />
                  )}
                </TabsContent>

                <TabsContent value="auth" className="space-y-4">
                  <Select
                    value={authConfig.type}
                    onValueChange={(value: AuthType) =>
                      setAuthConfig(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Auth</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="apikey">API Key</SelectItem>
                    </SelectContent>
                  </Select>

                  {authConfig.type === 'bearer' && (
                    <div>
                      <Label>Bearer Token</Label>
                      <Input
                        type="password"
                        value={authConfig.bearerToken || ''}
                        onChange={(e) =>
                          setAuthConfig(prev => ({ ...prev, bearerToken: e.target.value }))
                        }
                        placeholder="Enter bearer token"
                      />
                    </div>
                  )}

                  {authConfig.type === 'basic' && (
                    <div className="space-y-2">
                      <div>
                        <Label>Username</Label>
                        <Input
                          value={authConfig.basicUsername || ''}
                          onChange={(e) =>
                            setAuthConfig(prev => ({ ...prev, basicUsername: e.target.value }))
                          }
                          placeholder="Username"
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={authConfig.basicPassword || ''}
                          onChange={(e) =>
                            setAuthConfig(prev => ({ ...prev, basicPassword: e.target.value }))
                          }
                          placeholder="Password"
                        />
                      </div>
                    </div>
                  )}

                  {authConfig.type === 'apikey' && (
                    <div className="space-y-2">
                      <div>
                        <Label>Key Name</Label>
                        <Input
                          value={authConfig.apiKeyName || ''}
                          onChange={(e) =>
                            setAuthConfig(prev => ({ ...prev, apiKeyName: e.target.value }))
                          }
                          placeholder="X-API-Key"
                        />
                      </div>
                      <div>
                        <Label>Key Value</Label>
                        <Input
                          type="password"
                          value={authConfig.apiKeyValue || ''}
                          onChange={(e) =>
                            setAuthConfig(prev => ({ ...prev, apiKeyValue: e.target.value }))
                          }
                          placeholder="API key value"
                        />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Select
                          value={authConfig.apiKeyLocation || 'header'}
                          onValueChange={(value: 'header' | 'query') =>
                            setAuthConfig(prev => ({ ...prev, apiKeyLocation: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="header">Header</SelectItem>
                            <SelectItem value="query">Query Parameter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pre-request" className="space-y-2">
                  <Label>Pre-request Script (JavaScript)</Label>
                  <div className="border rounded">
                    <CodeMirror
                      value={preRequestScript}
                      onChange={setPreRequestScript}
                      height="300px"
                      theme={isDark ? oneDark : undefined}
                      extensions={[
                        javascript(),
                        EditorView.lineWrapping,
                        syntaxHighlighting(HighlightStyle.define([
                          { tag: tags.keyword, color: '#0077aa' },
                          { tag: tags.string, color: '#669900' },
                          { tag: tags.comment, color: '#999988', fontStyle: 'italic' },
                          { tag: tags.variableName, color: '#1a1a1a' },
                          { tag: tags.function(tags.variableName), color: '#6f42c1' },
                        ]))
                      ]}
                      placeholder="// Pre-request script
// Available: method, url, headers, body, environment
// Functions: setHeader(key, value), removeHeader(key), setBody(body), getEnvironmentVariable(key)"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Modify request before sending. Use setHeader(), removeHeader(), setBody(), getEnvironmentVariable()
                  </p>
                </TabsContent>

                <TabsContent value="tests" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Test Assertions</Label>
                    <Button variant="outline" size="sm" onClick={() => {
                      setTests([...tests, {
                        name: `Test ${tests.length + 1}`,
                        type: 'status',
                        condition: 'equals',
                        expected: 200
                      }])
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Test
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {tests.map((test, index) => (
                      <Card key={index}>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Test name"
                              value={test.name}
                              onChange={(e) => {
                                const newTests = [...tests]
                                newTests[index].name = e.target.value
                                setTests(newTests)
                              }}
                              className="flex-1"
                            />
                            <Select
                              value={test.type}
                              onValueChange={(value: any) => {
                                const newTests = [...tests]
                                newTests[index].type = value
                                setTests(newTests)
                              }}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="status">Status Code</SelectItem>
                                <SelectItem value="header">Header</SelectItem>
                                <SelectItem value="body">Body</SelectItem>
                                <SelectItem value="json">JSON Path</SelectItem>
                                <SelectItem value="time">Response Time</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTests(tests.filter((_, i) => i !== index))
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={test.condition}
                              onValueChange={(value) => {
                                const newTests = [...tests]
                                newTests[index].condition = value
                                setTests(newTests)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="exists">Exists</SelectItem>
                                <SelectItem value="lessThan">Less Than</SelectItem>
                                <SelectItem value="greaterThan">Greater Than</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Expected value"
                              value={typeof test.expected === 'string' ? test.expected : JSON.stringify(test.expected)}
                              onChange={(e) => {
                                const newTests = [...tests]
                                try {
                                  newTests[index].expected = JSON.parse(e.target.value)
                                } catch {
                                  newTests[index].expected = e.target.value
                                }
                                setTests(newTests)
                              }}
                            />
                          </div>
                          {test.type === 'json' && (
                            <Input
                              placeholder="JSON Path (e.g., data.user.name)"
                              value={test.expression || ''}
                              onChange={(e) => {
                                const newTests = [...tests]
                                newTests[index].expression = e.target.value
                                setTests(newTests)
                              }}
                            />
                          )}
                          {test.type === 'custom' && (
                            <Textarea
                              placeholder="Custom JavaScript expression (e.g., pm.response.json().success === true)"
                              value={test.expression || ''}
                              onChange={(e) => {
                                const newTests = [...tests]
                                newTests[index].expression = e.target.value
                                setTests(newTests)
                              }}
                              rows={3}
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {tests.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No tests defined. Add tests to validate responses automatically.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Test Results
                  <Badge variant={testResults.every(t => t.passed) ? 'default' : 'destructive'} className="ml-auto">
                    {testResults.filter(t => t.passed).length} / {testResults.length} passed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded border ${
                        result.passed 
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium">{result.name}</span>
                        {result.error && (
                          <span className="text-sm text-muted-foreground">- {result.error}</span>
                        )}
                      </div>
                      <Badge variant={result.passed ? 'default' : 'destructive'}>
                        {result.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Viewer */}
          {response && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Response</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(response.status)}>
                      {response.status} {response.statusText}
                    </Badge>
                    <Badge variant="outline">{response.time}ms</Badge>
                    <Badge variant="outline">{response.size} bytes</Badge>
                    <Button variant="outline" size="sm" onClick={copyResponse}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="body">
                  <TabsList>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="body">
                    <ScrollArea className="h-[400px] w-full rounded border">
                      <div className="p-4 bg-background">
                        <pre 
                          className="text-sm font-mono overflow-x-auto"
                          dangerouslySetInnerHTML={{
                            __html: highlightCode(
                              formatResponseBody(response.body),
                              detectContentType(response.body, response.headers)
                            )
                          }}
                        />
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="headers">
                    <ScrollArea className="h-[400px] w-full rounded border">
                      <div className="p-4 bg-background">
                        <pre 
                          className="text-sm font-mono overflow-x-auto"
                          dangerouslySetInnerHTML={{
                            __html: highlightCode(
                              JSON.stringify(response.headers, null, 2),
                              'json'
                            )
                          }}
                        />
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Collections & History */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {collections.map(collection => (
                    <div key={collection.id}>
                      <div
                        className="p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => setSelectedCollection(selectedCollection === collection.id ? null : collection.id)}
                      >
                        <div className="font-medium flex items-center justify-between">
                          {collection.name}
                          <Badge variant="outline" className="text-xs">
                            {collection.requests.length}
                          </Badge>
                        </div>
                      </div>
                      {selectedCollection === collection.id && (
                        <div className="ml-4 mt-2 space-y-1 border-l-2 pl-2">
                          {collection.requests.map((req: APIRequest) => (
                            <div
                              key={req.id}
                              className="p-2 rounded hover:bg-muted cursor-pointer text-sm"
                              onClick={() => {
                                setCurrentRequest(req)
                                if (req.auth) setAuthConfig(req.auth)
                                if (req.preRequestScript) setPreRequestScript(req.preRequestScript)
                                if (req.tests) setTests(req.tests)
                                setResponse(null)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {req.method}
                                </Badge>
                                <span className="truncate flex-1">{req.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button variant="outline" size="sm" className="w-full mt-2">
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {history.slice(0, 20).map(item => (
                    <div
                      key={item.id}
                      className="p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setCurrentRequest(item.request)
                        if (item.response) setResponse(item.response)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.request.method}
                        </Badge>
                        <span className="text-sm truncate flex-1">{item.request.url}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Request Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Request</DialogTitle>
            <DialogDescription>
              Save this request to a collection for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Request Name</Label>
              <Input
                value={currentRequest.name}
                onChange={(e) => setCurrentRequest(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter request name"
              />
            </div>
            <div>
              <Label>Collection</Label>
              <Select value={saveCollectionId || '__new__'} onValueChange={(value) => setSaveCollectionId(value === '__new__' ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select collection or create new" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new__">Create New Collection</SelectItem>
                  {collections.map(collection => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveRequest} disabled={!currentRequest.name}>
              Save Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Templates</DialogTitle>
            <DialogDescription>
              Browse and use request templates
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => useTemplate(template)}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{template.category}</Badge>
                      {template.method && (
                        <Badge variant="outline">{template.method}</Badge>
                      )}
                      <Badge variant="secondary">{template.usageCount} uses</Badge>
                    </div>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {template.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {templates.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No templates available
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Postman Collection</DialogTitle>
            <DialogDescription>
              Import a Postman collection JSON file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Collection File</Label>
              <Input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    importCollection(file)
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

