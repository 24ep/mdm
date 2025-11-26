export interface ITSMConfig {
  baseUrl: string
  provider: 'servicenow' | 'bmc_remedy' | 'cherwell' | 'custom'
  apiKey?: string
  username?: string
  password?: string
  authType?: 'apikey' | 'basic' | 'oauth'
  instanceName?: string // For ServiceNow
  customEndpoints?: {
    createTicket?: string
    updateTicket?: string
    getTicket?: string
    addComment?: string
  }
  fieldMappings?: {
    status?: Record<string, string>
    priority?: Record<string, string>
    category?: Record<string, string>
  }
}

export interface ITSMTicket {
  title: string
  description?: string
  priority?: string
  status?: string
  category?: string
  assignee?: string
  dueDate?: string
  customFields?: Record<string, any>
}

export interface ITSMResponse {
  success: boolean
  ticketId?: string
  ticketNumber?: string
  ticketUrl?: string
  message?: string
  error?: string
  data?: any
}

export interface ITSMComment {
  content: string
  isPublic?: boolean
}

export class ITSMService {
  private config: ITSMConfig
  private enableRetry: boolean = true

  constructor(config: ITSMConfig, options?: { enableRetry?: boolean }) {
    this.config = config
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
      'Accept': 'application/json'
    }

