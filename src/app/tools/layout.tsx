'use client'

import { usePathname } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { useState, useEffect } from 'react'

const pathToTabMap: Record<string, string> = {
  '/tools/bigquery': 'bigquery',
  '/tools/notebook': 'notebook',
  '/tools/ai-analyst': 'ai-analyst',
  '/tools/ai-chat-ui': 'ai-chat-ui',
  '/tools/projects': 'projects',
  '/tools/bi': 'bi',
  '/tools/storage': 'storage',
  '/tools/data-governance': 'data-governance',
  '/tools/api-client': 'api-client',
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('bigquery')

  useEffect(() => {
    const tab = pathToTabMap[pathname || ''] || 'bigquery'
    setActiveTab(tab)
  }, [pathname])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Navigation is handled by the sidebar href
  }

  return (
    <PlatformLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {children}
    </PlatformLayout>
  )
}

