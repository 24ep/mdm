import { useState, useEffect, useCallback } from 'react'
import { Template } from '@/lib/template-generator'
import { TemplateManager } from '@/lib/template-manager'

interface UseTemplatesOptions {
  dataModelId?: string
  category?: string
  search?: string
  autoFetch?: boolean
}

interface UseTemplatesReturn {
  templates: Template[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createTemplate: (template: Template) => Promise<void>
  updateTemplate: (template: Template) => Promise<void>
  deleteTemplate: (templateId: string) => Promise<void>
  duplicateTemplate: (templateId: string, newName?: string) => Promise<Template | null>
  generateDefaultTemplates: (dataModel: any) => Promise<Template[]>
  searchTemplates: (query: string) => Promise<void>
  clearError: () => void
}

export function useTemplates(options: UseTemplatesOptions = {}): UseTemplatesReturn {
  const { dataModelId, category, search, autoFetch = true } = options
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      let fetchedTemplates: Template[]

      if (dataModelId) {
        fetchedTemplates = await TemplateManager.getTemplatesForModel(dataModelId)
      } else if (search) {
        fetchedTemplates = await TemplateManager.searchTemplates(search)
      } else {
        fetchedTemplates = await TemplateManager.getTemplates()
      }

      // Filter by category if specified
      if (category) {
        fetchedTemplates = fetchedTemplates.filter(template => template.category === category)
      }

      setTemplates(fetchedTemplates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }, [dataModelId, category, search])

  const createTemplate = useCallback(async (template: Template) => {
    setLoading(true)
    setError(null)
    
    try {
      await TemplateManager.saveTemplate(template)
      await fetchTemplates() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setLoading(false)
    }
  }, [fetchTemplates])

  const updateTemplate = useCallback(async (template: Template) => {
    setLoading(true)
    setError(null)
    
    try {
      await TemplateManager.saveTemplate(template)
      await fetchTemplates() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
    } finally {
      setLoading(false)
    }
  }, [fetchTemplates])

  const deleteTemplate = useCallback(async (templateId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await TemplateManager.deleteTemplate(templateId)
      await fetchTemplates() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    } finally {
      setLoading(false)
    }
  }, [fetchTemplates])

  const duplicateTemplate = useCallback(async (templateId: string, newName?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const duplicatedTemplate = await TemplateManager.duplicateTemplate(templateId, newName)
      await fetchTemplates() // Refresh the list
      return duplicatedTemplate
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate template')
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchTemplates])

  const generateDefaultTemplates = useCallback(async (dataModel: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const generatedTemplates = await TemplateManager.createDefaultTemplatesForModel(dataModel)
      await fetchTemplates() // Refresh the list
      return generatedTemplates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate default templates')
      return []
    } finally {
      setLoading(false)
    }
  }, [fetchTemplates])

  const searchTemplates = useCallback(async (query: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const searchResults = await TemplateManager.searchTemplates(query)
      setTemplates(searchResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search templates')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch templates when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchTemplates()
    }
  }, [fetchTemplates, autoFetch])

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    generateDefaultTemplates,
    searchTemplates,
    clearError
  }
}
