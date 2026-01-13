import { Template, DataModel } from './template-generator'
import { TemplateGenerator } from './template-generator'

export interface TemplateStorage {
  templates: Template[]
  lastUpdated: string
}

export class TemplateManager {
  private static readonly STORAGE_KEY = 'space_studio_templates'
  private static readonly API_BASE = '/api/templates'

  /**
   * Get all templates from storage
   */
  static async getTemplates(): Promise<Template[]> {
    try {
      // Try to fetch from API first
      const response = await fetch(`${this.API_BASE}`)
      if (response.ok) {
        const data = await response.json()
        return data.templates || []
      }
    } catch (error) {
      console.warn('Failed to fetch templates from API, using local storage:', error)
    }

    // Fallback to local storage (only on client)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data: TemplateStorage = JSON.parse(stored)
        return data.templates || []
      }
    }

    return []
  }

  /**
   * Get templates for a specific data model
   */
  static async getTemplatesForModel(dataModelId: string): Promise<Template[]> {
    const templates = await this.getTemplates()
    return templates.filter(template => template.dataModelId === dataModelId)
  }

  /**
   * Get a specific template by ID
   */
  static async getTemplate(templateId: string): Promise<Template | null> {
    const templates = await this.getTemplates()
    return templates.find(template => template.id === templateId) || null
  }

  /**
   * Save a template
   */
  static async saveTemplate(template: Template): Promise<void> {
    try {
      // Try to save to API first
      const response = await fetch(`${this.API_BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      })

      if (response.ok) {
        return
      }
    } catch (error) {
      console.warn('Failed to save template to API, using local storage:', error)
    }

    // Fallback to local storage
    const templates = await this.getTemplates()
    const existingIndex = templates.findIndex(t => t.id === template.id)

    if (existingIndex >= 0) {
      templates[existingIndex] = { ...template, updatedAt: new Date().toISOString() }
    } else {
      templates.push(template)
    }

    const storageData: TemplateStorage = {
      templates,
      lastUpdated: new Date().toISOString()
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData))
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      // Try to delete from API first
      const response = await fetch(`${this.API_BASE}/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        return
      }
    } catch (error) {
      console.warn('Failed to delete template from API, using local storage:', error)
    }

    // Fallback to local storage
    const templates = await this.getTemplates()
    const filteredTemplates = templates.filter(t => t.id !== templateId)

    const storageData: TemplateStorage = {
      templates: filteredTemplates,
      lastUpdated: new Date().toISOString()
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData))
  }

  /**
   * Create default templates for a new data model
   */
  static async createDefaultTemplatesForModel(dataModel: DataModel): Promise<Template[]> {
    const defaultTemplates = TemplateGenerator.generateDefaultTemplates(dataModel)

    // Save all templates
    for (const template of defaultTemplates) {
      await this.saveTemplate(template)
    }

    return defaultTemplates
  }

  /**
   * Duplicate a template
   */
  static async duplicateTemplate(templateId: string, newName?: string): Promise<Template | null> {
    const originalTemplate = await this.getTemplate(templateId)
    if (!originalTemplate) {
      return null
    }

    const duplicatedTemplate: Template = {
      ...originalTemplate,
      id: this.generateId(),
      name: newName || `${originalTemplate.name}_copy`,
      displayName: newName || `${originalTemplate.displayName} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await this.saveTemplate(duplicatedTemplate)
    return duplicatedTemplate
  }

  /**
   * Export template as JSON
   */
  static exportTemplate(template: Template): string {
    return JSON.stringify(template, null, 2)
  }

  /**
   * Import template from JSON
   */
  static async importTemplate(templateJson: string): Promise<Template | null> {
    try {
      const template: Template = JSON.parse(templateJson)

      // Validate template structure
      if (!this.validateTemplate(template)) {
        throw new Error('Invalid template structure')
      }

      // Generate new ID and timestamps
      const importedTemplate: Template = {
        ...template,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await this.saveTemplate(importedTemplate)
      return importedTemplate
    } catch (error) {
      console.error('Failed to import template:', error)
      return null
    }
  }

  /**
   * Get template categories
   */
  static async getTemplateCategories(): Promise<string[]> {
    const templates = await this.getTemplates()
    const categories = new Set(templates.map(t => t.category))
    return Array.from(categories).sort()
  }

  /**
   * Search templates
   */
  static async searchTemplates(query: string): Promise<Template[]> {
    const templates = await this.getTemplates()
    const lowercaseQuery = query.toLowerCase()

    return templates.filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.displayName.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.category.toLowerCase().includes(lowercaseQuery)
    )
  }

  /**
   * Validate template structure
   */
  private static validateTemplate(template: any): template is Template {
    return (
      template &&
      typeof template.id === 'string' &&
      typeof template.name === 'string' &&
      typeof template.displayName === 'string' &&
      typeof template.description === 'string' &&
      typeof template.category === 'string' &&
      typeof template.dataModelId === 'string' &&
      typeof template.version === 'string' &&
      Array.isArray(template.pages) &&
      template.sidebarConfig &&
      typeof template.createdAt === 'string' &&
      typeof template.updatedAt === 'string'
    )
  }

  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clear all templates (for testing/development)
   */
  static async clearAllTemplates(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY)

    try {
      await fetch(`${this.API_BASE}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.warn('Failed to clear templates from API:', error)
    }
  }
}
