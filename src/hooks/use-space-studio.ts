import { useState, useEffect, useCallback } from 'react'
import { SpacesEditorManager, SpacesEditorPage, SpacesEditorConfig } from '@/lib/space-studio-manager'
import { Template } from '@/lib/template-generator'

interface UseSpacesEditorReturn {
  // Configuration
  config: SpacesEditorConfig | null
  loading: boolean
  error: string | null
  
  // Pages
  pages: SpacesEditorPage[]
  createPage: (pageData: Partial<SpacesEditorPage>) => Promise<SpacesEditorPage>
  updatePage: (pageId: string, updates: Partial<SpacesEditorPage>) => Promise<void>
  deletePage: (pageId: string) => Promise<void>
  
  // Templates
  templates: Template[]
  templatesLoading: boolean
  templatesError: string | null
  
  // Actions
  assignTemplateToPage: (pageId: string, templateId: string) => Promise<void>
  createPageFromTemplate: (templateId: string, pageData: Partial<SpacesEditorPage>) => Promise<SpacesEditorPage>
  refreshConfig: () => Promise<void>
  clearError: () => void
}

export function useSpacesEditor(spaceId: string): UseSpacesEditorReturn {
  const [config, setConfig] = useState<SpacesEditorConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesError, setTemplatesError] = useState<string | null>(null)

  const loadConfig = useCallback(async () => {
    if (!spaceId) return
    
    setLoading(true)
    setError(null)
    
    try {
      let spaceConfig = await SpacesEditorManager.getSpacesEditorConfig(spaceId)
      
      // Create default config if none exists
      if (!spaceConfig) {
        spaceConfig = await SpacesEditorManager.createDefaultConfig(spaceId)
      }
      
      setConfig(spaceConfig)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load spaces editor configuration')
    } finally {
      setLoading(false)
    }
  }, [spaceId])

  const loadTemplates = useCallback(async () => {
    if (!spaceId) return
    
    setTemplatesLoading(true)
    setTemplatesError(null)
    
    try {
      const availableTemplates = await SpacesEditorManager.getAvailableTemplates(spaceId)
      setTemplates(availableTemplates)
    } catch (err) {
      setTemplatesError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setTemplatesLoading(false)
    }
  }, [spaceId])

  const createPage = useCallback(async (pageData: Partial<SpacesEditorPage>): Promise<SpacesEditorPage> => {
    try {
      const newPage = await SpacesEditorManager.createPage(spaceId, pageData)
      await loadConfig() // Refresh config
      return newPage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page')
      throw err
    }
  }, [spaceId, loadConfig])

  const updatePage = useCallback(async (pageId: string, updates: Partial<SpacesEditorPage>): Promise<void> => {
    try {
      await SpacesEditorManager.updatePage(spaceId, pageId, updates)
      await loadConfig() // Refresh config
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update page')
      throw err
    }
  }, [spaceId, loadConfig])

  const deletePage = useCallback(async (pageId: string): Promise<void> => {
    try {
      await SpacesEditorManager.deletePage(spaceId, pageId)
      await loadConfig() // Refresh config
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete page')
      throw err
    }
  }, [spaceId, loadConfig])

  const assignTemplateToPage = useCallback(async (pageId: string, templateId: string): Promise<void> => {
    try {
      await SpacesEditorManager.assignTemplateToPage(spaceId, pageId, templateId)
      await loadConfig() // Refresh config
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign template to page')
      throw err
    }
  }, [spaceId, loadConfig])

  const createPageFromTemplate = useCallback(async (templateId: string, pageData: Partial<SpacesEditorPage>): Promise<SpacesEditorPage> => {
    try {
      const newPage = await SpacesEditorManager.createPageFromTemplate(spaceId, templateId, pageData)
      await loadConfig() // Refresh config
      return newPage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page from template')
      throw err
    }
  }, [spaceId, loadConfig])

  const refreshConfig = useCallback(async () => {
    await loadConfig()
  }, [loadConfig])

  const clearError = useCallback(() => {
    setError(null)
    setTemplatesError(null)
  }, [])

  // Load config and templates on mount
  useEffect(() => {
    loadConfig()
    loadTemplates()
  }, [loadConfig, loadTemplates])

  return {
    config,
    loading,
    error,
    pages: config?.pages || [],
    createPage,
    updatePage,
    deletePage,
    templates,
    templatesLoading,
    templatesError,
    assignTemplateToPage,
    createPageFromTemplate,
    refreshConfig,
    clearError
  }
}
