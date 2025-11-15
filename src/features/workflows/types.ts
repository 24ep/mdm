export interface Workflow {
  id: string
  name: string
  description?: string
  spaceId?: string
  space?: {
    id: string
    name: string
    slug: string
  }
  status: WorkflowStatus
  steps?: WorkflowStep[]
  createdAt: Date
  updatedAt: Date
}

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived'

export interface WorkflowStep {
  id: string
  type: string
  config: any
  order: number
}

export interface WorkflowFilters {
  status?: WorkflowStatus
  spaceId?: string | null
}

export interface WorkflowsListProps {
  spaceId?: string | null
  showFilters?: boolean
  showSpaceSelector?: boolean
}

