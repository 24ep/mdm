// MQTT Client

export interface MQTTMessage {
  topic: string
  message: string
  qos: number
  timestamp: Date
  direction: 'sent' | 'received'
}

export class MQTTClient {
  private client: any = null
  private messages: MQTTMessage[] = []
  private onMessageCallback?: (message: MQTTMessage) => void
  private onErrorCallback?: (error: Error) => void
  private onConnectCallback?: () => void
  private onDisconnectCallback?: () => void

  async connect(
    url: string,
    options: {
      clientId?: string
      username?: string
      password?: string
      clean?: boolean
      reconnectPeriod?: number
    } = {}
  ) {
    try {
      // Dynamic import of mqtt
      const mqtt = await import('mqtt')
      
      const connectUrl = url.startsWith('mqtt://') || url.startsWith('ws://') || url.startsWith('wss://')
        ? url
        : `mqtt://${url}`

      this.client = mqtt.connect(connectUrl, {
        clientId: options.clientId || `mqtt_${Math.random().toString(16).substr(2, 8)}`,
        username: options.username,
        password: options.password,
        clean: options.clean !== false,
        reconnectPeriod: options.reconnectPeriod || 1000,
      })

      this.client.on('connect', () => {
        this.onConnectCallback?.()
      })

      this.client.on('disconnect', () => {
        this.onDisconnectCallback?.()
      })

      this.client.on('error', (error: Error) => {
        this.onErrorCallback?.(error)
      })

      this.client.on('message', (topic: string, message: Buffer) => {
        const mqttMessage: MQTTMessage = {
          topic,
          message: message.toString(),
          qos: 0,
          timestamp: new Date(),
          direction: 'received',
        }
        this.messages.push(mqttMessage)
        this.onMessageCallback?.(mqttMessage)
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to connect')
      this.onErrorCallback?.(err)
    }
  }

  subscribe(topic: string, qos: number = 0) {
    if (this.client && this.client.connected) {
      this.client.subscribe(topic, { qos }, (error: Error) => {
        if (error) {
          this.onErrorCallback?.(error)
        }
      })
    } else {
      throw new Error('MQTT client is not connected')
    }
  }

  unsubscribe(topic: string) {
    if (this.client && this.client.connected) {
      this.client.unsubscribe(topic)
    }
  }

  publish(topic: string, message: string, qos: number = 0) {
    if (this.client && this.client.connected) {
      this.client.publish(topic, message, { qos }, (error: Error) => {
        if (error) {
          this.onErrorCallback?.(error)
        } else {
          const mqttMessage: MQTTMessage = {
            topic,
            message,
            qos,
            timestamp: new Date(),
            direction: 'sent',
          }
          this.messages.push(mqttMessage)
          this.onMessageCallback?.(mqttMessage)
        }
      })
    } else {
      throw new Error('MQTT client is not connected')
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end()
      this.client = null
    }
  }

  getMessages(): MQTTMessage[] {
    return [...this.messages]
  }

  clearMessages() {
    this.messages = []
  }

  onMessage(callback: (message: MQTTMessage) => void) {
    this.onMessageCallback = callback
  }

  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback
  }

  onConnect(callback: () => void) {
    this.onConnectCallback = callback
  }

  onDisconnect(callback: () => void) {
    this.onDisconnectCallback = callback
  }

  isConnected(): boolean {
    return this.client?.connected ?? false
  }
}

