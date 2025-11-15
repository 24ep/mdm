'use client'

import { useState, useEffect, useRef, Fragment, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlatformSidebar } from './PlatformSidebar'
import { TopMenuBar } from './TopMenuBar'
import { Z_INDEX } from '@/lib/z-index'

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
    tools: ['bigquery', 'notebook', 'ai-analyst', 'ai-chat-ui', 'knowledge-base', 'marketplace', 'infrastructure', 'projects', 'bi', 'reports', 'storage', 'data-governance'],
    system: ['users', 'roles', 'permission-tester', 'space-layouts', 'space-settings', 'assets', 'data', 'attachments', 'kernels', 'health', 'logs', 'audit', 'database', 'change-requests', 'sql-linting', 'schema-migrations', 'data-masking', 'cache', 'backup', 'security', 'performance', 'settings', 'page-templates', 'notifications', 'themes', 'export', 'integrations', 'api'],
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

// Generate breadcrumb items based on group structure
const generateBreadcrumbs = (activeTab: string): BreadcrumbItem[] => {
  const groupMetadata: Record<string, { name: string }> = {
    overview: { name: 'Homepage' },
    tools: { name: 'Tools' },
    system: { name: 'System' },
    'data-management': { name: 'Data Management' }
  }

  const toolSections: Record<string, string[]> = {
    'AI & Assistants': ['ai-analyst', 'ai-chat-ui'],
    'Data Tools': ['bigquery', 'notebook', 'storage', 'data-governance'],
    'Knowledge & Collaboration': ['knowledge-base'],
    'Platform Services': ['marketplace', 'infrastructure'],
    'Project Management': ['projects'],
    'Reporting': ['bi', 'reports']
  }

  const groupSections: Record<string, string[]> = {
    management: ['users', 'roles', 'permission-tester', 'space-layouts', 'space-settings', 'assets', 'data', 'attachments'],
    kernels: ['kernels'],
    system: ['health', 'logs', 'audit', 'database', 'change-requests', 'sql-linting', 'schema-migrations', 'data-masking', 'cache', 'backup'],
    security: ['security', 'performance'],
    integrations: ['settings', 'page-templates', 'notifications', 'themes', 'export', 'integrations', 'api']
  }

  const tabNames: Record<string, string> = {
    'overview': 'Overview',
    'analytics': 'Analytics',
    'bigquery': 'SQL Query',
    'notebook': 'Data Science',
    'ai-analyst': 'AI Analyst',
    'ai-chat-ui': 'AI Chat UI',
    'knowledge-base': 'Knowledge Base',
    'marketplace': 'Marketplace',
    'infrastructure': 'Infrastructure',
    'projects': 'Project Management',
    'bi': 'BI & Reports',
    'reports': 'Reports & Dashboard',
    'storage': 'Storage',
    'data-governance': 'Data Governance',
    'users': 'Users',
    'roles': 'Roles',
    'permission-tester': 'Permission Tester',
    'space-layouts': 'Space Layouts',
    'space-settings': 'Space Settings',
    'assets': 'Asset Management',
    'data': 'Data Models',
    'attachments': 'Attachments',
    'kernels': 'Kernel Management',
    'health': 'System Health',
    'logs': 'Logs',
    'audit': 'Audit Logs',
    'database': 'Database',
    'change-requests': 'Change Requests',
    'sql-linting': 'SQL Linting',
    'schema-migrations': 'Schema Migrations',
    'data-masking': 'Data Masking',
    'cache': 'Cache',
    'backup': 'Backup & Recovery',
    'security': 'Security',
    'performance': 'Performance',
    'settings': 'System Settings',
    'page-templates': 'Page Templates',
    'notifications': 'Notifications',
    'themes': 'Theme & Branding',
    'export': 'Data Export',
    'integrations': 'Integrations',
    'api': 'API Management',
    'space-selection': 'Data Management'
  }

  const group = getGroupForTab(activeTab)
  const breadcrumbs: BreadcrumbItem[] = []

  // If no group found or activeTab is invalid, return empty breadcrumbs
  if (!group || !activeTab || activeTab === 'admin') {
    return breadcrumbs
  }

  // Add group name
  if (groupMetadata[group]) {
    breadcrumbs.push({
      label: groupMetadata[group].name,
      href: undefined
    })
  }

  // Find section for tools group
  if (group === 'tools') {
    for (const [sectionName, tabIds] of Object.entries(toolSections)) {
      if (tabIds.includes(activeTab)) {
        breadcrumbs.push({
          label: sectionName,
          href: undefined
        })
        break
      }
    }
  }

  // Find section for system group
  if (group === 'system') {
    for (const [sectionName, tabIds] of Object.entries(groupSections)) {
      if (tabIds.includes(activeTab)) {
        const sectionLabel = sectionName.charAt(0).toUpperCase() + sectionName.slice(1)
        breadcrumbs.push({
          label: sectionLabel,
          href: undefined
        })
        break
      }
    }
  }

  // Add tab name
  const tabName = tabNames[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')
  breadcrumbs.push({
    label: tabName,
    href: undefined
  })

  return breadcrumbs
}

export function PlatformLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  selectedSpace, 
  onSpaceChange,
  breadcrumbItems
}: PlatformLayoutProps) {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [secondarySidebarCollapsed, setSecondarySidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Memoize group calculation to avoid unnecessary recalculations
  const currentGroup = useMemo(() => getGroupForTab(activeTab), [activeTab])
  
  // Initialize selectedGroup based on activeTab
  const [selectedGroup, setSelectedGroup] = useState<string | null>(currentGroup)
  const isGroupManuallySelected = useRef(false)

  // Set selected group based on active tab when activeTab changes
  // Only update if the group was not manually selected by the user clicking on a group
  useEffect(() => {
    if (!isGroupManuallySelected.current) {
      if (selectedGroup !== currentGroup) {
        setSelectedGroup(currentGroup) // Set to null for data-management, which is correct
      }
    } else {
      // Reset the flag after processing
      isGroupManuallySelected.current = false
    }
  }, [activeTab, currentGroup, selectedGroup])

  // Custom setter that tracks manual selection
  const handleGroupSelect = useCallback((group: string | null) => {
    isGroupManuallySelected.current = true
    setSelectedGroup(group)
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const handleToggleSecondaryCollapse = useCallback(() => {
    setSecondarySidebarCollapsed(prev => !prev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B - Toggle primary sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
        e.preventDefault()
        setSidebarCollapsed(prev => !prev)
      }
      // Ctrl/Cmd + Shift + B - Toggle secondary sidebar
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault()
        if (currentGroup && currentGroup !== '') {
          setSecondarySidebarCollapsed(prev => !prev)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentGroup])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Menu Bar - Full Width Above Everything */}
      <TopMenuBar activeTab={activeTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      {/* Content Area with Sidebars */}
      <div className="flex flex-1 overflow-hidden">
        {/* Primary Sidebar - Groups */}
        <div 
          className={`transition-all duration-150 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 border-r border-border`}
          style={{ 
            position: 'relative',
            zIndex: Z_INDEX.sidebar,
            pointerEvents: 'auto'
          }}
        >
          <PlatformSidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
            selectedSpace={selectedSpace}
            onSpaceChange={onSpaceChange}
            collapsed={sidebarCollapsed}
            selectedGroup={selectedGroup}
            onGroupSelect={handleGroupSelect}
            mode="primary"
            onToggleCollapse={handleToggleCollapse}
          />
        </div>

        {/* Secondary Sidebar - Submenu Items */}
        {/* Show secondary sidebar for all pages with a valid group (always visible) */}
        {currentGroup && currentGroup !== '' && (
          <div 
            className={`${secondarySidebarCollapsed ? 'w-0' : 'w-64'} flex-shrink-0 border-r border-border transition-all duration-150 ease-in-out overflow-hidden`}
            style={{ 
              position: 'relative',
              zIndex: Z_INDEX.sidebar,
              pointerEvents: 'auto'
            }}
          >
            {!secondarySidebarCollapsed && (
              <PlatformSidebar
                activeTab={activeTab}
                onTabChange={onTabChange}
                selectedSpace={selectedSpace}
                onSpaceChange={onSpaceChange}
                collapsed={false}
                selectedGroup={currentGroup}
                onGroupSelect={handleGroupSelect}
                mode="secondary"
                onToggleCollapse={handleToggleSecondaryCollapse}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}
            {secondarySidebarCollapsed && (
              <div className="h-full flex items-center justify-center border-r border-border">
                <button
                  onClick={handleToggleSecondaryCollapse}
                  className="p-2 hover:bg-muted rounded"
                  title="Expand secondary sidebar"
                  aria-label="Expand secondary sidebar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb Bar */}
          <div className="h-10 bg-background flex items-center px-4">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={handleToggleCollapse}
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
                  {(() => {
                    // Generate breadcrumbs, filtering out any items that contain "admin"
                    const crumbs = breadcrumbItems && breadcrumbItems.length
                      ? breadcrumbItems
                      : generateBreadcrumbs(activeTab)
                    
                    // Filter out any breadcrumb items that contain "admin" (case-insensitive)
                    return crumbs.filter(item => {
                      const label = typeof item === 'string' ? item : item.label
                      return label && !label.toLowerCase().includes('admin')
                    })
                  })().map((item, idx, arr) => {
                    const isLast = idx === arr.length - 1
                    const label = typeof item === 'string' ? item : item.label
                    const href = typeof item === 'object' ? item.href : undefined
                    const onClick = typeof item === 'object' ? item.onClick : undefined
                    const isClickable = !isLast && (href || onClick)
                    
                    return (
                      <Fragment key={`breadcrumb-${idx}`}>
                        <li className={`truncate ${isLast ? 'font-medium text-foreground' : 'whitespace-nowrap'}`}>
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
                        {!isLast && <li className="text-muted-foreground">/</li>}
                      </Fragment>
                    )
                  })}
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
    </div>
  )
}

