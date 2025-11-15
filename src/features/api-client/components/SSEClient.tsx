'use client'

import { useState, useEffect, useRef } from 'react'
import { SSEClient, SSEMessage } from '../lib/sse-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Power, PowerOff, Trash2 } from 'lucide-react'

interface SSEClientProps {
  url: string
  onMessage?: (message: SSEMessage) => void
}

export function SSEClientComponent({ url, onMessage }: SSEClientProps) {
  const [client, setClient] = useState<SSEClient | null>(null)
  const [messages, setMessages] = useState<SSEMessage[]>([])
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<SSEClient | null>(null)

  useEffect(() => {
    return () => {
      clientRef.current?.close()
    }
  }, [])

  const handleConnect = () => {
    if (clientRef.current) {
      clientRef.current.close()
    }

    const sseClient = new SSEClient()
    clientRef.current = sseClient

    sseClient.onOpen(() => {
      setConnected(true)
    })

    sseClient.onError((error) => {
      console.error('SSE error:', error)
      setConnected(false)
    })

    sseClient.onMessage((message) => {
      setMessages((prev) => [...prev, message])
      onMessage?.(message)
    })

    sseClient.connect(url)
    setClient(sseClient)
  }

  const handleDisconnect = () => {
    clientRef.current?.close()
    setConnected(false)
    setClient(null)
  }

  const handleClear = () => {
    setMessages([])
    clientRef.current?.clearMessages()
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className="text-sm font-medium">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          {connected ? (
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              <PowerOff className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleConnect}>
              <Power className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            {connected ? 'Waiting for messages...' : 'Connect to start receiving events'}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className="p-2 rounded border bg-muted border-border"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">
                  {message.event || 'message'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              {message.id && (
                <div className="text-xs text-muted-foreground mb-1">
                  ID: {message.id}
                </div>
              )}
              <div className="text-sm font-mono break-all">{message.data}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

