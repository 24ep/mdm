'use client'

import { usePathname } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { useState, useEffect } from 'react'

const pathToTabMap: Record<string, string> = {
  '/infrastructure': 'infrastructure',
}

export default function InfrastructureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('infrastructure')

  useEffect(() => {
    const tab = pathToTabMap[pathname || ''] || 'infrastructure'
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

