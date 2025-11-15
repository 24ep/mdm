export interface Report {
  id: string
  name: string
  description?: string
  sourceType: ReportSourceType
  sourceId?: string
  spaceId?: string
  space?: {
    id: string
    name: string
    slug: string
  }
  url?: string
  embedUrl?: string
  createdAt: Date
  updatedAt: Date
}

export type ReportSourceType = 'power-bi' | 'grafana' | 'looker-studio' | 'custom' | 'plugin'

export interface ReportFilters {
  sourceType?: ReportSourceType
  spaceId?: string | null
}

export interface ReportsListProps {
  spaceId?: string | null
  showFilters?: boolean
  showSpaceSelector?: boolean
  viewMode?: 'list' | 'tree'
}

