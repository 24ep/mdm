import { TemplateManager } from './template-manager'
import { TemplateGenerator } from './template-generator'
import { Template, DataModel } from './template-generator'

export interface SpaceStudioPage {
  id: string
  name: string
  displayName: string
  description: string
  templateId?: string
  isCustom: boolean
  path: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SpaceStudioConfig {
  id: string
  spaceId: string
  pages: SpaceStudioPage[]
  sidebarConfig: {
    items: Array<{
      id: string
      type: 'page' | 'divider' | 'group' | 'text'
      name: string
      icon?: string
      color?: string
      pageId?: string
      children?: any[]
    }>
    background: string
    textColor: string
    fontSize: string
  }
  version: string
  createdAt: string
  updatedAt: string
}

export class SpaceStudioManager {
  private static readonly STORAGE_KEY = 'space_studio_configs'
  private static readonly API_BASE = '/api/space-studio'

  /**
   * Get space studio configuration for a space
   */
  static async getSpaceStudioConfig(spaceId: string): Promise<SpaceStudioConfig | null> {
    try {
      // Try to fetch from API first
      const response = await fetch(`${this.API_BASE}/${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        return data.config
      }
    } catch (error) {
      console.warn('Failed to fetch space studio config from API, using local storage:', error)
    }

    // Fallback to local storage
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      const configs: Record<string, SpaceStudioConfig> = JSON.parse(stored)
      return configs[spaceId] || null
    }

    return null
  }

  /**
   * Save space studio configuration
   */
  static async saveSpaceStudioConfig(config: SpaceStudioConfig): Promise<void> {
    try {
      // Try to save to API first
      const response = await fetch(`${this.API_BASE}/${config.spaceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        return
      }
    } catch (error) {
      console.warn('Failed to save space studio config to API, using local storage:', error)
    }

    // Fallback to local storage
    const stored = localStorage.getItem(this.STORAGE_KEY)
    const configs: Record<string, SpaceStudioConfig> = stored ? JSON.parse(stored) : {}
    configs[config.spaceId] = { ...config, updatedAt: new Date().toISOString() }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs))
  }

