'use client'

import { useParams, usePathname } from 'next/navigation'
import { useSpace } from '@/contexts/space-context'
import { useEffect, useState } from 'react'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

export default function SpaceModulePage() {
  const params = useParams()
  const pathname = usePathname()
  const spaceSlug = params.space as string
  const { currentSpace, spaces } = useSpace()
  const [pages, setPages] = useState<SpacesEditorPage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const space = spaces.find(s => s.slug === spaceSlug || s.id === spaceSlug) || currentSpace

  useEffect(() => {
    if (!space?.id) return
    
    let mounted = true
    ;(async () => {
      try {
        const spacePages = await SpacesEditorManager.getPages(space.id)
        if (mounted) {
          setPages(spacePages || [])
        }
      } catch (error) {
        console.error('Error loading pages:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    })()
    return () => { mounted = false }
  }, [space?.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading space...</p>
        </div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Space Not Found</h2>
          <p className="text-muted-foreground">
            The space you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            {space.name}
          </h1>
          {space.description && (
            <p className="text-muted-foreground mt-2">{space.description}</p>
          )}
        </div>

        {pages.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to {space.name}</CardTitle>
              <CardDescription>
                No pages configured yet. Configure pages in Space Studio.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages
              .filter(page => !page.hidden)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((page) => (
                <Card key={page.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{page.displayName || page.name}</CardTitle>
                    {page.description && (
                      <CardDescription>{page.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

