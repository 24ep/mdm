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

  // Map tab IDs to their new route paths
  const getRouteForTab = (tab: string): string => {
    const routeMap: Record<string, string> = {
      'overview': '/',
      'analytics': '/overview/analytics',
      'bigquery': '/tools/bigquery',
      'notebook': '/tools/notebook',
      'ai-analyst': '/tools/ai-analyst',
      'ai-chat-ui': '/tools/ai-chat-ui',
      'knowledge-base': '/knowledge',
      'marketplace': '/marketplace',
      'infrastructure': '/infrastructure',
      'projects': '/tools/projects',
      'bi': '/tools/bi',
      'storage': '/tools/storage',
      'data-governance': '/tools/data-governance',
      'users': '/system/users',
      'roles': '/system/roles',
      'permission-tester': '/system/permission-tester',
      'space-layouts': '/system/space-layouts',
      'space-settings': '/system/space-settings',
      'assets': '/system/assets',
      'data': '/system/data',
      'attachments': '/system/attachments',
      'kernels': '/system/kernels',
      'health': '/system/health',
      'logs': '/system/logs',
      'audit': '/system/audit',
      'database': '/system/database',
      'change-requests': '/system/change-requests',
      'sql-linting': '/system/sql-linting',
      'schema-migrations': '/system/schema-migrations',
      'data-masking': '/system/data-masking',
      'cache': '/system/cache',
      'backup': '/system/backup',
      'security': '/system/security',
      'performance': '/system/performance',
      'settings': '/system/settings',
      'page-templates': '/system/page-templates',
      'notifications': '/system/notifications',
      'themes': '/system/themes',
      'export': '/system/export',
      'integrations': '/system/integrations',
      'api': '/system/api',
      'space-selection': '/data-management/space-selection',
    }
    return routeMap[tab] || '/'
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Navigate to new route structure when clicking other tabs
    if (tab !== 'space-settings') {
      const route = getRouteForTab(tab)
      router.push(route)
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
          { label: 'System', href: '/system/space-settings' },
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
