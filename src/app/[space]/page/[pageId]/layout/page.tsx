'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layout, Plus } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import toast from 'react-hot-toast'

// Load layouts from system layout templates
async function loadLayoutTemplates(): Promise<Array<{
  id: string
  name: string
  description?: string
  icon: typeof Layout
  config?: any
}>> {
  try {
    // Try to fetch from system layout templates API (from system/layout-templates page)
    const response = await fetch('/api/admin/layout-templates')
    if (response.ok) {
      const data = await response.json()
      if (data.templates && Array.isArray(data.templates)) {
        return data.templates.map((t: any) => ({
          id: t.id || t.name,
          name: t.name || t.id,
          description: t.description,
          icon: Layout,
          config: t.config || t.layout_config
        }))
      }
      // If response has different structure
      if (Array.isArray(data)) {
        return data.map((t: any) => ({
          id: t.id || t.name,
          name: t.name || t.id,
          description: t.description,
          icon: Layout,
          config: t.config || t.layout_config
        }))
      }
    }
  } catch (error) {
    console.warn('Failed to fetch layout templates from API:', error)
  }

  // Fallback to localStorage (same as space layout selection)
  try {
    const stored = localStorage.getItem('space_layout_templates')
    if (stored) {
      const templates = JSON.parse(stored)
      return templates.map((t: any) => ({
        id: t.id || t.name,
        name: t.name || t.id,
        description: t.description,
        icon: Layout,
        config: t.config || t.layout_config
      }))
    }
  } catch (error) {
    console.warn('Failed to load templates from localStorage:', error)
  }

  // Return empty array if no templates found - user must create new layout
  return []
}

export default function PageLayoutSelectionPage() {
  const params = useParams() as { space: string; pageId: string }
  const router = useRouter()
  const searchParams = useSearchParams()
  const spaceSlug = params.space
  const pageId = params.pageId
  const editMode = searchParams?.get('editMode') === 'true'
  const { currentSpace } = useSpace()
  const [page, setPage] = useState<SpacesEditorPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [layouts, setLayouts] = useState<Array<{
    id: string
    name: string
    description?: string
    icon: typeof Layout
    config?: any
  }>>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load page
        const spaceId = currentSpace?.id || spaceSlug
        const pages = await SpacesEditorManager.getPages(spaceId)
        const foundPage = pages.find(p => p.id === pageId)
        if (foundPage) {
          setPage(foundPage)
        }

        // Load layout templates from system
        const layoutTemplates = await loadLayoutTemplates()
        setLayouts(layoutTemplates)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [pageId, currentSpace, spaceSlug])

  const handleNewLayout = async () => {
    if (!page || !currentSpace) return

    try {
      const spaceId = currentSpace.id
      
      // Create blank layout
      const layoutConfig: any = {
        layoutId: 'blank',
        placedWidgets: []
      }
      
      // Update page with blank layout
      await SpacesEditorManager.updatePage(spaceId, pageId, {
        ...page,
        layoutConfig,
        placedWidgets: []
      } as any)

      // Navigate to page editor
      router.push(`/${spaceSlug}/page/${pageId}?editMode=true`)
    } catch (error) {
      console.error('Error creating new layout:', error)
      toast.error('Failed to create layout')
    }
  }

  const handleLayoutSelect = async (layoutId: string) => {
    if (!page || !currentSpace) return

    try {
      // Initialize page with selected layout
      const spaceId = currentSpace.id
      
      // Find the selected layout template
      const selectedLayout = layouts.find(l => l.id === layoutId)
      
      // Fetch layout template configuration if available
      let layoutConfig: any = { layoutId, placedWidgets: [] }
      
      // Use config from the loaded layout if available
      if (selectedLayout?.config) {
        layoutConfig = {
          ...selectedLayout.config,
          layoutId,
          placedWidgets: selectedLayout.config.placedWidgets || []
        }
      } else {
        // Try to get template configuration from API
        try {
          const templateResponse = await fetch(`/api/admin/layout-templates/${layoutId}`)
          if (templateResponse.ok) {
            const templateData = await templateResponse.json()
            const template = templateData.template || templateData
            if (template?.config || template?.layout_config) {
              const config = template.config || template.layout_config
              layoutConfig = {
                ...config,
                layoutId,
                placedWidgets: config.placedWidgets || []
              }
            }
          }
        } catch (error) {
          console.warn('Failed to fetch template config from API:', error)
        }

        // Try to get from localStorage templates
        if (layoutConfig.placedWidgets?.length === 0) {
          try {
            const stored = localStorage.getItem('space_layout_templates')
            if (stored) {
              const templates = JSON.parse(stored)
              const template = templates.find((t: any) => t.id === layoutId)
              if (template?.config || template?.layout_config) {
                const config = template.config || template.layout_config
                layoutConfig = {
                  ...config,
                  layoutId,
                  placedWidgets: config.placedWidgets || []
                }
              }
            }
          } catch (error) {
            console.warn('Failed to load template from localStorage:', error)
          }
        }
      }
      
      // Update page with layout info
      await SpacesEditorManager.updatePage(spaceId, pageId, {
        ...page,
        layoutConfig,
        placedWidgets: layoutConfig.placedWidgets || []
      } as any)

      // Navigate to page editor
      router.push(`/${spaceSlug}/page/${pageId}?editMode=true`)
    } catch (error) {
      console.error('Error setting layout:', error)
      toast.error('Failed to set layout')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Choose a Layout for {page.displayName || page.name}</h1>
        <p className="text-muted-foreground">Select a layout template to start designing your page</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* New Layout Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-dashed"
          onClick={handleNewLayout}
        >
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Plus className="h-6 w-6 text-muted-foreground" />
              <CardTitle>New Layout</CardTitle>
            </div>
            <CardDescription>Start with a blank canvas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Create New Layout
            </Button>
          </CardContent>
        </Card>

        {/* System Layout Templates */}
        {layouts.map((layout) => {
          const Icon = layout.icon
          return (
            <Card
              key={layout.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleLayoutSelect(layout.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                  <CardTitle>{layout.name}</CardTitle>
                </div>
                <CardDescription>{layout.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Use This Layout
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

