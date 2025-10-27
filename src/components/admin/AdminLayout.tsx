'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  selectedSpace?: string
  onSpaceChange?: (spaceId: string) => void
}

export function AdminLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  selectedSpace, 
  onSpaceChange 
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  const handleBackToSpaces = () => {
    router.push('/spaces')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-80'} flex-shrink-0`}>
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          selectedSpace={selectedSpace}
          onSpaceChange={onSpaceChange}
          collapsed={sidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-12 border-b bg-background flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-muted rounded"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>
            <div className="text-sm font-medium">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToSpaces}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Spaces
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
