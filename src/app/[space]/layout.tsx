'use client'

import { useSpace } from '@/contexts/space-context'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PlatformLayout } from '@/components/platform/PlatformLayout'

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const spaceSlug = params.space as string
  const { currentSpace, setCurrentSpace, spaces, isLoading } = useSpace()
  const [activeTab, setActiveTab] = useState('space-settings')

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Navigate to homepage with the tab when clicking other tabs
    if (tab !== 'space-settings') {
      router.push(`/?tab=${encodeURIComponent(tab)}`)
    }
  }

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

  // For space settings, use PlatformLayout to show platform sidebar
  if (isSpaceSettings) {
    return (
      <PlatformLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedSpace={currentSpace?.id}
        onSpaceChange={(spaceId) => {
          const space = spaces.find(s => s.id === spaceId)
          if (space) {
            router.push(`/${space.slug || space.id}/settings`)
          }
        }}
        breadcrumbItems={[
          { label: 'Unified Data Platform', href: '/' },
          { label: 'System', href: '/?tab=space-settings' },
          { label: 'Space Settings', href: `/${spaceSlug}/settings` },
          currentSpace?.name || ''
        ]}
      >
        {children}
      </PlatformLayout>
    )
  }

  return (
    <MainLayout contentClassName={isSpaceSettings ? 'p-0' : undefined}>
      {children}
    </MainLayout>
  )
}
