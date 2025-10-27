import { useState, useEffect } from 'react'

interface Attribute {
  id: string
  name: string
  displayName: string
  type: string
}

interface DataModel {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  sourceType?: 'INTERNAL' | 'EXTERNAL'
  spaces: Array<{
    space: {
      id: string
      name: string
      slug: string
    }
  }>
  attributes: Attribute[]
}

interface UseDataModelsReturn {
  dataModels: DataModel[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDataModels(spaceId: string): UseDataModelsReturn {
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDataModels = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/spaces/${spaceId}/data-models`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      setDataModels(data.dataModels || [])
    } catch (err) {
      console.error('Error fetching data models:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data models'
      setError(errorMessage)
      setDataModels([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (spaceId) {
      fetchDataModels()
    }
  }, [spaceId])

  return {
    dataModels,
    loading,
    error,
    refetch: fetchDataModels
  }
}
