'use client'

import { usePathname } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { InfrastructureProvider, useInfrastructureContext } from '@/contexts/infrastructure-context'

const pathToTabMap: Record<string, string> = {
  '/infrastructure': 'infrastructure',
}

function InfrastructureLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('infrastructure')
  const { setShowAddDialog } = useInfrastructureContext()

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
      breadcrumbActions={
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Instance
        </Button>
      }
    >
      {children}
    </PlatformLayout>
  )
}

export default function InfrastructureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InfrastructureProvider>
      <InfrastructureLayoutContent>
        {children}
      </InfrastructureLayoutContent>
    </InfrastructureProvider>
  )
}

