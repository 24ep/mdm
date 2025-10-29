import { TemplateManager } from './template-manager'
import { TemplateGenerator } from './template-generator'
import { Template, DataModel } from './template-generator'

export interface SpacesEditorPage {
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

export interface SpacesEditorConfig {
  id: string
  spaceId: string
  pages: SpacesEditorPage[]
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

export class SpacesEditorManager {
  private static readonly STORAGE_KEY = 'spaces_editor_configs'
  private static readonly API_BASE = '/api/spaces-editor'

  /**
   * Get spaces editor configuration for a space
   */
  static async getSpacesEditorConfig(spaceId: string): Promise<SpacesEditorConfig | null> {
    try {
      // Try to fetch from API first
      const response = await fetch(`${this.API_BASE}/${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        return data.config
      }
    } catch (error) {
      console.warn('Failed to fetch spaces editor config from API, using local storage:', error)
    }

    // Fallback to local storage
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      const configs: Record<string, SpacesEditorConfig> = JSON.parse(stored)
      return configs[spaceId] || null
    }

    return null
  }

  /**
   * Save spaces editor configuration
   */
  static async saveSpacesEditorConfig(config: SpacesEditorConfig): Promise<void> {
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
      console.warn('Failed to save spaces editor config to API, using local storage:', error)
    }

    // Fallback to local storage
    const stored = localStorage.getItem(this.STORAGE_KEY)
    const configs: Record<string, SpacesEditorConfig> = stored ? JSON.parse(stored) : {}
    configs[config.spaceId] = { ...config, updatedAt: new Date().toISOString() }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs))
  }

  /**
   * Create default spaces editor configuration
   */
  static async createDefaultConfig(spaceId: string): Promise<SpacesEditorConfig> {
    const config: SpacesEditorConfig = {
      id: `config_${spaceId}_${Date.now()}`,
      spaceId,
      pages: [],
      sidebarConfig: {
        items: [],
        background: '#ffffff',
        textColor: '#374151',
        fontSize: '14px'
      },
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await this.saveSpacesEditorConfig(config)
    return config
  }

  /**
   * Get all pages for a space
   */
  static async getPages(spaceId: string): Promise<SpacesEditorPage[]> {
    const config = await this.getSpacesEditorConfig(spaceId)
    return config?.pages || []
  }

  /**
   * Create a new page
   */
  static async createPage(spaceId: string, pageData: Partial<SpacesEditorPage>): Promise<SpacesEditorPage> {
    const config = await this.getSpacesEditorConfig(spaceId) || await this.createDefaultConfig(spaceId)
    
    const newPage: SpacesEditorPage = {
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
    await this.saveSpacesEditorConfig(config)
    return newPage
  }

  /**
   * Update a page
   */
  static async updatePage(spaceId: string, pageId: string, updates: Partial<SpacesEditorPage>): Promise<void> {
    const config = await this.getSpacesEditorConfig(spaceId)
    if (!config) return

    const pageIndex = config.pages.findIndex(p => p.id === pageId)
    if (pageIndex >= 0) {
      config.pages[pageIndex] = {
        ...config.pages[pageIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      await this.saveSpacesEditorConfig(config)
    }
  }

  /**
   * Delete a page
   */
  static async deletePage(spaceId: string, pageId: string): Promise<void> {
    const config = await this.getSpacesEditorConfig(spaceId)
    if (!config) return

    config.pages = config.pages.filter(p => p.id !== pageId)
    await this.saveSpacesEditorConfig(config)
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
  static async createPageFromTemplate(spaceId: string, templateId: string, pageData: Partial<SpacesEditorPage>): Promise<SpacesEditorPage> {
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

  /**
   * Clear spaces editor configuration (remove all pages)
   */
  static async clearSpacesEditorConfig(spaceId: string): Promise<void> {
    const config = await this.getSpacesEditorConfig(spaceId)
    if (!config) return

    const clearedConfig: SpacesEditorConfig = {
      ...config,
      pages: [],
      sidebarConfig: {
        ...config.sidebarConfig,
        items: []
      },
      updatedAt: new Date().toISOString()
    }

    await this.saveSpacesEditorConfig(clearedConfig)
  }

  /**
   * Reset spaces editor configuration to default (empty)
   */
  static async resetSpacesEditorConfig(spaceId: string): Promise<SpacesEditorConfig> {
    // Clear existing config
    await this.clearSpacesEditorConfig(spaceId)
    
    // Create new default config
    return await this.createDefaultConfig(spaceId)
  }
}