    if (this.config.provider === 'servicenow') {
      // ServiceNow uses Basic Auth
      if (this.config.username && this.config.password) {
        const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
        headers['Authorization'] = `Basic ${credentials}`
      }
    } else if (this.config.provider === 'bmc_remedy') {
      // BMC Remedy ARS uses Basic Auth or API key
      if (this.config.apiKey) {
        headers['Authorization'] = `AR-JWT ${this.config.apiKey}`
      } else if (this.config.username && this.config.password) {
        const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
        headers['Authorization'] = `Basic ${credentials}`
      }
    } else if (this.config.provider === 'cherwell') {
      // Cherwell uses Bearer token
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
      }
    } else {
      // Custom provider
      if (this.config.authType === 'apikey' && this.config.apiKey) {
        headers['X-API-Key'] = this.config.apiKey
      } else if (this.config.authType === 'basic' && this.config.username && this.config.password) {
        const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
        headers['Authorization'] = `Basic ${credentials}`
      } else if (this.config.authType === 'apikey' && this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
      }
    }

    return headers
  }

  /**
   * Test the connection to ITSM
   */
  async testConnection(): Promise<ITSMResponse> {
    try {
      let testUrl = this.config.baseUrl

      if (this.config.provider === 'servicenow') {
        testUrl = `${this.config.baseUrl}/api/now/table/sys_user?sysparm_limit=1`
      } else if (this.config.provider === 'bmc_remedy') {
        testUrl = `${this.config.baseUrl}/api/arsys/v1/entry/HPD:IncidentInterface_Create?limit=1`
      } else if (this.config.provider === 'cherwell') {
        testUrl = `${this.config.baseUrl}/CherwellAPI/health`
      } else {
        testUrl = `${this.config.baseUrl}/api/health`
      }

      const response = await this.executeFetch(testUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (response.ok || response.status === 401 || response.status === 403) {
        return {
          success: true,
          message: 'Connection successful'
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
   * Create a ticket in ITSM
   */
  async createTicket(ticket: ITSMTicket): Promise<ITSMResponse> {
    try {
      let url: string
      let payload: any

      if (this.config.provider === 'servicenow') {
        url = `${this.config.baseUrl}/api/now/table/incident`
        payload = {
          short_description: ticket.title,
          description: ticket.description || '',
          priority: this.mapPriority(ticket.priority),
          urgency: this.mapPriority(ticket.priority),
          category: ticket.category || ''
        }
      } else if (this.config.provider === 'bmc_remedy') {
        url = `${this.config.baseUrl}/api/arsys/v1/entry/HPD:IncidentInterface_Create`
        payload = {
          values: {
            'Summary': ticket.title,
            'Detailed Description': ticket.description || '',
            'Priority': this.mapPriority(ticket.priority),
            'Status': ticket.status || 'New'
          }
        }
      } else if (this.config.provider === 'cherwell') {
        url = `${this.config.baseUrl}/CherwellAPI/api/V1/createbusinessobject`
        payload = {
          busObId: 'Incident',
          fields: [
            { fieldId: 'Title', value: ticket.title },
            { fieldId: 'Description', value: ticket.description || '' },
            { fieldId: 'Priority', value: this.mapPriority(ticket.priority) }
          ]
        }
      } else {
        // Custom provider
        url = this.config.customEndpoints?.createTicket || `${this.config.baseUrl}/api/tickets`
        payload = {
          title: ticket.title,
          description: ticket.description || '',
          priority: this.mapPriority(ticket.priority),
          status: ticket.status || 'Open',
          category: ticket.category
        }
      }

      // Add custom fields
      if (ticket.customFields) {
        Object.assign(payload, ticket.customFields)
      }

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        
        let ticketId: string | undefined
        let ticketNumber: string | undefined
        let ticketUrl: string | undefined

        if (this.config.provider === 'servicenow') {
          ticketId = data.result?.sys_id
          ticketNumber = data.result?.number
          ticketUrl = `${this.config.baseUrl}/nav_to.do?uri=incident.do?sys_id=${ticketId}`
        } else if (this.config.provider === 'bmc_remedy') {
          ticketId = data.entryId
          ticketNumber = data.values?.['Request ID']
          ticketUrl = `${this.config.baseUrl}/arsys/forms/${this.config.instanceName}/HPD:IncidentInterface/${ticketId}`
        } else if (this.config.provider === 'cherwell') {
          ticketId = data.busObPublicId
          ticketNumber = data.busObRecId
          ticketUrl = `${this.config.baseUrl}/service/cw/WebApi/Incident/${ticketId}`
        } else {
          ticketId = data.id || data.ticketId
          ticketNumber = data.number || data.ticketNumber
          ticketUrl = data.url || data.link
        }

        return {
          success: true,
          ticketId,
          ticketNumber,
          ticketUrl,
          message: 'Ticket created successfully',
          data
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to create ticket: ${response.status} ${errorText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create ticket'
      }
    }
  }

  /**
   * Update a ticket in ITSM
   */
  async updateTicket(ticketId: string, updates: Partial<ITSMTicket>): Promise<ITSMResponse> {
    try {
      let url: string
      let payload: any

      if (this.config.provider === 'servicenow') {
        url = `${this.config.baseUrl}/api/now/table/incident/${ticketId}`
        payload = {}
        if (updates.title) payload.short_description = updates.title
        if (updates.description !== undefined) payload.description = updates.description
        if (updates.priority) {
          payload.priority = this.mapPriority(updates.priority)
          payload.urgency = this.mapPriority(updates.priority)
        }
        if (updates.status) payload.state = updates.status
      } else if (this.config.provider === 'bmc_remedy') {
        url = `${this.config.baseUrl}/api/arsys/v1/entry/HPD:IncidentInterface/${ticketId}`
        payload = {
          values: {}
        }
        if (updates.title) payload.values['Summary'] = updates.title
        if (updates.description !== undefined) payload.values['Detailed Description'] = updates.description
        if (updates.priority) payload.values['Priority'] = this.mapPriority(updates.priority)
        if (updates.status) payload.values['Status'] = updates.status
      } else if (this.config.provider === 'cherwell') {
        url = `${this.config.baseUrl}/CherwellAPI/api/V1/savebusinessobject`
        payload = {
          busObId: 'Incident',
          busObPublicId: ticketId,
          fields: []
        }
        if (updates.title) payload.fields.push({ fieldId: 'Title', value: updates.title })
        if (updates.description !== undefined) payload.fields.push({ fieldId: 'Description', value: updates.description })
        if (updates.priority) payload.fields.push({ fieldId: 'Priority', value: this.mapPriority(updates.priority) })
      } else {
        url = this.config.customEndpoints?.updateTicket || `${this.config.baseUrl}/api/tickets/${ticketId}`
        payload = {}
        if (updates.title) payload.title = updates.title
        if (updates.description !== undefined) payload.description = updates.description
        if (updates.priority) payload.priority = this.mapPriority(updates.priority)
        if (updates.status) payload.status = updates.status
      }

      if (updates.customFields) {
        Object.assign(payload, updates.customFields)
      }

      const response = await this.executeFetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        return {
          success: true,
          ticketId,
          message: 'Ticket updated successfully'
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to update ticket: ${response.status} ${errorText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update ticket'
      }
    }
  }

  /**
   * Get a ticket from ITSM
   */
  async getTicket(ticketId: string): Promise<ITSMResponse> {
    try {
      let url: string

      if (this.config.provider === 'servicenow') {
        url = `${this.config.baseUrl}/api/now/table/incident/${ticketId}`
      } else if (this.config.provider === 'bmc_remedy') {
        url = `${this.config.baseUrl}/api/arsys/v1/entry/HPD:IncidentInterface/${ticketId}`
      } else if (this.config.provider === 'cherwell') {
        url = `${this.config.baseUrl}/CherwellAPI/api/V1/getbusinessobject/busobid/Incident/busobrecid/${ticketId}`
      } else {
        url = this.config.customEndpoints?.getTicket || `${this.config.baseUrl}/api/tickets/${ticketId}`
      }

      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          ticketId,
          data
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to get ticket: ${response.status} ${errorText}`
        }
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
  async addComment(ticketId: string, comment: ITSMComment): Promise<ITSMResponse> {
    try {
      let url: string
      let payload: any

      if (this.config.provider === 'servicenow') {
        url = `${this.config.baseUrl}/api/now/table/sys_journal_field`
        payload = {
          name: 'incident',
          element_id: ticketId,
          value: comment.content
        }
      } else if (this.config.provider === 'bmc_remedy') {
        url = `${this.config.baseUrl}/api/arsys/v1/entry/HPD:WorkLog/${ticketId}`
        payload = {
          values: {
            'Work Log Type': 'Public',
            'Detailed Description': comment.content
          }
        }
      } else if (this.config.provider === 'cherwell') {
        url = `${this.config.baseUrl}/CherwellAPI/api/V1/addrelatedbusinessobject`
        payload = {
          parentBusObId: 'Incident',
          parentBusObRecId: ticketId,
          relationshipId: 'Comment',
          busObId: 'Comment',
          fields: [
            { fieldId: 'Comment', value: comment.content }
          ]
        }
      } else {
        url = this.config.customEndpoints?.addComment || `${this.config.baseUrl}/api/tickets/${ticketId}/comments`
        payload = {
          content: comment.content,
          isPublic: comment.isPublic !== false
        }
      }

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        return {
          success: true,
          message: 'Comment added successfully'
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to add comment: ${response.status} ${errorText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add comment'
      }
    }
  }

  /**
   * Map priority from our system to ITSM system
   */
  private mapPriority(priority?: string): string {
    if (!priority) return '3' // Medium default

    const mapping = this.config.fieldMappings?.priority || {
      'LOW': '4',
      'MEDIUM': '3',
      'HIGH': '2',
      'URGENT': '1'
    }

    return mapping[priority] || '3'
  }

  /**
   * Map ticket data to ITSM format
   */
  mapTicketToITSM(ticket: {
    title: string
    description?: string | null
    priority?: string
    status?: string
    assignees?: Array<{ user?: { email?: string } }>
    tags?: Array<{ name?: string }>
  }): ITSMTicket {
    return {
      title: ticket.title,
      description: ticket.description || undefined,
      priority: ticket.priority || undefined,
      status: ticket.status || undefined
    }
  }
}

