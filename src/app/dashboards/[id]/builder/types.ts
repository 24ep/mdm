export interface ToolboxItem {
  id: string
  name: string
  icon: any
  type: string
  chart_type?: string
  description: string
  defaultSize: { width: number; height: number }
}

export interface ToolboxGroup {
  id: string
  name: string
  icon: any
  items: ToolboxItem[]
  collapsed?: boolean
}

export interface ShareSettings {
  visibility: 'PRIVATE' | 'RESTRICTED' | 'PUBLIC'
  allowed_users: string[]
  embed_enabled: boolean
  public_link?: string
}
