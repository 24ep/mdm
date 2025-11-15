export interface Dashboard {
  id: string
  name: string
  description?: string
  spaceId?: string
  space?: {
    id: string
    name: string
    slug: string
  }
  layout?: any
  widgets?: DashboardWidget[]
  createdAt: Date
  updatedAt: Date
}

export interface DashboardWidget {
  id: string
  type: string
  config: any
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface DashboardFilters {
  spaceId?: string | null
}

export interface DashboardsListProps {
  spaceId?: string | null
  showFilters?: boolean
  showSpaceSelector?: boolean
}

