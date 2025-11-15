// WebSocket Client

export interface WebSocketMessage {
  type: 'message' | 'error' | 'open' | 'close'
  data: string
  timestamp: Date
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private messages: WebSocketMessage[] = []
  private onMessageCallback?: (message: WebSocketMessage) => void
  private onErrorCallback?: (error: Error) => void
  private onOpenCallback?: () => void
  private onCloseCallback?: () => void

  connect(url: string, protocols?: string[]) {
    try {
      this.ws = new WebSocket(url, protocols)

      this.ws.onopen = () => {
        const message: WebSocketMessage = {
          type: 'open',
          data: 'Connected',
          timestamp: new Date(),
        }
        this.messages.push(message)
        this.onOpenCallback?.()
        this.onMessageCallback?.(message)
      }

      this.ws.onmessage = (event) => {
        const message: WebSocketMessage = {
          type: 'message',
          data: event.data,
          timestamp: new Date(),
        }
        this.messages.push(message)
        this.onMessageCallback?.(message)
      }

      this.ws.onerror = (error) => {
        const message: WebSocketMessage = {
          type: 'error',
          data: 'WebSocket error occurred',
          timestamp: new Date(),
        }
        this.messages.push(message)
        this.onErrorCallback?.(new Error('WebSocket error'))
        this.onMessageCallback?.(message)
      }

      this.ws.onclose = () => {
        const message: WebSocketMessage = {
          type: 'close',
          data: 'Connection closed',
          timestamp: new Date(),
        }
        this.messages.push(message)
        this.onCloseCallback?.()
        this.onMessageCallback?.(message)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to connect')
      this.onErrorCallback?.(err)
    }
  }

  send(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    } else {
      throw new Error('WebSocket is not connected')
    }
  }

  close() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  getMessages(): WebSocketMessage[] {
    return [...this.messages]
  }

  clearMessages() {
    this.messages = []
  }

  onMessage(callback: (message: WebSocketMessage) => void) {
    this.onMessageCallback = callback
  }

  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback
  }

  onOpen(callback: () => void) {
    this.onOpenCallback = callback
  }

  onClose(callback: () => void) {
    this.onCloseCallback = callback
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }
}

