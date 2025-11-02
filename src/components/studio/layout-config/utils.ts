import { ComponentConfig } from './types'

// Map built-in page IDs to menuItems keys
export function getMenuItemKey(pageId: string): keyof NonNullable<ComponentConfig['menuItems']> | null {
  if (pageId === 'space-settings') return 'space-settings'
  if (pageId === 'dashboard') return 'dashboard'
  if (pageId === 'assignment') return 'assignment'
  if (pageId === 'workflows') return 'workflows'
  if (pageId === 'bulk-action') return 'bulkAction'
  return null
}

// Check if a page (built-in or custom) is visible in sidebar
export function isPageVisibleInSidebar(
  pageId: string, 
  pageType: 'built-in' | 'custom',
  componentConfigs: Record<string, ComponentConfig>,
  getMenuItemKey: (pageId: string) => keyof NonNullable<ComponentConfig['menuItems']> | null
): boolean {
  if (pageType === 'built-in') {
    const menuKey = getMenuItemKey(pageId)
    if (!menuKey) return false
    return componentConfigs.sidebar.menuItems?.[menuKey] ?? false
  } else {
    // For custom pages, use the page ID directly
    return componentConfigs.sidebar.menuItems?.[pageId] ?? true // Default to true for custom pages
  }
}

