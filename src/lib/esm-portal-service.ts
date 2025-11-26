export interface ESMPortalConfig {
  baseUrl: string // ESM Portal base URL
  apiKey?: string // API key for authentication
  username?: string // Username for basic auth
  password?: string // Password for basic auth
  authType?: 'apikey' | 'basic' | 'bearer'
  customHeaders?: Record<string, string>
}

export interface ESMPortalTicket {
  title: string
  description?: string
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'
  status?: string
  category?: string
  assignee?: string
  dueDate?: string
  customFields?: Record<string, any>
}

export interface ESMPortalResponse {
  success: boolean
  ticketId?: string
  ticketNumber?: string
  ticketUrl?: string
  message?: string
  error?: string
  data?: any
}

export interface ESMPortalComment {
  content: string
  isPublic?: boolean
}

export class ESMPortalService {
  private config: ESMPortalConfig
  private enableRetry: boolean = true

  constructor(config: ESMPortalConfig, options?: { enableRetry?: boolean }) {
    this.config = config
    // Ensure baseUrl doesn't end with /
    this.config.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.enableRetry = options?.enableRetry !== false
  }

  /**
   * Internal method to execute fetch with retry logic
   */
  private async executeFetch(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    if (!this.enableRetry) {
      return fetch(url, options)
    }

    const { executeWithRetry } = await import('./servicedesk-retry')
    
    return executeWithRetry(async () => {
      const response = await fetch(url, options)
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        if (retryAfter) {
          await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000))
        }
        throw { status: 429, response }
      }
      
