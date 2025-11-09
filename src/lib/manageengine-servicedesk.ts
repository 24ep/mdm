export interface ManageEngineServiceDeskConfig {
  baseUrl: string // e.g., https://yourcompany.servicedeskplus.com
  apiKey: string // API key for authentication
  technicianKey?: string // Optional technician key
}

export interface ServiceDeskTicket {
  subject: string
  description: string
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  requester?: string // Email or user ID
  category?: string
  subcategory?: string
  item?: string
  group?: string
  technician?: string
  dueDate?: string
  customFields?: Record<string, any>
}

export interface ServiceDeskResponse {
  success: boolean
  requestId?: string
  message?: string
  error?: string
  data?: any
}

export interface ServiceDeskComment {
  content: string
  isPublic?: boolean
  addToLateralMenu?: boolean
}

export interface ServiceDeskAttachment {
  file: File | Blob
  fileName: string
  description?: string
}

export interface ServiceDeskResolution {
  resolution: string
  resolvedBy?: string
  resolvedTime?: string
}

export interface ServiceDeskTimeEntry {
  hours: number
  minutes?: number
  description?: string
  billable?: boolean
  technician?: string
}

export interface ServiceDeskTicketLink {
  linkedRequestId: string
  linkType?: 'relates_to' | 'duplicate' | 'depends_on' | 'blocked_by'
}

export class ManageEngineServiceDeskService {
  private config: ManageEngineServiceDeskConfig
  private enableRetry: boolean = true

  constructor(config: ManageEngineServiceDeskConfig, options?: { enableRetry?: boolean }) {
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
      
      // If rate limited, throw to trigger retry
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
   * Test the connection to ServiceDesk
   */
  async testConnection(): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests?input_data=${encodeURIComponent(JSON.stringify({ list_info: { start_index: 0, row_count: 1 } }))}`
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        }
      })

      if (response.ok || response.status === 200) {
        return {
          success: true,
          message: 'Connection successful'
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Connection failed: ${response.status} ${errorText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Create a ticket in ServiceDesk
   */
  async createTicket(ticket: ServiceDeskTicket): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests`
      
      // Map priority from our system to ServiceDesk
      const priorityMap: Record<string, string> = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High',
        'CRITICAL': 'Critical'
      }

      // Build request payload
      const inputData: any = {
        request: {
          subject: ticket.subject,
          description: ticket.description,
          priority: {
            name: priorityMap[ticket.priority || ''] || ticket.priority || 'Medium'
          }
        }
      }

      // Add optional fields
      if (ticket.requester) {
        inputData.request.requester = {
          email_id: ticket.requester
        }
      }

      if (ticket.category) {
        inputData.request.category = {
          name: ticket.category
        }
      }

      if (ticket.subcategory) {
        inputData.request.subcategory = {
          name: ticket.subcategory
        }
      }

      if (ticket.item) {
        inputData.request.item = {
          name: ticket.item
        }
      }

      if (ticket.group) {
        inputData.request.group = {
          name: ticket.group
        }
      }

      if (ticket.technician) {
        inputData.request.technician = {
          email_id: ticket.technician
        }
      }

      if (ticket.dueDate) {
        inputData.request.due_by_time = ticket.dueDate
      }

      if (ticket.status) {
        inputData.request.status = {
          name: ticket.status
        }
      }

