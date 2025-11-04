import { useState, useEffect, useRef } from 'react'
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
  const loadingRef = useRef(false)
  const lastModelIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!selectedModelId) {
      setAttributes([])
      setLoading(false)
      loadingRef.current = false
      lastModelIdRef.current = undefined
      return
    }
    
    // Skip if already loading the same model
    if (loadingRef.current && lastModelIdRef.current === selectedModelId) {
      console.log('⏸️ [useAttributes] Already loading model:', selectedModelId)
      return
    }
    
    // Skip if this is the same model we just loaded (check only if we have attributes)
    if (lastModelIdRef.current === selectedModelId && !loadingRef.current && attributes.length > 0) {
      console.log('⏸️ [useAttributes] Model already loaded, skipping:', selectedModelId)
      return
    }
    
    let cancelled = false
    let abortController: AbortController | null = null
    
    const loadAttributes = async () => {
      loadingRef.current = true
      lastModelIdRef.current = selectedModelId
      setLoading(true)
      
      try {
        console.log('🔍 [useAttributes] Fetching attributes for model:', selectedModelId)
        
        // Create new abort controller for this request
        abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController?.abort(), 10000) // 10 second timeout
        
        const response = await fetch(`/api/data-models/${selectedModelId}/attributes`, {
          signal: abortController.signal
        })
        
        clearTimeout(timeoutId)
        
        if (cancelled) return
        
        if (response.ok) {
          const data = await response.json()
          console.log('🔍 [useAttributes] Raw response:', data)
          const attrs = data.attributes || data.data || (Array.isArray(data) ? data : [])
          const attrsArray = Array.isArray(attrs) ? attrs : []
          
          if (cancelled) return
          
          setAttributes(attrsArray)
          console.log('✅ [useAttributes] Loaded attributes:', attrsArray.length, 'for model:', selectedModelId)
          if (attrsArray.length === 0) {
            console.warn('⚠️ [useAttributes] No attributes loaded. Response:', data)
          }
        } else {
          const errorText = await response.text()
          console.error('❌ [useAttributes] Failed to load attributes:', response.status, response.statusText, errorText)
          if (!cancelled) {
            setAttributes([])
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('⏱️ [useAttributes] Request timeout after 10 seconds')
        } else {
          console.error('❌ [useAttributes] Failed to load attributes:', error)
        }
        if (!cancelled) {
          setAttributes([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          loadingRef.current = false
        }
      }
    }
    
    loadAttributes()
    
    return () => {
      cancelled = true
      loadingRef.current = false
      if (abortController) {
        abortController.abort()
      }
      setLoading(false)
    }
  }, [selectedModelId]) // Only depend on selectedModelId to prevent infinite loops

  return { attributes, loading }
}

