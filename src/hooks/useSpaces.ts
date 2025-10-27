import { useState, useEffect } from 'react'

interface Space {
  id: string
  name: string
  slug: string
  description?: string
  isDefault: boolean
  icon?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

interface UseSpacesReturn {
  spaces: Space[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSpaces(): UseSpacesReturn {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSpaces = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/spaces')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch spaces: ${response.statusText}`)
      }
      
      const data = await response.json()
      setSpaces(data.spaces || [])
    } catch (err) {
      console.error('Error fetching spaces:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch spaces')
      setSpaces([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpaces()
  }, [])

  return {
    spaces,
    loading,
    error,
    refetch: fetchSpaces
  }
}
