import { useState, useCallback } from 'react'
import { TemplateManager } from '@/lib/template-manager'
import { TemplateGenerator } from '@/lib/template-generator'
import { DataModel } from '@/lib/template-generator'

interface CreateDataModelOptions {
  name: string
  display_name: string
  description?: string
  table_name: string
  attributes: Array<{
    name: string
    display_name: string
    type: string
    required: boolean
    unique: boolean
  }>
  autoGenerateTemplates?: boolean
}

interface UseDataModelCreationReturn {
  loading: boolean
  error: string | null
  createDataModel: (options: CreateDataModelOptions) => Promise<DataModel | null>
  generateTemplatesForModel: (dataModel: DataModel) => Promise<void>
  clearError: () => void
}

export function useDataModelCreation(): UseDataModelCreationReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDataModel = useCallback(async (options: CreateDataModelOptions): Promise<DataModel | null> => {
    setLoading(true)
    setError(null)

    try {
      // Create the data model (this would typically call your API)
      const dataModel: DataModel = {
        id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: options.name,
        display_name: options.display_name,
        description: options.description,
        table_name: options.table_name,
        attributes: options.attributes.map((attr, index) => ({
          id: `attr_${Date.now()}_${index}`,
          name: attr.name,
          display_name: attr.display_name,
          type: attr.type,
          required: attr.required,
          unique: attr.unique
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Auto-generate templates if requested
      if (options.autoGenerateTemplates !== false) {
        await generateTemplatesForModel(dataModel)
      }

      return dataModel
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create data model')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const generateTemplatesForModel = useCallback(async (dataModel: DataModel): Promise<void> => {
    try {
      // Generate default templates for the data model
      const templates = TemplateGenerator.generateDefaultTemplates(dataModel)
      
      // Save all templates
      for (const template of templates) {
        await TemplateManager.saveTemplate(template)
      }

      console.log(`Generated ${templates.length} templates for data model: ${dataModel.display_name}`)
    } catch (err) {
      console.error('Failed to generate templates for data model:', err)
      throw err
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    createDataModel,
    generateTemplatesForModel,
    clearError
  }
}
