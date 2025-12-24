export type NotebookRole = 'owner' | 'editor' | 'contributor' | 'viewer'

export interface ProjectNotebook {
  id: string
  name: string
  description?: string
  role: NotebookRole
  updatedAt: string
}

export const mockProjects: ProjectNotebook[] = [
  { id: 'nb-1', name: 'Sales Analysis', description: 'Monthly sales KPIs', role: 'editor', updatedAt: new Date().toISOString() },
  { id: 'nb-2', name: 'Churn Model', description: 'XGBoost churn prediction', role: 'viewer', updatedAt: new Date().toISOString() },
  { id: 'nb-3', name: 'SQL Exploration', description: 'Warehouse queries', role: 'contributor', updatedAt: new Date().toISOString() }
]

export function getRoleCapabilities(role: NotebookRole): { canEdit: boolean; canExecute: boolean; canShare: boolean } {
  switch (role) {
    case 'owner': return { canEdit: true, canExecute: true, canShare: true }
    case 'editor': return { canEdit: true, canExecute: true, canShare: false }
    case 'contributor': return { canEdit: false, canExecute: true, canShare: false }
    case 'viewer':
    default:
      return { canEdit: false, canExecute: false, canShare: false }
  }
}
