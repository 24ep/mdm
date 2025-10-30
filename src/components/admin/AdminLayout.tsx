'use client'

import { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  selectedSpace?: string
  onSpaceChange?: (spaceId: string) => void
  breadcrumbItems?: string[]
}

export function AdminLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  selectedSpace, 
  onSpaceChange,
  breadcrumbItems
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  

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
        {/* Breadcrumb Bar */}
        <div className="h-10 border-b bg-background flex items-center px-4">
          <div className="flex items-center gap-2 text-sm">
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
            <nav aria-label="Breadcrumb" className="truncate text-muted-foreground">
              <ol className="flex items-center space-x-2">
                {(
                  breadcrumbItems && breadcrumbItems.length
                    ? breadcrumbItems
                    : [
                        'Admin Console',
                        activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')
                      ]
                ).map((item, idx, arr) => (
                  <>
                    <li key={`bc-${idx}`} className={`truncate ${idx === arr.length - 1 ? 'font-medium text-foreground' : 'whitespace-nowrap'}`}>
                      {item}
                    </li>
                    {idx < arr.length - 1 && <li key={`sep-${idx}`} className="text-muted-foreground">/</li>}
                  </>
                ))}
              </ol>
            </nav>
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
