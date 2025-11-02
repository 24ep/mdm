export interface WidgetGroup {
  id: string
  name: string
  widgetTypes: string[]
  collapsed?: boolean
}

export const WIDGET_GROUPS_STORAGE_KEY = 'layout-widget-groups'

