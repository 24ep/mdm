// Server-Sent Events Client

export interface SSEMessage {
  id?: string
  event?: string
  data: string
  timestamp: Date
}

export class SSEClient {
  private eventSource: EventSource | null = null
  private messages: SSEMessage[] = []
  private onMessageCallback?: (message: SSEMessage) => void
  private onErrorCallback?: (error: Error) => void
  private onOpenCallback?: () => void

  connect(url: string) {
    try {
      this.eventSource = new EventSource(url)

      this.eventSource.onopen = () => {
        this.onOpenCallback?.()
      }

      this.eventSource.onmessage = (event) => {
        const message: SSEMessage = {
          id: event.lastEventId,
          data: event.data,
          timestamp: new Date(),
        }
        this.messages.push(message)
        this.onMessageCallback?.(message)
      }

      this.eventSource.onerror = (error) => {
        this.onErrorCallback?.(new Error('SSE connection error'))
      }

      // Listen for custom event types
      this.eventSource.addEventListener('message', (event: any) => {
        const message: SSEMessage = {
          id: event.lastEventId,
          event: event.type,
          data: event.data,
          timestamp: new Date(),
        }
        this.messages.push(message)
        this.onMessageCallback?.(message)
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to connect')
      this.onErrorCallback?.(err)
    }
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  getMessages(): SSEMessage[] {
    return [...this.messages]
  }

  clearMessages() {
    this.messages = []
  }

  onMessage(callback: (message: SSEMessage) => void) {
    this.onMessageCallback = callback
  }

  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback
  }

  onOpen(callback: () => void) {
    this.onOpenCallback = callback
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}

