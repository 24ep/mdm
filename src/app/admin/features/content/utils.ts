/**
 * Content Feature Utilities
 * Helper functions for content operations
 */

import { Attachment, ChangeRequest, Ticket } from './types'
import { formatFileSize } from '@/lib/formatters'

// Re-export shared utilities
export { formatFileSize }

/**
 * Filter attachments by search query
 */
export function filterAttachmentsBySearch(
  attachments: Attachment[],
  query: string
): Attachment[] {
  if (!query.trim()) return attachments
  
  const lowerQuery = query.toLowerCase()
  return attachments.filter(attachment =>
    attachment.name?.toLowerCase().includes(lowerQuery) ||
    attachment.originalName?.toLowerCase().includes(lowerQuery) ||
    attachment.description?.toLowerCase().includes(lowerQuery) ||
    attachment.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Filter attachments by MIME type
 */
export function filterAttachmentsByType(
  attachments: Attachment[],
  mimeType: string
): Attachment[] {
  if (!mimeType || mimeType === 'all') return attachments
  return attachments.filter(attachment => attachment.mimeType === mimeType)
}

/**
 * Check if attachment is public
 */
export function isAttachmentPublic(attachment: Attachment): boolean {
  return attachment.isPublic === true
}

/**
 * Get change request status color
 */
export function getChangeRequestStatusColor(status: ChangeRequest['status']): string {
  switch (status) {
    case 'approved':
    case 'merged':
      return 'bg-green-600'
    case 'rejected':
      return 'bg-red-600'
    case 'pending':
      return 'bg-yellow-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Check if change request is pending
 */
export function isChangeRequestPending(changeRequest: ChangeRequest): boolean {
  return changeRequest.status === 'pending'
}

/**
 * Filter change requests by status
 */
export function filterChangeRequestsByStatus(
  changeRequests: ChangeRequest[],
  status: ChangeRequest['status'] | 'all'
): ChangeRequest[] {
  if (status === 'all') return changeRequests
  return changeRequests.filter(cr => cr.status === status)
}

/**
 * Get ticket priority color
 */
export function getTicketPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'critical':
      return 'bg-red-600'
    case 'medium':
      return 'bg-yellow-600'
    case 'low':
      return 'bg-blue-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Filter tickets by status
 */
export function filterTicketsByStatus(
  tickets: Ticket[],
  status: string
): Ticket[] {
  if (!status || status === 'all') return tickets
  return tickets.filter(ticket => ticket.status === status)
}

/**
 * Filter tickets by priority
 */
export function filterTicketsByPriority(
  tickets: Ticket[],
  priority: string
): Ticket[] {
  if (!priority || priority === 'all') return tickets
  return tickets.filter(ticket => ticket.priority === priority)
}

