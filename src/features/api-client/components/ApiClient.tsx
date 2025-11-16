'use client'

import { useState, useEffect } from 'react'
import { ApiRequest, ApiResponse, ApiCollection, ApiEnvironment, KeyValuePair } from '../types'
import { RequestBuilder } from './RequestBuilder'
import { ResponseViewer } from './ResponseViewer'
import { CollectionsSidebar } from './CollectionsSidebar'
import { EnvironmentManager } from './EnvironmentManager'
import { RequestHistory } from './RequestHistory'
import { WebSocketClientComponent } from './WebSocketClient'
import { SSEClientComponent } from './SSEClient'
import { SocketIOClientComponent } from './SocketIOClient'
import { MQTTClientComponent } from './MQTTClient'
import { ImportExportDialog } from './ImportExportDialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RequestExecutor } from '../lib/request-executor'
import { SSEClient } from '../lib/sse-client'
import { Send, History, Folder, Settings, Download } from 'lucide-react'

interface ApiClientProps {
  workspaceId?: string
}

export function ApiClient({ workspaceId }: ApiClientProps) {
  const [activeRequest, setActiveRequest] = useState<ApiRequest | null>(null)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [collections, setCollections] = useState<ApiCollection[]>([])
  const [environments, setEnvironments] = useState<ApiEnvironment[]>([])
  const [activeEnvironment, setActiveEnvironment] = useState<ApiEnvironment | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request')

  // Initialize default request
  useEffect(() => {
    if (!activeRequest) {
      setActiveRequest({
        name: 'New Request',
        method: 'GET',
        url: '',
        headers: [],
        params: [],
        authType: 'none',
        requestType: 'REST',
      })
    }
  }, [activeRequest])

  // Load collections and environments
  useEffect(() => {
    if (workspaceId) {
      loadCollections()
      loadEnvironments()
    }
  }, [workspaceId])

  const loadCollections = async () => {
    try {
      const res = await fetch(`/api/api-client/collections?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setCollections(data.collections || [])
      }
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  const loadEnvironments = async () => {
    try {
      const res = await fetch(`/api/api-client/environments?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setEnvironments(data.environments || [])
        if (data.environments && data.environments.length > 0) {
          setActiveEnvironment(data.environments[0])
        }
      }
    } catch (error) {
      console.error('Failed to load environments:', error)
    }
  }

  const handleSendRequest = async () => {
    if (!activeRequest) return

    setLoading(true)
    setResponse(null)

    try {
      // Execute pre-request script if available
      let finalRequest = activeRequest
      let finalVariables = activeEnvironment?.variables || []

      if (activeRequest.preRequestScript) {
        const result = await RequestExecutor.executePreRequestScript(
          activeRequest.preRequestScript,
          activeRequest,
          finalVariables
        )
        finalRequest = result.request
        finalVariables = result.variables
      }

      // Execute request
      let apiResponse: ApiResponse
      if (finalRequest.requestType === 'GraphQL') {
        apiResponse = await RequestExecutor.executeGraphQLRequest(finalRequest, finalVariables)
      } else if (finalRequest.requestType === 'WebSocket') {
        // WebSocket is handled separately in the UI
        return
      } else if (finalRequest.requestType === 'SSE') {
        // SSE is handled separately in the UI
        return
      } else {
        apiResponse = await RequestExecutor.executeRestRequest(finalRequest, finalVariables)
      }

      // Execute test script if available
      if (finalRequest.testScript && apiResponse.statusCode > 0) {
        const testResult = await RequestExecutor.executeTestScript(
          finalRequest.testScript,
          apiResponse,
          finalRequest
        )
        // You can display test results in the UI
        console.log('Test results:', testResult)
      }

      setResponse(apiResponse)

      // Save to history
      if (workspaceId) {
        await saveToHistory(finalRequest, apiResponse)
      }
    } catch (error) {
      setResponse({
        statusCode: 0,
        statusText: 'Error',
        headers: {},
        body: '',
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveToHistory = async (request: ApiRequest, response: ApiResponse) => {
    try {
      await fetch('/api/api-client/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          method: request.method,
          url: request.url,
          headers: request.headers.reduce((acc, h) => {
            if (h.enabled) acc[h.key] = h.value
            return acc
          }, {} as Record<string, string>),
          body: request.body,
          statusCode: response.statusCode,
          statusText: response.statusText,
          responseHeaders: response.headers,
          responseBody: response.body,
          responseTime: response.responseTime,
          error: response.error,
        }),
      })
    } catch (error) {
      console.error('Failed to save history:', error)
    }
  }

  const handleRequestChange = (request: ApiRequest) => {
    setActiveRequest(request)
  }

  const handleSelectRequest = (request: ApiRequest) => {
    setActiveRequest(request)
    setActiveTab('request')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Collections Sidebar */}
      {sidebarOpen && (
        <div className="w-64 border-r border-border bg-muted/30 flex flex-col">
          <CollectionsSidebar
            collections={collections}
            onSelectRequest={handleSelectRequest}
            onRequestChange={handleRequestChange}
            workspaceId={workspaceId}
            onCollectionsChange={setCollections}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-background">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Folder className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">API Client</span>
          </div>
          <div className="flex items-center gap-2">
            <EnvironmentManager
              environments={environments}
              activeEnvironment={activeEnvironment}
              onSelectEnvironment={setActiveEnvironment}
              workspaceId={workspaceId}
              onEnvironmentsChange={setEnvironments}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab(activeTab === 'request' ? 'history' : 'request')}
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Request/Response Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="border-b border-border">
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="request" className="flex-1 flex flex-col overflow-hidden m-0">
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Request Builder */}
                <div className="flex-1 overflow-auto border-b border-border">
                  {activeRequest && activeRequest.requestType === 'WebSocket' ? (
                    <WebSocketClientComponent
                      url={activeRequest.url}
                      onMessage={(message) => {
                        console.log('WebSocket message:', message)
                      }}
                    />
                  ) : activeRequest && activeRequest.requestType === 'SSE' ? (
                    <SSEClientComponent
                      url={activeRequest.url}
                      onMessage={(message) => {
                        console.log('SSE message:', message)
                      }}
                    />
                  ) : activeRequest && activeRequest.requestType === 'SocketIO' ? (
                    <SocketIOClientComponent
                      url={activeRequest.url}
                      onMessage={(message) => {
                        console.log('Socket.IO message:', message)
                      }}
                    />
                  ) : activeRequest && activeRequest.requestType === 'MQTT' ? (
                    <MQTTClientComponent
                      url={activeRequest.url}
                      onMessage={(message) => {
                        console.log('MQTT message:', message)
                      }}
                    />
                  ) : activeRequest ? (
                    <RequestBuilder
                      request={activeRequest}
                      onChange={handleRequestChange}
                      environmentVariables={activeEnvironment?.variables || []}
                    />
                  ) : null}
                </div>

                {/* Send Button */}
                <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {activeRequest?.url || 'Enter URL to send request'}
                    </span>
                    {activeRequest && (
                      <ImportExportDialog
                        request={activeRequest}
                        environmentVariables={activeEnvironment?.variables || []}
                      />
                    )}
                  </div>
                  {!['WebSocket', 'SSE', 'SocketIO', 'MQTT'].includes(activeRequest?.requestType || '') && (
                    <Button
                      onClick={handleSendRequest}
                      disabled={loading || !activeRequest?.url}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? 'Sending...' : 'Send'}
                    </Button>
                  )}
                </div>

                {/* Response Viewer */}
                <div className="flex-1 overflow-auto">
                  {response && <ResponseViewer response={response} />}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-auto m-0">
              <RequestHistory
                workspaceId={workspaceId}
                onSelectRequest={(historyItem) => {
                  // Load request from history
                  if (historyItem.requestId) {
                    // Fetch the request
                    fetch(`/api/api-client/requests/${historyItem.requestId}`)
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.request) {
                          setActiveRequest(data.request)
                          setActiveTab('request')
                        }
                      })
                  }
                }}
              />
            </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

