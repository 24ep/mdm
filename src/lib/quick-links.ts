export interface QuickLink {
  id: string
  name: string
  url: string
  category?: string
  faviconUrl?: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'mdm-quick-links'

export function getQuickLinks(category?: string): QuickLink[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const links: QuickLink[] = JSON.parse(stored)
    if (category) {
      return links.filter(link => link.category === category)
    }
    return links
  } catch (error) {
    console.error('Failed to load quick links:', error)
    return []
  }
}

export function addQuickLink(link: Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt'>): QuickLink {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const links: QuickLink[] = stored ? JSON.parse(stored) : []
    
    const newLink: QuickLink = {
      ...link,
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    const updated = [...links, newLink]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return newLink
  } catch (error) {
    console.error('Failed to save quick link:', error)
    throw error
  }
}

export function updateQuickLink(id: string, updates: Partial<Omit<QuickLink, 'id' | 'createdAt'>>): QuickLink | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const links: QuickLink[] = JSON.parse(stored)
    const index = links.findIndex(link => link.id === id)
    
    if (index === -1) return null
    
    const updatedLink: QuickLink = {
      ...links[index],
      ...updates,
      updatedAt: Date.now(),
    }
    
    links[index] = updatedLink
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
    return updatedLink
  } catch (error) {
    console.error('Failed to update quick link:', error)
    throw error
  }
}

export function deleteQuickLink(id: string): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return false
    
    const links: QuickLink[] = JSON.parse(stored)
    const filtered = links.filter(link => link.id !== id)
    
    if (filtered.length === links.length) return false
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Failed to delete quick link:', error)
    throw error
  }
}

export function getCategories(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const links: QuickLink[] = JSON.parse(stored)
    const categories = new Set<string>()
    
    links.forEach(link => {
      if (link.category) {
        categories.add(link.category)
      }
    })
    
    return Array.from(categories).sort()
  } catch (error) {
    console.error('Failed to get categories:', error)
    return []
  }
}

export function clearQuickLinks(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear quick links:', error)
  }
}

