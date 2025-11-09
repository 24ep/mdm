'use client'

import { usePathname } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { useState, useEffect } from 'react'

export default function OverviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (pathname === '/overview/analytics') {
      setActiveTab('analytics')
    } else {
      setActiveTab('overview')
    }
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

