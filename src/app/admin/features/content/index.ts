/**
 * Content Feature
 * Main export file for the content feature
 */

// Components
export { KnowledgeBase } from './components/KnowledgeBase'
export { AttachmentManager } from './components/AttachmentManager'
export { ChangeRequests } from './components/ChangeRequests'
export { ProjectsManagement } from './components/ProjectsManagement'

// Types
export type {
  KnowledgeNotebook,
  Attachment,
  ChangeRequest,
  Ticket,
} from './types'

// Utils
export {
  formatFileSize,
  filterNotebooksBySearch,
  sortNotebooksByName,
  filterAttachmentsBySearch,
  filterAttachmentsByType,
  isAttachmentPublic,
  getChangeRequestStatusColor,
  isChangeRequestPending,
  filterChangeRequestsByStatus,
  getTicketPriorityColor,
  filterTicketsByStatus,
  filterTicketsByPriority,
} from './utils'

