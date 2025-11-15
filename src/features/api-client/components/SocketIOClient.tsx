'use client'

import { useState, useEffect, useRef } from 'react'
import { SocketIOClient, SocketIOMessage } from '../lib/socketio-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodeEditor } from '@/components/ui/code-editor'
import { Send, Power, PowerOff, Trash2 } from 'lucide-react'

interface SocketIOClientProps {
  url: string
  onMessage?: (message: SocketIOMessage) => void
}

export function SocketIOClientComponent({ url, onMessage }: SocketIOClientProps) {
  const [client, setClient] = useState<SocketIOClient | null>(null)
  const [messages, setMessages] = useState<SocketIOMessage[]>([])
  const [eventName, setEventName] = useState('')
  const [eventData, setEventData] = useState('{}')
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<SocketIOClient | null>(null)

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect()
    }
  }, [])

  const handleConnect = async () => {
    if (clientRef.current) {
      clientRef.current.disconnect()
    }

    const socketClient = new SocketIOClient()
    clientRef.current = socketClient

    socketClient.onConnect(() => {
      setConnected(true)
    })

    socketClient.onDisconnect(() => {
      setConnected(false)
    })

    socketClient.onError((error) => {
      console.error('Socket.IO error:', error)
      setConnected(false)
    })

    socketClient.onMessage((message) => {
      setMessages((prev) => [...prev, message])
      onMessage?.(message)
    })

    await socketClient.connect(url)
    setClient(socketClient)
  }

  const handleDisconnect = () => {
    clientRef.current?.disconnect()
    setConnected(false)
    setClient(null)
  }

  const handleSend = () => {
    if (clientRef.current && eventName) {
      try {
        const data = eventData ? JSON.parse(eventData) : {}
        clientRef.current.emit(eventName, data)
        setEventData('{}')
      } catch (error) {
        alert('Invalid JSON data')
      }
    }
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
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-2 rounded border ${
              message.direction === 'sent'
                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                : 'bg-muted border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">
                {message.direction === 'sent' ? '→' : '←'} {message.event}
              </span>
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm font-mono break-all">
              {JSON.stringify(message.data, null, 2)}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border space-y-2">
        <Input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="Event name"
          disabled={!connected}
        />
        <CodeEditor
          value={eventData}
          onChange={setEventData}
          language="json"
          height="100px"
          placeholder='{"key": "value"}'
        />
        <Button onClick={handleSend} disabled={!connected || !eventName} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          Emit Event
        </Button>
      </div>
    </div>
  )
}

