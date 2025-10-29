'use client'

import { useSpace } from '@/contexts/space-context'
import { useParams, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const spaceSlug = params.space as string
  const { currentSpace, setCurrentSpace, spaces, isLoading } = useSpace()

  // Set the current space based on the URL parameter
  useEffect(() => {
    if (spaceSlug && spaces.length > 0) {
      const space = spaces.find(s => s.slug === spaceSlug || s.id === spaceSlug)
      if (space && space.id !== currentSpace?.id) {
        setCurrentSpace(space)
      }
    }
  }, [spaceSlug, spaces, setCurrentSpace])

  // Also handle the case where we need to refresh spaces if currentSpace is null
  useEffect(() => {
    if (!currentSpace && spaces.length > 0 && spaceSlug) {
      const space = spaces.find(s => s.slug === spaceSlug || s.id === spaceSlug)
      if (space) {
        setCurrentSpace(space)
      }
    }
  }, [currentSpace, spaces, spaceSlug, setCurrentSpace])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading space...</p>
        </div>
      </div>
    )
  }

  if (!currentSpace) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Space Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The space you're looking for doesn't exist or you don't have access to it.
          </p>
          <a 
            href="/spaces" 
            className="text-primary hover:underline"
          >
            ← Back to Spaces
          </a>
        </div>
      </div>
    )
  }

  const isSpaceSettings = pathname?.includes('/settings')

  // For space settings, use a custom layout without main sidebar
  if (isSpaceSettings) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  }

  return (
    <MainLayout contentClassName={isSpaceSettings ? 'p-0' : undefined}>
      {children}
    </MainLayout>
  )
}
