'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { User, Moon, Sun, Monitor, LogOut } from 'lucide-react'
import { PlatformSidebar } from './PlatformSidebar'

type BreadcrumbItem = string | { label: string; href?: string; onClick?: () => void }

interface PlatformLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  selectedSpace?: string
  onSpaceChange?: (spaceId: string) => void
  breadcrumbItems?: BreadcrumbItem[]
}

// Determine which group the active tab belongs to
const getGroupForTab = (tab: string): string | null => {
  const groupedTabs: Record<string, string[]> = {
    overview: ['overview', 'analytics'],
    tools: ['bigquery', 'notebook', 'ai-analyst', 'ai-chat-ui', 'knowledge-base', 'bi', 'storage'],
    system: ['users', 'space-layouts', 'data', 'attachments', 'kernels', 'health', 'logs', 'database', 'cache', 'security', 'performance', 'settings', 'page-templates', 'export', 'integrations'],
    'data-management': ['space-selection']
  }
  
  for (const [group, tabs] of Object.entries(groupedTabs)) {
    if (tabs.includes(tab)) {
      // Data Management has no secondary sidebar
      if (group === 'data-management') {
        return null
      }
      return group
    }
  }
  return null
}

export function PlatformLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  selectedSpace, 
  onSpaceChange,
  breadcrumbItems
}: PlatformLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  
  // Initialize selectedGroup based on activeTab
  const [selectedGroup, setSelectedGroup] = useState<string | null>(() => getGroupForTab(activeTab))
  const isGroupManuallySelected = useRef(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  // Set selected group based on active tab when activeTab changes
  // Only update if the group was not manually selected by the user clicking on a group
  useEffect(() => {
    if (!isGroupManuallySelected.current) {
      const group = getGroupForTab(activeTab)
      setSelectedGroup(group) // Set to null for data-management, which is correct
    } else {
      // Reset the flag after processing
      isGroupManuallySelected.current = false
    }
  }, [activeTab])

  // Custom setter that tracks manual selection
  const handleGroupSelect = (group: string | null) => {
    isGroupManuallySelected.current = true
    setSelectedGroup(group)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Primary Sidebar - Groups */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 border-r border-gray-200`}>
        <PlatformSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          selectedSpace={selectedSpace}
          onSpaceChange={onSpaceChange}
          collapsed={sidebarCollapsed}
          selectedGroup={selectedGroup}
          onGroupSelect={handleGroupSelect}
          mode="primary"
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Secondary Sidebar - Submenu Items */}
      {selectedGroup && selectedGroup !== '' && (
        <div className="w-64 flex-shrink-0 border-r border-gray-200 transition-all duration-300 ease-in-out">
          <PlatformSidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedSpace={selectedSpace}
            onSpaceChange={onSpaceChange}
            collapsed={false}
            selectedGroup={selectedGroup}
            onGroupSelect={handleGroupSelect}
            mode="secondary"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb Bar */}
        <div className="h-10 border-b bg-background flex items-center justify-between px-4">
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
                        'Unified Data Platform',
                        activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')
                      ]
                ).map((item, idx, arr) => {
                  const isLast = idx === arr.length - 1
                  const label = typeof item === 'string' ? item : item.label
                  const href = typeof item === 'object' ? item.href : undefined
                  const onClick = typeof item === 'object' ? item.onClick : undefined
                  const isClickable = !isLast && (href || onClick)
                  
                  return (
                    <>
                      <li key={`bc-${idx}`} className={`truncate ${isLast ? 'font-medium text-foreground' : 'whitespace-nowrap'}`}>
                        {isClickable ? (
                          href ? (
                            <Link 
                              href={href}
                              className="hover:text-foreground hover:underline transition-colors"
                            >
                              {label}
                            </Link>
                          ) : (
                            <button
                              onClick={onClick}
                              className="hover:text-foreground hover:underline transition-colors text-left"
                            >
                              {label}
                            </button>
                          )
                        ) : (
                          <span>{label}</span>
                        )}
                      </li>
                      {!isLast && <li key={`sep-${idx}`} className="text-muted-foreground">/</li>}
                    </>
                  )
                })}
              </ol>
            </nav>
          </div>
          
          {/* User Avatar */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(session as any)?.user?.image || ''} alt={(session as any)?.user?.name || 'User'} />
                    <AvatarFallback>
                      {((session as any)?.user?.name || (session as any)?.user?.email || 'U')?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {(session as any)?.user?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {(session as any)?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme || 'system'} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

