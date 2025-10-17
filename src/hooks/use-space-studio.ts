import { useState, useEffect, useCallback } from 'react'
import { SpaceStudioManager, SpaceStudioPage, SpaceStudioConfig } from '@/lib/space-studio-manager'
import { Template } from '@/lib/template-generator'

interface UseSpaceStudioReturn {
  // Configuration
  config: SpaceStudioConfig | null
  loading: boolean
  error: string | null
  
  // Pages
  pages: SpaceStudioPage[]
  createPage: (pageData: Partial<SpaceStudioPage>) => Promise<SpaceStudioPage>
  updatePage: (pageId: string, updates: Partial<SpaceStudioPage>) => Promise<void>
  deletePage: (pageId: string) => Promise<void>
  
  // Templates
  templates: Template[]
  templatesLoading: boolean
  templatesError: string | null
  
  // Actions
  assignTemplateToPage: (pageId: string, templateId: string) => Promise<void>
  createPageFromTemplate: (templateId: string, pageData: Partial<SpaceStudioPage>) => Promise<SpaceStudioPage>
  refreshConfig: () => Promise<void>
  clearError: () => void
}

export function useSpaceStudio(spaceId: string): UseSpaceStudioReturn {
  const [config, setConfig] = useState<SpaceStudioConfig | null>(null)
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
      let spaceConfig = await SpaceStudioManager.getSpaceStudioConfig(spaceId)
      
      // Create default config if none exists
      if (!spaceConfig) {
        spaceConfig = await SpaceStudioManager.createDefaultConfig(spaceId)
      }
      
      setConfig(spaceConfig)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load space studio configuration')
    } finally {
      setLoading(false)
    }
  }, [spaceId])

  const loadTemplates = useCallback(async () => {
    if (!spaceId) return
    
    setTemplatesLoading(true)
    setTemplatesError(null)
    
    try {
      const availableTemplates = await SpaceStudioManager.getAvailableTemplates(spaceId)
      setTemplates(availableTemplates)
    } catch (err) {
      setTemplatesError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setTemplatesLoading(false)
    }
  }, [spaceId])

  const createPage = useCallback(async (pageData: Partial<SpaceStudioPage>): Promise<SpaceStudioPage> => {
    try {
      const newPage = await SpaceStudioManager.createPage(spaceId, pageData)
      await loadConfig() // Refresh config
      return newPage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page')
      throw err
    }
  }, [spaceId, loadConfig])

  const updatePage = useCallback(async (pageId: string, updates: Partial<SpaceStudioPage>): Promise<void> => {
    try {
      await SpaceStudioManager.updatePage(spaceId, pageId, updates)
      await loadConfig() // Refresh config
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update page')
      throw err
    }
  }, [spaceId, loadConfig])

  const deletePage = useCallback(async (pageId: string): Promise<void> => {
    try {
      await SpaceStudioManager.deletePage(spaceId, pageId)
      await loadConfig() // Refresh config
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete page')
      throw err
    }
  }, [spaceId, loadConfig])

  const assignTemplateToPage = useCallback(async (pageId: string, templateId: string): Promise<void> => {
    try {
      await SpaceStudioManager.assignTemplateToPage(spaceId, pageId, templateId)
      await loadConfig() // Refresh config
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign template to page')
      throw err
    }
  }, [spaceId, loadConfig])

  const createPageFromTemplate = useCallback(async (templateId: string, pageData: Partial<SpaceStudioPage>): Promise<SpaceStudioPage> => {
    try {
      const newPage = await SpaceStudioManager.createPageFromTemplate(spaceId, templateId, pageData)
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
