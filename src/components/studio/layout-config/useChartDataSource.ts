import { useState, useEffect } from 'react'
import { Attribute, DataModel } from './chartDataSourceTypes'

export function useDataModels(spaceId?: string) {
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadDataModels = async () => {
      try {
        setLoading(true)
        const response = await fetch(spaceId ? `/api/spaces/${spaceId}/data-models` : `/api/data-models`)
        if (response.ok) {
          const data = await response.json()
          const models = data.dataModels || data.data || data.models || (Array.isArray(data) ? data : [])
          const modelsArray = Array.isArray(models) ? models : []
          setDataModels(modelsArray)
          console.log('Loaded data models:', modelsArray.length, modelsArray)
          if (modelsArray.length === 0) {
            console.warn('No data models found in response:', data)
          }
        } else {
          const errorText = await response.text()
          console.error('Failed to load data models:', response.status, response.statusText, errorText)
          try {
            const altUrl = spaceId ? `/api/data-models?spaceId=${spaceId}` : `/api/data-models`
            const altResponse = await fetch(altUrl)
            if (altResponse.ok) {
              const altData = await altResponse.json()
              const models = altData.dataModels || altData.data || altData.models || (Array.isArray(altData) ? altData : [])
              setDataModels(Array.isArray(models) ? models : [])
            }
          } catch (altError) {
            console.error('Alternative endpoint also failed:', altError)
          }
        }
      } catch (error) {
        console.error('Failed to load data models:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadDataModels()
  }, [spaceId])

  return { dataModels, loading }
}

export function useAttributes(selectedModelId: string | undefined, spaceId?: string) {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedModelId) return
    
    setLoading(true)
    const loadAttributes = async () => {
      try {
        const response = await fetch(`/api/data-models/${selectedModelId}/attributes`)
        if (response.ok) {
          const data = await response.json()
          const attrs = data.attributes || data.data || (Array.isArray(data) ? data : [])
          const attrsArray = Array.isArray(attrs) ? attrs : []
          setAttributes(attrsArray)
          console.log('Loaded attributes:', attrsArray.length, 'for model:', selectedModelId, attrsArray)
          if (attrsArray.length === 0) {
            console.warn('No attributes loaded. Response:', data)
          }
        } else {
          const errorText = await response.text()
          console.error('Failed to load attributes:', response.status, response.statusText, errorText)
          setAttributes([])
        }
      } catch (error) {
        console.error('Failed to load attributes:', error)
        setAttributes([])
      } finally {
        setLoading(false)
      }
    }
    
    loadAttributes()
  }, [selectedModelId, spaceId])

  return { attributes, loading }
}

