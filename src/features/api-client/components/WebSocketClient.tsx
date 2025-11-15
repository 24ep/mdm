'use client'

import { useState, useEffect, useRef } from 'react'
import { WebSocketClient, WebSocketMessage } from '../lib/websocket-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodeEditor } from '@/components/ui/code-editor'
import { Send, Power, PowerOff, Trash2 } from 'lucide-react'

interface WebSocketClientProps {
  url: string
  onMessage?: (message: WebSocketMessage) => void
}

export function WebSocketClientComponent({ url, onMessage }: WebSocketClientProps) {
  const [client, setClient] = useState<WebSocketClient | null>(null)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<WebSocketClient | null>(null)

  useEffect(() => {
    return () => {
      clientRef.current?.close()
    }
  }, [])

  const handleConnect = () => {
    if (clientRef.current) {
      clientRef.current.close()
    }

    const wsClient = new WebSocketClient()
    clientRef.current = wsClient

    wsClient.onOpen(() => {
      setConnected(true)
    })

    wsClient.onClose(() => {
      setConnected(false)
    })

    wsClient.onError((error) => {
      console.error('WebSocket error:', error)
      setConnected(false)
    })

    wsClient.onMessage((message) => {
      setMessages((prev) => [...prev, message])
      onMessage?.(message)
    })

    wsClient.connect(url)
    setClient(wsClient)
  }

  const handleDisconnect = () => {
    clientRef.current?.close()
    setConnected(false)
    setClient(null)
  }

  const handleSend = () => {
    if (clientRef.current && messageInput) {
      try {
        clientRef.current.send(messageInput)
        setMessageInput('')
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    }
  }

  const handleClear = () => {
    setMessages([])
    clientRef.current?.clearMessages()
  }

  const getStatusColor = () => {
    if (!client) return 'bg-gray-500'
    const state = client.getReadyState()
    if (state === WebSocket.OPEN) return 'bg-green-500'
    if (state === WebSocket.CONNECTING) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
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
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-2 rounded border ${
              message.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                : message.type === 'open' || message.type === 'close'
                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                : 'bg-muted border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">{message.type.toUpperCase()}</span>
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm font-mono break-all">{message.data}</div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type message to send..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSend()
              }
            }}
            disabled={!connected}
          />
          <Button onClick={handleSend} disabled={!connected || !messageInput}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

