'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import BasePage from '../page'

// Resolve model slug or id and render the base entities page within a space route
export default function DataEntitiesByModelInSpacePage() {
  const params = useParams()
  const modelParam = (params?.model as string) || ''
  const [modelId, setModelId] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function resolveModel() {
      if (!modelParam) return
      // If looks like UUID, use directly
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(modelParam)) {
        if (!cancelled) setModelId(modelParam)
        return
      }
      try {
        const res = await fetch(`/api/data-models/by-slug/${encodeURIComponent(modelParam)}`)
        if (res.ok) {
          const json = await res.json()
          if (!cancelled) setModelId(json?.dataModel?.id || null)
        } else {
          if (!cancelled) setNotFound(true)
        }
      } catch {
        if (!cancelled) setNotFound(true)
      }
    }
    resolveModel()
    return () => { cancelled = true }
  }, [modelParam])

  if (notFound) {
    return (
      <div className="p-6">
        <div className="text-sm text-destructive">Data model not found.</div>
      </div>
    )
  }

  // Until resolved, show simple loading to preserve layout
  if (!modelId) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Ensure the query param `model` is set to the resolved id (client-side)
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set('model', modelId)
    if (url.toString() !== window.location.href) {
      window.history.replaceState({}, '', url.toString())
    }
  }

  return <BasePage />
}