      return response
    })
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.customHeaders
    }

    if (this.config.authType === 'apikey' && this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    } else if (this.config.authType === 'basic' && this.config.username && this.config.password) {
      const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
      headers['Authorization'] = `Basic ${credentials}`
    } else if (this.config.authType === 'bearer' && this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    } else if (this.config.apiKey) {
      // Default to API key
      headers['X-API-Key'] = this.config.apiKey
    }

    return headers
  }

  /**
   * Test the connection to ESM Portal
   */
  async testConnection(): Promise<ESMPortalResponse> {
    try {
      // Try common health/status endpoints
      const endpoints = ['/api/health', '/api/status', '/api/v1/health', '/health']
      
      for (const endpoint of endpoints) {
        try {
          const url = `${this.config.baseUrl}${endpoint}`
          const response = await this.executeFetch(url, {
            method: 'GET',
            headers: this.getAuthHeaders()
          })

          if (response.ok) {
            return {
              success: true,
              message: 'Connection successful'
            }
          }
        } catch (error) {
          // Try next endpoint
          continue
        }
      }

      // If no health endpoint works, try a simple GET to base URL
      const response = await this.executeFetch(this.config.baseUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (response.ok || response.status === 401 || response.status === 403) {
        // 401/403 means server is reachable but auth may be needed
        return {
          success: true,
          message: 'Connection successful (authentication may be required)'
        }
      }

      return {
        success: false,
        error: `Connection failed: ${response.status} ${response.statusText}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Create a ticket in ESM Portal
   */
  async createTicket(ticket: ESMPortalTicket): Promise<ESMPortalResponse> {
    try {
      // Try common ticket creation endpoints
      const endpoints = [
        '/api/tickets',
        '/api/v1/tickets',
        '/api/requests',
        '/api/v1/requests',
        '/api/incidents',
        '/api/v1/incidents'
      ]

      const payload: any = {
        title: ticket.title,
        description: ticket.description || '',
        priority: ticket.priority || 'Medium',
        status: ticket.status || 'Open'
      }

      if (ticket.category) payload.category = ticket.category
      if (ticket.assignee) payload.assignee = ticket.assignee
      if (ticket.dueDate) payload.dueDate = ticket.dueDate
      if (ticket.customFields) {
        Object.assign(payload, ticket.customFields)
      }

      for (const endpoint of endpoints) {
        try {
          const url = `${this.config.baseUrl}${endpoint}`
          const response = await this.executeFetch(url, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(payload)
          })

          if (response.ok) {
            const data = await response.json()
            return {
              success: true,
              ticketId: data.id || data.ticketId || data.requestId,
              ticketNumber: data.number || data.ticketNumber || data.requestNumber,
              ticketUrl: data.url || data.link || `${this.config.baseUrl}/tickets/${data.id || data.ticketId}`,
              message: 'Ticket created successfully',
              data
            }
          }
        } catch (error) {
          // Try next endpoint
          continue
        }
      }

      return {
        success: false,
        error: 'Failed to create ticket: No working endpoint found'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create ticket'
      }
    }
  }

  /**
   * Update a ticket in ESM Portal
   */
  async updateTicket(ticketId: string, updates: Partial<ESMPortalTicket>): Promise<ESMPortalResponse> {
    try {
      const endpoints = [
        `/api/tickets/${ticketId}`,
        `/api/v1/tickets/${ticketId}`,
        `/api/requests/${ticketId}`,
        `/api/v1/requests/${ticketId}`
      ]

      const payload: any = {}
      if (updates.title) payload.title = updates.title
      if (updates.description !== undefined) payload.description = updates.description
      if (updates.priority) payload.priority = updates.priority
      if (updates.status) payload.status = updates.status
      if (updates.assignee) payload.assignee = updates.assignee
      if (updates.customFields) {
        Object.assign(payload, updates.customFields)
      }

      for (const endpoint of endpoints) {
        try {
          const url = `${this.config.baseUrl}${endpoint}`
          const response = await this.executeFetch(url, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(payload)
          })

          if (response.ok) {
            const data = await response.json()
            return {
              success: true,
              ticketId,
              message: 'Ticket updated successfully',
              data
            }
          }
        } catch (error) {
          continue
        }
      }

      return {
        success: false,
        error: 'Failed to update ticket: No working endpoint found'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update ticket'
      }
    }
  }

  /**
   * Get a ticket from ESM Portal
   */
  async getTicket(ticketId: string): Promise<ESMPortalResponse> {
    try {
      const endpoints = [
        `/api/tickets/${ticketId}`,
        `/api/v1/tickets/${ticketId}`,
        `/api/requests/${ticketId}`,
        `/api/v1/requests/${ticketId}`
      ]

      for (const endpoint of endpoints) {
        try {
          const url = `${this.config.baseUrl}${endpoint}`
          const response = await this.executeFetch(url, {
            method: 'GET',
            headers: this.getAuthHeaders()
          })

          if (response.ok) {
            const data = await response.json()
            return {
              success: true,
              ticketId: data.id || data.ticketId || ticketId,
              ticketNumber: data.number || data.ticketNumber,
              ticketUrl: data.url || data.link,
              data
            }
          }
        } catch (error) {
          continue
        }
      }

      return {
        success: false,
        error: 'Failed to get ticket: No working endpoint found'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get ticket'
      }
    }
  }

  /**
   * Add a comment to a ticket
   */
  async addComment(ticketId: string, comment: ESMPortalComment): Promise<ESMPortalResponse> {
    try {
      const endpoints = [
        `/api/tickets/${ticketId}/comments`,
        `/api/v1/tickets/${ticketId}/comments`,
        `/api/requests/${ticketId}/comments`,
        `/api/v1/requests/${ticketId}/comments`
      ]

      const payload = {
        content: comment.content,
        isPublic: comment.isPublic !== false
      }

      for (const endpoint of endpoints) {
        try {
          const url = `${this.config.baseUrl}${endpoint}`
          const response = await this.executeFetch(url, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(payload)
          })

          if (response.ok) {
            const data = await response.json()
            return {
              success: true,
              message: 'Comment added successfully',
              data
            }
          }
        } catch (error) {
          continue
        }
      }

      return {
        success: false,
        error: 'Failed to add comment: No working endpoint found'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add comment'
      }
    }
  }

  /**
   * Map ticket data to ESM Portal format
   */
  mapTicketToESMPortal(ticket: {
    title: string
    description?: string | null
    priority?: string
    status?: string
    assignees?: Array<{ user?: { email?: string } }>
    tags?: Array<{ name?: string }>
  }): ESMPortalTicket {
    const priorityMap: Record<string, 'Low' | 'Medium' | 'High' | 'Critical'> = {
      'LOW': 'Low',
      'MEDIUM': 'Medium',
      'HIGH': 'High',
      'URGENT': 'Critical'
    }

    return {
      title: ticket.title,
      description: ticket.description || undefined,
      priority: ticket.priority ? priorityMap[ticket.priority] || 'Medium' : undefined,
      status: ticket.status || undefined
    }
  }
}

