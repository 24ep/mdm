/**
 * Audit Logger Utility
 * Logs all actions for compliance and debugging
 */

export interface AuditLogData {
  action: string
  resource_type: 'report' | 'category' | 'folder' | 'integration' | 'permission' | 'share_link'
  resource_id?: string
  details?: Record<string, any>
}

export async function logAuditEvent(data: AuditLogData) {
  try {
    await fetch('/api/reports/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  } catch (error) {
    // Silently fail - audit logging should not break the app
    console.error('Failed to log audit event:', error)
  }
}

// Convenience functions for common actions
export const auditLogger = {
  reportCreated: (reportId: string, details?: Record<string, any>) =>
    logAuditEvent({ action: 'create', resource_type: 'report', resource_id: reportId, details }),
  
  reportUpdated: (reportId: string, details?: Record<string, any>) =>
    logAuditEvent({ action: 'update', resource_type: 'report', resource_id: reportId, details }),
  
  reportDeleted: (reportId: string, details?: Record<string, any>) =>
    logAuditEvent({ action: 'delete', resource_type: 'report', resource_id: reportId, details }),
  
  reportViewed: (reportId: string) =>
    logAuditEvent({ action: 'view', resource_type: 'report', resource_id: reportId }),
  
  reportExported: (reportId: string, format: string) =>
    logAuditEvent({ action: 'export', resource_type: 'report', resource_id: reportId, details: { format } }),
  
  reportShared: (reportId: string, linkId: string) =>
    logAuditEvent({ action: 'share', resource_type: 'share_link', resource_id: linkId, details: { report_id: reportId } }),
  
  categoryCreated: (categoryId: string) =>
    logAuditEvent({ action: 'create', resource_type: 'category', resource_id: categoryId }),
  
  categoryUpdated: (categoryId: string) =>
    logAuditEvent({ action: 'update', resource_type: 'category', resource_id: categoryId }),
  
  categoryDeleted: (categoryId: string) =>
    logAuditEvent({ action: 'delete', resource_type: 'category', resource_id: categoryId }),
  
  folderCreated: (folderId: string) =>
    logAuditEvent({ action: 'create', resource_type: 'folder', resource_id: folderId }),
  
  folderUpdated: (folderId: string) =>
    logAuditEvent({ action: 'update', resource_type: 'folder', resource_id: folderId }),
  
  folderDeleted: (folderId: string) =>
    logAuditEvent({ action: 'delete', resource_type: 'folder', resource_id: folderId }),
  
  integrationConfigured: (integrationId: string, source: string) =>
    logAuditEvent({ action: 'configure', resource_type: 'integration', resource_id: integrationId, details: { source } }),
  
  permissionChanged: (reportId: string, permissionId: string) =>
    logAuditEvent({ action: 'update', resource_type: 'permission', resource_id: permissionId, details: { report_id: reportId } }),
}

