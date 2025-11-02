export type RecentItemType = 'tool' | 'page' | 'space'

export interface RecentItem {
  id: string
  type: RecentItemType
  name: string
  icon?: string
  color?: string
  url?: string
  tabId?: string
  accessedAt: number
}

const STORAGE_KEY = 'mdm-recent-items'
const MAX_ITEMS = 10

export function addRecentItem(item: Omit<RecentItem, 'accessedAt'>): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const recent: RecentItem[] = stored ? JSON.parse(stored) : []
    
    // Remove existing item with same id and type
    const filtered = recent.filter(
      (r) => !(r.id === item.id && r.type === item.type)
    )
    
    // Add new item at the beginning
    const newItem: RecentItem = {
      ...item,
      accessedAt: Date.now(),
    }
    
    const updated = [newItem, ...filtered].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save recent item:', error)
  }
}

export function getRecentItems(limit: number = MAX_ITEMS): RecentItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const recent: RecentItem[] = JSON.parse(stored)
    return recent.slice(0, limit)
  } catch (error) {
    console.error('Failed to load recent items:', error)
    return []
  }
}

export function clearRecentItems(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear recent items:', error)
  }
}

