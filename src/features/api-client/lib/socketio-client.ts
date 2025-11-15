// Socket.IO Client

export interface SocketIOMessage {
  event: string
  data: any
  timestamp: Date
  direction: 'sent' | 'received'
}

export class SocketIOClient {
  private socket: any = null
  private messages: SocketIOMessage[] = []
  private onMessageCallback?: (message: SocketIOMessage) => void
  private onErrorCallback?: (error: Error) => void
  private onConnectCallback?: () => void
  private onDisconnectCallback?: () => void

  async connect(url: string, options: any = {}) {
    try {
      // Dynamic import of socket.io-client
      const { io } = await import('socket.io-client')
      
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        ...options,
      })

      this.socket.on('connect', () => {
        this.onConnectCallback?.()
      })

      this.socket.on('disconnect', () => {
        this.onDisconnectCallback?.()
      })

      this.socket.on('connect_error', (error: Error) => {
        this.onErrorCallback?.(error)
      })

      // Listen for all events
      this.socket.onAny((event: string, ...args: any[]) => {
        const message: SocketIOMessage = {
          event,
          data: args.length === 1 ? args[0] : args,
          timestamp: new Date(),
          direction: 'received',
        }
        this.messages.push(message)
        this.onMessageCallback?.(message)
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to connect')
      this.onErrorCallback?.(err)
    }
  }

  emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data)
      
      const message: SocketIOMessage = {
        event,
        data,
        timestamp: new Date(),
        direction: 'sent',
      }
      this.messages.push(message)
      this.onMessageCallback?.(message)
    } else {
      throw new Error('Socket.IO is not connected')
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getMessages(): SocketIOMessage[] {
    return [...this.messages]
  }

  clearMessages() {
    this.messages = []
  }

  onMessage(callback: (message: SocketIOMessage) => void) {
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
    return this.socket?.connected ?? false
  }
}

