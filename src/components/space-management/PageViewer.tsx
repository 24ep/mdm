'use client'

import React, { useEffect, useState, useRef } from 'react'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { Canvas } from '@/components/studio/layout-config/Canvas'
import { PlacedWidget } from '@/components/studio/layout-config/widgets'
import toast from 'react-hot-toast'

interface PageViewerProps {
  spaceSlug: string
  pageId: string
}

export function PageViewer({ spaceSlug, pageId }: PageViewerProps) {
  const [spaceId, setSpaceId] = useState<string>('')
  const [page, setPage] = useState<SpacesEditorPage | null>(null)
  const [placedWidgets, setPlacedWidgets] = useState<PlacedWidget[]>([])
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Load space ID and page data
  useEffect(() => {
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        // Get space ID from slug
        const spaces = await SpacesEditorManager.getSpaces()
        const space = spaces.find(s => s.slug === spaceSlug || s.id === spaceSlug)
        if (space && mounted) {
          setSpaceId(space.id)
        }

        // Load page data
        if (pageId && mounted) {
          const effectiveSpaceId = space?.id || spaceSlug
          const spacePages = await SpacesEditorManager.getPages(effectiveSpaceId)
          const foundPage = spacePages.find(p => p.id === pageId)
          if (foundPage && mounted) {
            setPage(foundPage)
            // Load widgets from page data
            const pageData = foundPage as any
            if (pageData.placedWidgets) {
              setPlacedWidgets(pageData.placedWidgets)
            } else if (pageData.layoutConfig?.placedWidgets) {
              setPlacedWidgets(pageData.layoutConfig.placedWidgets)
            }
          } else if (mounted) {
            console.warn('Page not found:', pageId)
            toast.error('Page not found')
          }
        }
      } catch (error) {
        console.error('Error loading page:', error)
        toast.error('Failed to load page')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })()
    return () => { mounted = false }
  }, [spaceSlug, pageId])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading page...</p>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Page not found</p>
      </div>
    )
  }

  // Render the page in view mode (no editor tools)
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-auto">
        <div className="w-full h-full relative bg-muted/30">
          <Canvas
            canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
            isMobile={false}
            isDraggingWidget={false}
            selectedComponent={null}
            selectedWidgetId={null}
            selectedWidgetIds={undefined}
            selectedPageId={pageId}
            placedWidgets={placedWidgets}
            dragOffset={{ x: 0, y: 0 }}
            canvasMode="freeform"
            showGrid={false}
            gridSize={20}
            setPlacedWidgets={() => {}} // No-op in view mode
            setSelectedWidgetId={() => {}} // No-op in view mode
            setSelectedWidgetIds={() => {}} // No-op in view mode
            setSelectedComponent={() => {}} // No-op in view mode
            setIsDraggingWidget={() => {}} // No-op in view mode
            setDragOffset={() => {}} // No-op in view mode
            clipboardWidget={undefined}
            clipboardWidgets={undefined}
            spaceId={spaceId}
          />
        </div>
      </div>
    </div>
  )
}