      // Add custom fields if provided
      if (ticket.customFields) {
        inputData.request.custom_fields = ticket.customFields
      }

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        },
        body: JSON.stringify({
          input_data: inputData
        })
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        const requestId = responseData?.request?.id || responseData?.id
        return {
          success: true,
          requestId: requestId?.toString(),
          message: 'Ticket created successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to create ticket: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Update a ticket in ServiceDesk
   */
  async updateTicket(requestId: string, updates: Partial<ServiceDeskTicket>): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}`
      
      const inputData: any = {
        request: {}
      }

      if (updates.subject) inputData.request.subject = updates.subject
      if (updates.description) inputData.request.description = updates.description
      if (updates.priority) {
        inputData.request.priority = { name: updates.priority }
      }
      if (updates.status) {
        inputData.request.status = { name: updates.status }
      }
      if (updates.technician) {
        inputData.request.technician = { email_id: updates.technician }
      }
      if (updates.dueDate) {
        inputData.request.due_by_time = updates.dueDate
      }
      if (updates.customFields) {
        inputData.request.custom_fields = updates.customFields
      }

      const response = await this.executeFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        },
        body: JSON.stringify({
          input_data: inputData
        })
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        // Invalidate ticket cache
        const { deleteCached, cacheKeys } = await import('./servicedesk-cache')
        await deleteCached(cacheKeys.ticket(requestId)).catch(() => {})

        return {
          success: true,
          requestId: requestId,
          message: 'Ticket updated successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to update ticket: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get ticket details from ServiceDesk
   */
  async getTicket(requestId: string, useCache: boolean = true): Promise<ServiceDeskResponse> {
    // Check cache first
    if (useCache) {
      const { getCached, setCached, cacheKeys } = await import('./servicedesk-cache')
      const cached = await getCached<ServiceDeskResponse>(cacheKeys.ticket(requestId))
      if (cached) {
        return cached
      }
    }

    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}`
      
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        }
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        const result: ServiceDeskResponse = {
          success: true,
          requestId: requestId,
          message: 'Ticket retrieved successfully',
          data: responseData
        }

        // Cache the result
        if (useCache) {
          const { setCached, cacheKeys } = await import('./servicedesk-cache')
          await setCached(cacheKeys.ticket(requestId), result, 300) // 5 minutes
        }

        return result
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to get ticket: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Map our ticket format to ServiceDesk format
   */
  mapTicketToServiceDesk(ourTicket: {
    title: string
    description?: string | null
    priority?: string
    status?: string
    assignedTo?: string
    dueDate?: string | Date | null
    requesterEmail?: string
    tags?: Array<{ name: string }>
    attributes?: Array<{ name: string; value: any }>
  }): ServiceDeskTicket {
    const ticket: ServiceDeskTicket = {
      subject: ourTicket.title,
      description: ourTicket.description || '',
      priority: this.mapPriority(ourTicket.priority),
      status: this.mapStatus(ourTicket.status),
      requester: ourTicket.requesterEmail
    }

    if (ourTicket.dueDate) {
      const dueDate = ourTicket.dueDate instanceof Date 
        ? ourTicket.dueDate.toISOString() 
        : new Date(ourTicket.dueDate).toISOString()
      ticket.dueDate = dueDate
    }

    // Detect ticket type from attributes first (more reliable)
    let ticketType: string | null = null
    if (ourTicket.attributes && ourTicket.attributes.length > 0) {
      const typeAttr = ourTicket.attributes.find(attr => 
        attr.name.toLowerCase() === 'ticket type' || 
        attr.name.toLowerCase() === 'type' ||
        attr.name.toLowerCase() === 'tickettype'
      )
      if (typeAttr && typeAttr.value) {
        ticketType = String(typeAttr.value)
      }
    }

    // If no type from attributes, check tags for common ticket types
    if (!ticketType && ourTicket.tags && ourTicket.tags.length > 0) {
      const typeTags = ['Request', 'Change', 'Change Request', 'Issue', 'Problem', 'Incident']
      const foundTypeTag = ourTicket.tags.find(tag => 
        typeTags.some(type => tag.name.toLowerCase().includes(type.toLowerCase()))
      )
      if (foundTypeTag) {
        ticketType = foundTypeTag.name
      }
    }

    // Map ticket type to category, or use first tag as fallback
    if (ticketType) {
      ticket.category = this.normalizeTicketType(ticketType)
    } else if (ourTicket.tags && ourTicket.tags.length > 0) {
      ticket.category = ourTicket.tags[0].name
    }

    // Map custom attributes
    if (ourTicket.attributes && ourTicket.attributes.length > 0) {
      ticket.customFields = {}
      ourTicket.attributes.forEach(attr => {
        // Don't duplicate ticket type in custom fields if it's already the category
        if (attr.name.toLowerCase() !== 'ticket type' && 
            attr.name.toLowerCase() !== 'type' &&
            attr.name.toLowerCase() !== 'tickettype') {
          ticket.customFields![attr.name] = attr.value
        } else {
          // Still include it in custom fields for reference
          ticket.customFields![attr.name] = attr.value
        }
      })
    }

    return ticket
  }

  /**
   * Normalize ticket type to standard ServiceDesk categories
   */
  private normalizeTicketType(type: string): string {
    const normalized = type.trim()
    const lower = normalized.toLowerCase()
    
    // Map common variations to standard types
    if (lower.includes('request') && !lower.includes('change')) {
      return 'Request'
    }
    if (lower.includes('change')) {
      return 'Change Request'
    }
    if (lower.includes('issue')) {
      return 'Issue'
    }
    if (lower.includes('problem')) {
      return 'Problem'
    }
    if (lower.includes('incident')) {
      return 'Incident'
    }
    
    // Return as-is if no match
    return normalized
  }

  private mapPriority(priority?: string | null): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (!priority) return 'Medium'
    
    const upperPriority = priority.toUpperCase()
    switch (upperPriority) {
      case 'LOW':
        return 'Low'
      case 'MEDIUM':
        return 'Medium'
      case 'HIGH':
        return 'High'
      case 'CRITICAL':
      case 'URGENT':
        return 'Critical'
      default:
        return 'Medium'
    }
  }

  private mapStatus(status?: string | null): 'Open' | 'In Progress' | 'Resolved' | 'Closed' {
    if (!status) return 'Open'
    
    const upperStatus = status.toUpperCase()
    switch (upperStatus) {
      case 'BACKLOG':
      case 'TODO':
        return 'Open'
      case 'IN_PROGRESS':
      case 'IN PROGRESS':
        return 'In Progress'
      case 'RESOLVED':
      case 'DONE':
        return 'Resolved'
      case 'CLOSED':
      case 'CANCELLED':
        return 'Closed'
      default:
        return 'Open'
    }
  }

  /**
   * Add a comment/note to a ServiceDesk ticket
   */
  async addComment(requestId: string, comment: ServiceDeskComment): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}/notes`
      
      const inputData: any = {
        note: {
          content: comment.content,
          is_public: comment.isPublic !== false, // Default to public
          add_to_lateral_menu: comment.addToLateralMenu || false
        }
      }

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        },
        body: JSON.stringify({
          input_data: inputData
        })
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        // Invalidate comments cache
        const { deleteCached, cacheKeys } = await import('./servicedesk-cache')
        await deleteCached(cacheKeys.comments(requestId)).catch(() => {})

        return {
          success: true,
          requestId: requestId,
          message: 'Comment added successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to add comment: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get comments/notes for a ServiceDesk ticket
   */
  async getComments(requestId: string): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}/notes`
      
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        }
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return {
          success: true,
          requestId: requestId,
          message: 'Comments retrieved successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to get comments: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Upload attachment to a ServiceDesk ticket
   */
  async uploadAttachment(requestId: string, attachment: ServiceDeskAttachment): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}/attachments`
      
      const formData = new FormData()
      formData.append('file', attachment.file, attachment.fileName)
      if (attachment.description) {
        formData.append('description', attachment.description)
      }

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: {
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: formData
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        // Invalidate attachments cache
        const { deleteCached, cacheKeys } = await import('./servicedesk-cache')
        await deleteCached(cacheKeys.attachments(requestId)).catch(() => {})

        return {
          success: true,
          requestId: requestId,
          message: 'Attachment uploaded successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to upload attachment: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get attachments for a ServiceDesk ticket
   */
  async getAttachments(requestId: string): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}/attachments`
      
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        }
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return {
          success: true,
          requestId: requestId,
          message: 'Attachments retrieved successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to get attachments: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Set resolution for a ServiceDesk ticket
   */
  async setResolution(requestId: string, resolution: ServiceDeskResolution): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}`
      
      const inputData: any = {
        request: {
          resolution: {
            content: resolution.resolution
          }
        }
      }

      if (resolution.resolvedBy) {
        inputData.request.resolved_by = {
          email_id: resolution.resolvedBy
        }
      }

      if (resolution.resolvedTime) {
        inputData.request.resolved_time = resolution.resolvedTime
      }

      const response = await this.executeFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        },
        body: JSON.stringify({
          input_data: inputData
        })
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return {
          success: true,
          requestId: requestId,
          message: 'Resolution set successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to set resolution: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Log time to a ServiceDesk ticket
   */
  async logTime(requestId: string, timeEntry: ServiceDeskTimeEntry): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}/worklogs`
      
      const inputData: any = {
        worklog: {
          hours: timeEntry.hours,
          minutes: timeEntry.minutes || 0,
          description: timeEntry.description || '',
          billable: timeEntry.billable || false
        }
      }

      if (timeEntry.technician) {
        inputData.worklog.technician = {
          email_id: timeEntry.technician
        }
      }

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        },
        body: JSON.stringify({
          input_data: inputData
        })
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        // Invalidate time logs cache
        const { deleteCached, cacheKeys } = await import('./servicedesk-cache')
        await deleteCached(cacheKeys.timeLogs(requestId)).catch(() => {})

        return {
          success: true,
          requestId: requestId,
          message: 'Time logged successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to log time: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get time logs for a ServiceDesk ticket
   */
  async getTimeLogs(requestId: string): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}/worklogs`
      
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        }
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return {
          success: true,
          requestId: requestId,
          message: 'Time logs retrieved successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to get time logs: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Link tickets in ServiceDesk
   */
  async linkTickets(requestId: string, link: ServiceDeskTicketLink): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}/link_requests`
      
      const inputData: any = {
        link_requests: {
          link_requests: [{
            linked_request: {
              id: link.linkedRequestId
            },
            link_type: {
              name: link.linkType || 'relates_to'
            }
          }]
        }
      }

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        },
        body: JSON.stringify({
          input_data: inputData
        })
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return {
          success: true,
          requestId: requestId,
          message: 'Tickets linked successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to link tickets: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * List/Search tickets from ServiceDesk
   */
  async listTickets(filters?: {
    status?: string
    priority?: string
    technician?: string
    requester?: string
    category?: string
    startIndex?: number
    rowCount?: number
    searchFields?: Record<string, any>
    search?: string
  }): Promise<ServiceDeskResponse> {
    try {
      const listInfo: any = {
        start_index: filters?.startIndex || 0,
        row_count: filters?.rowCount || 50
      }

      const searchCriteria: any = {}
      
      if (filters?.status) {
        searchCriteria.status = { name: filters.status }
      }
      if (filters?.priority) {
        searchCriteria.priority = { name: filters.priority }
      }
      if (filters?.technician) {
        searchCriteria.technician = { email_id: filters.technician }
      }
      if (filters?.requester) {
        searchCriteria.requester = { email_id: filters.requester }
      }
      if (filters?.category) {
        searchCriteria.category = { name: filters.category }
      }
      if (filters?.search) {
        // Add text search on subject
        searchCriteria.subject = { contains: filters.search }
      }
      if (filters?.searchFields) {
        Object.assign(searchCriteria, filters.searchFields)
      }

      const inputData: any = {
        list_info: listInfo
      }

      if (Object.keys(searchCriteria).length > 0) {
        inputData.search_criteria = searchCriteria
      }

      const url = `${this.config.baseUrl}/api/v3/requests?input_data=${encodeURIComponent(JSON.stringify(inputData))}`
      
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        }
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return {
          success: true,
          message: 'Tickets retrieved successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to list tickets: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Delete a ticket in ServiceDesk
   */
  async deleteTicket(requestId: string): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}`
      
      const response = await this.executeFetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        }
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok || response.status === 204) {
        return {
          success: true,
          requestId: requestId,
          message: 'Ticket deleted successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to delete ticket: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}

