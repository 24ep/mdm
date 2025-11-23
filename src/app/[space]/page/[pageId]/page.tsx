'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PageEditor } from '@/components/space-management/PageEditor'
import { PageViewer } from '@/components/space-management/PageViewer'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { useSpace } from '@/contexts/space-context'
import toast from 'react-hot-toast'

export default function SpacePageEditor() {
  const params = useParams() as { space: string; pageId: string }
  const searchParams = useSearchParams()
  const router = useRouter()
  const { currentSpace } = useSpace()
  const spaceSlug = params.space
  const pageId = params.pageId
  // Get editMode from URL query parameter (passed from layout)
  const editMode = searchParams?.get('editMode') === 'true'
  const [page, setPage] = useState<SpacesEditorPage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPage = async () => {
      try {
        const spaceId = currentSpace?.id || spaceSlug
        const pages = await SpacesEditorManager.getPages(spaceId)
        const foundPage = pages.find(p => p.id === pageId)
        if (foundPage) {
          setPage(foundPage)
        } else {
          toast.error('Page not found')
        }
      } catch (error) {
        console.error('Error loading page:', error)
        toast.error('Failed to load page')
      } finally {
        setLoading(false)
      }
    }
    if (currentSpace || spaceSlug) {
      loadPage()
    }
  }, [pageId, currentSpace, spaceSlug])

  // If in edit mode and page doesn't have layout, redirect to layout selection
  useEffect(() => {
    if (editMode && page && !loading) {
      const hasLayout = (page as any).placedWidgets || (page as any).layoutConfig
      if (!hasLayout) {
        router.replace(`/${spaceSlug}/page/${pageId}/layout?editMode=true`)
        return
      }
    }
  }, [editMode, page, loading, router, spaceSlug, pageId])

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

  // If no layout and in edit mode, show redirecting message (redirect will happen)
  const hasLayout = (page as any).placedWidgets || (page as any).layoutConfig
  if (editMode && !hasLayout) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Redirecting to layout selection...</p>
      </div>
    )
  }

  // Show editor in edit mode, viewer in view mode
  if (editMode) {
    return <PageEditor spaceSlug={spaceSlug} pageId={pageId} editMode={editMode} />
  } else {
    return <PageViewer spaceSlug={spaceSlug} pageId={pageId} />
  }
}