  /**
   * Create default space studio configuration
   */
  static async createDefaultConfig(spaceId: string): Promise<SpaceStudioConfig> {
    const now = new Date().toISOString()
    const defaultPages: SpaceStudioPage[] = [
      {
        id: 'dashboard',
        name: 'dashboard',
        displayName: 'Dashboard',
        description: 'Main dashboard with key metrics, charts, and recent activity overview',
        isCustom: false,
        path: '/dashboard',
        order: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'customers',
        name: 'customers',
        displayName: 'Customer Management',
        description: 'Manage customer data, profiles, and relationships with advanced filtering and search',
        isCustom: false,
        path: '/customers',
        order: 2,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'analytics',
        name: 'analytics',
        displayName: 'Analytics & Reports',
        description: 'Comprehensive analytics dashboard with interactive charts and custom reports',
        isCustom: false,
        path: '/analytics',
        order: 3,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'projects',
        name: 'projects',
        displayName: 'Project Management',
        description: 'Track projects, tasks, deadlines, and team collaboration in one place',
        isCustom: false,
        path: '/projects',
        order: 4,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'inventory',
        name: 'inventory',
        displayName: 'Inventory Control',
        description: 'Monitor stock levels, manage suppliers, and track product movements',
        isCustom: false,
        path: '/inventory',
        order: 5,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'employee-portal',
        name: 'employee-portal',
        displayName: 'Employee Portal',
        description: 'Self-service portal for employees to manage their information and requests',
        templateId: 'employee-portal-template',
        isCustom: false,
        path: '/employee-portal',
        order: 6,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sales-dashboard',
        name: 'sales-dashboard',
        displayName: 'Sales Dashboard',
        description: 'Real-time sales performance tracking with pipeline visualization',
        templateId: 'sales-dashboard-template',
        isCustom: false,
        path: '/sales-dashboard',
        order: 7,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'settings',
        name: 'settings',
        displayName: 'System Settings',
        description: 'Configure system preferences, user permissions, and integration settings',
        isCustom: false,
        path: '/settings',
        order: 8,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]

    const config: SpaceStudioConfig = {
      id: `config_${spaceId}_${Date.now()}`,
      spaceId,
      pages: defaultPages,
      sidebarConfig: {
        items: defaultPages.map(page => {
          const iconMap: Record<string, string> = {
            'dashboard': 'LayoutDashboard',
            'customers': 'Users',
            'analytics': 'BarChart3',
            'projects': 'FolderKanban',
            'inventory': 'Package',
            'employee-portal': 'UserCheck',
            'sales-dashboard': 'TrendingUp',
            'settings': 'Settings'
          }
          const colorMap: Record<string, string> = {
            'dashboard': '#3b82f6',
            'customers': '#10b981',
            'analytics': '#f59e0b',
            'projects': '#8b5cf6',
            'inventory': '#ef4444',
            'employee-portal': '#06b6d4',
            'sales-dashboard': '#84cc16',
            'settings': '#6b7280'
          }
          return {
            id: page.id,
            type: 'page' as const,
            name: page.displayName,
            icon: iconMap[page.id] || 'File',
            color: colorMap[page.id] || '#6b7280',
            pageId: page.id
          }
        }),
        background: '#ffffff',
        textColor: '#374151',
        fontSize: '14px'
      },
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await this.saveSpaceStudioConfig(config)
    return config
  }

  /**
   * Get all pages for a space
   */
  static async getPages(spaceId: string): Promise<SpaceStudioPage[]> {
    const config = await this.getSpaceStudioConfig(spaceId)
    return config?.pages || []
  }

  /**
   * Create a new page
   */
  static async createPage(spaceId: string, pageData: Partial<SpaceStudioPage>): Promise<SpaceStudioPage> {
    const config = await this.getSpaceStudioConfig(spaceId) || await this.createDefaultConfig(spaceId)
    
    const newPage: SpaceStudioPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: pageData.name || 'new-page',
      displayName: pageData.displayName || 'New Page',
      description: pageData.description || 'A new page',
      templateId: pageData.templateId,
      isCustom: pageData.isCustom ?? true,
      path: pageData.path || `/${pageData.name || 'new-page'}`,
      order: config.pages.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    config.pages.push(newPage)
    await this.saveSpaceStudioConfig(config)
    return newPage
  }

  /**
   * Update a page
   */
  static async updatePage(spaceId: string, pageId: string, updates: Partial<SpaceStudioPage>): Promise<void> {
    const config = await this.getSpaceStudioConfig(spaceId)
    if (!config) return

    const pageIndex = config.pages.findIndex(p => p.id === pageId)
    if (pageIndex >= 0) {
      config.pages[pageIndex] = {
        ...config.pages[pageIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      await this.saveSpaceStudioConfig(config)
    }
  }

  /**
   * Delete a page
   */
  static async deletePage(spaceId: string, pageId: string): Promise<void> {
    const config = await this.getSpaceStudioConfig(spaceId)
    if (!config) return

    config.pages = config.pages.filter(p => p.id !== pageId)
    await this.saveSpaceStudioConfig(config)
  }

  /**
   * Get templates available for a space
   */
  static async getAvailableTemplates(spaceId: string): Promise<Template[]> {
    // Get all templates
    const allTemplates = await TemplateManager.getTemplates()
    
    // Filter templates that are relevant to this space
    // For now, return all templates, but this could be filtered by space-specific criteria
    return allTemplates
  }

  /**
   * Assign a template to a page
   */
  static async assignTemplateToPage(spaceId: string, pageId: string, templateId: string): Promise<void> {
    await this.updatePage(spaceId, pageId, { templateId })
  }

  /**
   * Create a page from template
   */
  static async createPageFromTemplate(spaceId: string, templateId: string, pageData: Partial<SpaceStudioPage>): Promise<SpaceStudioPage> {
    const template = await TemplateManager.getTemplate(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    const newPage = await this.createPage(spaceId, {
      ...pageData,
      templateId,
      isCustom: false
    })

    return newPage
  }
}
