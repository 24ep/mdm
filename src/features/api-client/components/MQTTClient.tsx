'use client'

import { useState, useEffect, useRef } from 'react'
import { MQTTClient, MQTTMessage } from '../lib/mqtt-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodeEditor } from '@/components/ui/code-editor'
import { Send, Power, PowerOff, Trash2, Plus, X } from 'lucide-react'

interface MQTTClientProps {
  url: string
  onMessage?: (message: MQTTMessage) => void
}

export function MQTTClientComponent({ url, onMessage }: MQTTClientProps) {
  const [client, setClient] = useState<MQTTClient | null>(null)
  const [messages, setMessages] = useState<MQTTMessage[]>([])
  const [publishTopic, setPublishTopic] = useState('')
  const [publishMessage, setPublishMessage] = useState('')
  const [subscribeTopic, setSubscribeTopic] = useState('')
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>([])
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<MQTTClient | null>(null)

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect()
    }
  }, [])

  const handleConnect = async () => {
    if (clientRef.current) {
      clientRef.current.disconnect()
    }

    const mqttClient = new MQTTClient()
    clientRef.current = mqttClient

    mqttClient.onConnect(() => {
      setConnected(true)
    })

    mqttClient.onDisconnect(() => {
      setConnected(false)
    })

    mqttClient.onError((error) => {
      console.error('MQTT error:', error)
      setConnected(false)
    })

    mqttClient.onMessage((message) => {
      setMessages((prev) => [...prev, message])
      onMessage?.(message)
    })

    await mqttClient.connect(url)
    setClient(mqttClient)
  }

  const handleDisconnect = () => {
    clientRef.current?.disconnect()
    setConnected(false)
    setClient(null)
    setSubscribedTopics([])
  }

  const handleSubscribe = () => {
    if (clientRef.current && subscribeTopic) {
      try {
        clientRef.current.subscribe(subscribeTopic)
        setSubscribedTopics((prev) => [...prev, subscribeTopic])
        setSubscribeTopic('')
      } catch (error) {
        alert('Failed to subscribe')
      }
    }
  }

  const handleUnsubscribe = (topic: string) => {
    if (clientRef.current) {
      try {
        clientRef.current.unsubscribe(topic)
        setSubscribedTopics((prev) => prev.filter((t) => t !== topic))
      } catch (error) {
        alert('Failed to unsubscribe')
      }
    }
  }

  const handlePublish = () => {
    if (clientRef.current && publishTopic) {
      try {
        clientRef.current.publish(publishTopic, publishMessage)
        setPublishMessage('')
      } catch (error) {
        alert('Failed to publish')
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
                {message.direction === 'sent' ? '→' : '←'} {message.topic}
              </span>
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString()} (QoS {message.qos})
              </span>
            </div>
            <div className="text-sm font-mono break-all">{message.message}</div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold">Subscribe to Topic</div>
          <div className="flex gap-2">
            <Input
              value={subscribeTopic}
              onChange={(e) => setSubscribeTopic(e.target.value)}
              placeholder="Topic name"
              disabled={!connected}
            />
            <Button onClick={handleSubscribe} disabled={!connected || !subscribeTopic}>
              <Plus className="h-4 w-4 mr-2" />
              Subscribe
            </Button>
          </div>
          {subscribedTopics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {subscribedTopics.map((topic) => (
                <div
                  key={topic}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                >
                  <span>{topic}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                    onClick={() => handleUnsubscribe(topic)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold">Publish Message</div>
          <Input
            value={publishTopic}
            onChange={(e) => setPublishTopic(e.target.value)}
            placeholder="Topic"
            disabled={!connected}
          />
          <CodeEditor
            value={publishMessage}
            onChange={setPublishMessage}
            language="text"
            height="80px"
            placeholder="Message content"
          />
          <Button
            onClick={handlePublish}
            disabled={!connected || !publishTopic}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>
    </div>
  )
}

