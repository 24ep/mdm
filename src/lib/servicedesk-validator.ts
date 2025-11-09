/**
 * Data validation utilities for ServiceDesk integration
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate ticket data before pushing to ServiceDesk
 */
export function validateTicketData(ticket: {
  title?: string | null
  description?: string | null
  priority?: string | null
  status?: string | null
  dueDate?: string | Date | null
  requesterEmail?: string | null
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!ticket.title || ticket.title.trim().length === 0) {
    errors.push('Ticket title is required')
  } else if (ticket.title.length > 255) {
    errors.push('Ticket title must be 255 characters or less')
  }

  // Description validation
  if (ticket.description && ticket.description.length > 10000) {
    warnings.push('Description is very long (>10,000 chars), may be truncated by ServiceDesk')
  }

  // Priority validation
  if (ticket.priority) {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']
    if (!validPriorities.includes(ticket.priority.toUpperCase())) {
      warnings.push(`Priority "${ticket.priority}" may not map correctly to ServiceDesk`)
    }
  }

  // Status validation
  if (ticket.status) {
    const validStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CLOSED', 'CANCELLED']
    if (!validStatuses.includes(ticket.status.toUpperCase())) {
      warnings.push(`Status "${ticket.status}" may not map correctly to ServiceDesk`)
    }
  }

  // Email validation
  if (ticket.requesterEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(ticket.requesterEmail)) {
      errors.push('Requester email is not a valid email address')
    }
  }

  // Due date validation
  if (ticket.dueDate) {
    const dueDate = ticket.dueDate instanceof Date 
      ? ticket.dueDate 
      : new Date(ticket.dueDate)
    
    if (isNaN(dueDate.getTime())) {
      errors.push('Due date is not a valid date')
    } else if (dueDate < new Date()) {
      warnings.push('Due date is in the past')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Sanitize ticket data for ServiceDesk
 */
export function sanitizeTicketData(ticket: {
  title?: string | null
  description?: string | null
  priority?: string | null
  status?: string | null
  dueDate?: string | Date | null
  requesterEmail?: string | null
}): {
  title: string
  description: string
  priority?: string
  status?: string
  dueDate?: string
  requesterEmail?: string
} {
  return {
    title: (ticket.title || '').trim().substring(0, 255),
    description: (ticket.description || '').substring(0, 10000),
    priority: ticket.priority ? ticket.priority.toUpperCase() : undefined,
    status: ticket.status ? ticket.status.toUpperCase() : undefined,
    dueDate: ticket.dueDate 
      ? (ticket.dueDate instanceof Date 
          ? ticket.dueDate.toISOString() 
          : new Date(ticket.dueDate).toISOString())
      : undefined,
    requesterEmail: ticket.requesterEmail ? ticket.requesterEmail.trim().toLowerCase() : undefined
  }
}

/**
 * Validate ServiceDesk configuration
 */
export function validateServiceDeskConfig(config: {
  baseUrl?: string | null
  apiKey?: string | null
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config.baseUrl || config.baseUrl.trim().length === 0) {
    errors.push('ServiceDesk base URL is required')
  } else {
    try {
      const url = new URL(config.baseUrl)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        errors.push('ServiceDesk base URL must use http or https protocol')
      }
    } catch {
      errors.push('ServiceDesk base URL is not a valid URL')
    }
  }

  if (!config.apiKey || config.apiKey.trim().length === 0) {
    errors.push('ServiceDesk API key is required')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

