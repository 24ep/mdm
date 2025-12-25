export type RecentItemType = 'tool' | 'page' | 'space'
export type RecentItemCategory = 'tools' | 'admin' | 'system' | 'content' | 'overview'

export interface RecentItem {
  id: string
  type: RecentItemType
  name: string
  icon?: string
  color?: string
  url?: string
  tabId?: string
  category?: RecentItemCategory
  description?: string
  accessedAt: number
}

const STORAGE_KEY = 'mdm-recent-items'
const MAX_ITEMS = 20 // Increased from 10

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

export function getRecentItemsByCategory(category: RecentItemCategory, limit: number = MAX_ITEMS): RecentItem[] {
  try {
    const allItems = getRecentItems(MAX_ITEMS)
    return allItems.filter(item => item.category === category).slice(0, limit)
  } catch (error) {
    console.error('Failed to filter recent items by category:', error)
    return []
  }
}

export function getRecentItemsByType(type: RecentItemType, limit: number = MAX_ITEMS): RecentItem[] {
  try {
    const allItems = getRecentItems(MAX_ITEMS)
    return allItems.filter(item => item.type === type).slice(0, limit)
  } catch (error) {
    console.error('Failed to filter recent items by type:', error)
    return []
  }
}

export function removeRecentItem(id: string, type: RecentItemType): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    
    const recent: RecentItem[] = JSON.parse(stored)
    const filtered = recent.filter(
      (r) => !(r.id === id && r.type === type)
    )
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove recent item:', error)
  }
}

export function clearRecentItems(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear recent items:', error)
  }
}

export function getRelativeTimeString(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return new Date(timestamp).toLocaleDateString()
}
