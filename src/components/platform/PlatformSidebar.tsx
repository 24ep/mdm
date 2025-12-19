'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Shield, 
  Database, 
  BarChart3, 
  Settings, 
  Users, 
  FileText, 
  Cloud, 
  Table, 
  Database as DatabaseIcon, 
  Code, 
  Server, 
  Key, 
  Monitor, 
  Paperclip, 
  Bell, 
  Palette, 
  Activity, 
  Heart, 
  FileText as FileTextIcon, 
  Zap, 
  HardDrive,
  Building,
  Building2,
  ChevronDown,
  ChevronRight,
  Bot,
  Layout,
  FolderKanban,
  FlaskConical,
  BookOpen,
  GitBranch,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  History,
  Kanban,
  Store,
  Network,
  ChevronLeft,
  MessageCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Z_INDEX } from '@/lib/z-index'
import { APP_VERSION } from '@/lib/version'
import { HorizonSidebar } from '@/components/infrastructure/HorizonSidebar'
import { InfrastructureInstance } from '@/features/infrastructure/types'

interface PlatformSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  selectedSpace?: string
  onSpaceChange?: (spaceId: string) => void
  collapsed?: boolean
  selectedGroup?: string | null
  onGroupSelect?: (group: string) => void
  onGroupHover?: (group: string | null) => void
  onGroupLeave?: () => void
  mode?: 'primary' | 'secondary'
  onToggleCollapse?: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  selectedVmId?: string | null
  onVmSelect?: (vm: InfrastructureInstance) => void
  onVmPermission?: (vm: InfrastructureInstance) => void
  onVmRemove?: (vm: InfrastructureInstance) => void
  onVmReboot?: (vm: InfrastructureInstance) => void
  onVmEdit?: (vm: InfrastructureInstance) => void
  onVmAccess?: (vm: InfrastructureInstance) => void
  onAddVm?: () => void
}

export function PlatformSidebar({ 
  activeTab, 
  onTabChange, 
  selectedSpace, 
  onSpaceChange,
  collapsed = false,
  selectedGroup,
  onGroupSelect,
  onGroupHover,
  onGroupLeave,
  mode = 'primary',
  onToggleCollapse,
  searchQuery = '',
  onSearchChange,
  selectedVmId,
  onVmSelect,
  onVmPermission,
  onVmRemove,
  onVmReboot,
  onVmEdit,
  onVmAccess,
  onAddVm,
}: PlatformSidebarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const searchValue = searchQuery !== undefined ? searchQuery : localSearchQuery
  const handleSearchChange = onSearchChange || ((query: string) => setLocalSearchQuery(query))
  const router = useRouter()

  const adminTabs = [
    {
      id: 'overview',
      name: 'Homepage',
      icon: Monitor,
      description: 'System homepage'
    },
    {
      id: 'users',
      name: 'User Management',
      icon: Users,
      description: 'Manage users and permissions'
    },
    {
      id: 'spaces',
      name: 'Space Management',
      icon: Building,
      description: 'Manage spaces and workspaces'
    },
    {
      id: 'data',
      name: 'Data Models',
      icon: Database,
      description: 'Data model management'
    },
    {
      id: 'bigquery',
      name: 'SQL Query',
      icon: Code,
      description: 'SQL query interface'
    },
    {
      id: 'notebook',
      name: 'Data Science',
      icon: FileText,
      description: 'Jupyter-style notebooks'
    },
    {
      id: 'ai-analyst',
      name: 'Chat with AI',
      icon: MessageCircle,
      description: 'AI-powered data analysis'
    },
    {
      id: 'settings',
      name: 'System Settings',
      icon: Settings,
      description: 'Global system configuration'
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      description: 'Security and access control'
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: Activity,
      description: 'Performance monitoring'
    },
    {
      id: 'export',
      name: 'Data Export',
      icon: Cloud,
      description: 'Data export and import'
    },
    {
      id: 'integrations',
      name: 'Integrations',
      icon: Key,
      description: 'Third-party integrations'
    },
    {
      id: 'logs',
      name: 'Logs',
      icon: FileTextIcon,
      description: 'System logs and monitoring'
    },
    {
      id: 'database',
      name: 'Database',
      icon: DatabaseIcon,
      description: 'Database management'
    },
    {
      id: 'change-requests',
      name: 'Change Requests',
      icon: GitBranch,
      description: 'Database change approval workflows'
    },
    {
      id: 'sql-linting',
      name: 'SQL Linting',
      icon: CheckCircle2,
      description: 'SQL review and linting system'
    },
    {
      id: 'schema-migrations',
      name: 'Schema Migrations',
      icon: FileCode,
      description: 'Schema migration management'
    },
    {
      id: 'data-masking',
      name: 'Data Masking',
      icon: ShieldCheck,
      description: 'Data masking and security'
    },
    {
      id: 'cache',
      name: 'Cache',
      icon: Zap,
      description: 'Cache management'
    },
    {
      id: 'storage',
      name: 'Storage',
      icon: HardDrive,
      description: 'Storage management'
    },
    {
      id: 'bi',
      name: 'BI & Reports',
      icon: BarChart3,
      description: 'Business intelligence'
    },
    {
      id: 'projects',
      name: 'Project Management',
      icon: Kanban,
      description: 'Ticket and project management'
    },
    {
      id: 'ontology',
      name: 'Data Ontology',
      icon: Network,
      description: 'Data relationships and lineage'
    },
    {
      id: 'audit',
      name: 'Audit Logs',
      icon: History,
      description: 'System audit and activity logs'
    },
    {
      id: 'backup',
      name: 'Backup & Recovery',
      icon: Cloud,
      description: 'Backup and recovery management'
    },
    {
      id: 'api',
      name: 'API Management',
      icon: Key,
      description: 'API client and management'
    },
    {
      id: 'themes',
      name: 'Theme & Branding',
      icon: Palette,
      description: 'Theme and branding customization'
    },
    {
      id: 'roles',
      name: 'Role Management',
      icon: Users,
      description: 'Role and permission management'
    },
    {
      id: 'assets',
      name: 'Asset Management',
      icon: Database,
      description: 'Manage database types, system types, logos, and localizations'
    },
  ]

  const groupedTabs = {
    overview: [
      { id: 'overview', name: 'Homepage', icon: Monitor, href: '/' },
      { id: 'knowledge-base', name: 'Knowledge Base', icon: BookOpen, href: '/knowledge' },
      { id: 'projects', name: 'Project Management', icon: Kanban, href: '/tools/projects' },
    ],
    tools: [
      { id: 'bigquery', name: 'SQL Query', icon: Code, href: '/tools/bigquery' },
      { id: 'notebook', name: 'Data Science', icon: FileText, href: '/tools/notebook' },
      { id: 'ai-analyst', name: 'Chat with AI', icon: MessageCircle, href: '/tools/ai-analyst' },
      { id: 'ai-chat-ui', name: 'Agent Embed GUI', icon: Bot, href: '/tools/ai-chat-ui' },
      { id: 'marketplace', name: 'Marketplace', icon: Store, href: '/marketplace' },
      { id: 'bi', name: 'BI & Reports', icon: BarChart3, href: '/tools/bi' },
      { id: 'storage', name: 'Storage', icon: HardDrive, href: '/tools/storage' },
      { id: 'data-governance', name: 'Data Governance', icon: Shield, href: '/tools/data-governance' },
    ],
    system: [
      { id: 'users', name: 'User Management', icon: Users, href: '/system/users' },
      { id: 'roles', name: 'Role Management', icon: Users, href: '/system/roles' },
      { id: 'space-layouts', name: 'Space Layouts', icon: Layout, href: '/system/space-layouts' },
      { id: 'assets', name: 'Asset Management', icon: Database, href: '/system/assets' },
      { id: 'data', name: 'Data Models', icon: Database, href: '/system/data' },
      { id: 'kernels', name: 'Kernel Management', icon: Server, href: '/system/kernels' },
      { id: 'logs', name: 'Logs', icon: FileTextIcon, href: '/system/logs' },
      { id: 'audit', name: 'Audit Logs', icon: History, href: '/system/audit' },
      { id: 'database', name: 'Database', icon: DatabaseIcon, href: '/system/database' },
      { id: 'change-requests', name: 'Change Requests', icon: GitBranch, href: '/system/change-requests' },
      { id: 'sql-linting', name: 'SQL Linting', icon: CheckCircle2, href: '/system/sql-linting' },
      { id: 'schema-migrations', name: 'Schema Migrations', icon: FileCode, href: '/system/schema-migrations' },
      { id: 'data-masking', name: 'Data Masking', icon: ShieldCheck, href: '/system/data-masking' },
      { id: 'cache', name: 'Cache', icon: Zap, href: '/system/cache' },
      { id: 'backup', name: 'Backup & Recovery', icon: Cloud, href: '/system/backup' },
      { id: 'security', name: 'Security', icon: Shield, href: '/system/security' },
      { id: 'performance', name: 'Performance', icon: Activity, href: '/system/performance' },
      { id: 'settings', name: 'System Settings', icon: Settings, href: '/system/settings' },
      { id: 'themes', name: 'Theme & Branding', icon: Palette, href: '/system/themes' },
      { id: 'integrations', name: 'Integrations', icon: Key, href: '/system/integrations' },
      { id: 'api', name: 'API Management', icon: Key, href: '/system/api' }
    ],
    'data-management': [
      { id: 'space-selection', name: 'Data Management', icon: FolderKanban, href: '/admin/space-selection' }
    ],
    infrastructure: [
      { id: 'infrastructure', name: 'Infrastructure', icon: Network, href: '/infrastructure' }
    ]
  }

  // Group metadata for primary sidebar
  const groupMetadata = {
    overview: { name: 'Homepage', icon: Monitor },
    tools: { name: 'Tools', icon: FlaskConical },
    infrastructure: { name: 'Infrastructure', icon: Network },
    system: { name: 'System', icon: Settings },
    'data-management': { name: 'Data Management', icon: FolderKanban }
  }
  
  // Define group sections for secondary sidebar separators
  const groupSections: Record<string, string[]> = {
    management: ['users', 'roles', 'space-layouts', 'assets', 'data'],
    kernels: ['kernels'],
    system: ['logs', 'audit', 'database', 'change-requests', 'sql-linting', 'schema-migrations', 'data-masking', 'cache', 'backup'],
    security: ['security', 'performance'],
    integrations: ['settings', 'themes', 'integrations', 'api']
  }

  // Define tool categories for the Tools group
  const toolSections: Record<string, string[]> = {
    'Reporting': ['bi'],
    'AI & Assistants': ['ai-analyst', 'ai-chat-ui'],
    'Data Tools': ['bigquery', 'notebook', 'storage', 'data-governance'],
    'Platform Services': ['marketplace']
  }


  const handleTabClick = useCallback((tabId: string, href?: string) => {
    // Always use href if available, otherwise construct from tabId
    const targetHref = href || `/${tabId}`
    router.push(targetHref)
  }, [router])

  const handleGroupClick = useCallback((groupName: string) => {
    const tabs = groupedTabs[groupName as keyof typeof groupedTabs]
    // Data Management has no secondary sidebar - go directly to the tab and clear selectedGroup
    if (groupName === 'data-management' && tabs && tabs.length > 0) {
      if (onGroupSelect) {
        onGroupSelect('') // Clear selectedGroup to hide secondary sidebar
      }
      handleTabClick(tabs[0].id, (tabs[0] as any).href)
      return
    }
    
    // Infrastructure shows VM list in secondary sidebar
    if (groupName === 'infrastructure') {
      if (onGroupSelect) {
        onGroupSelect(groupName) // Show secondary sidebar with VM list
      }
      // Navigate to infrastructure page if not already there
      if (activeTab !== 'infrastructure' && tabs && tabs.length > 0) {
        handleTabClick(tabs[0].id, (tabs[0] as any).href)
      }
      return
    }
    
    if (onGroupSelect) {
      onGroupSelect(groupName)
    }
    // If group has tabs, select the first one
    if (tabs && tabs.length > 0) {
      handleTabClick(tabs[0].id, (tabs[0] as any).href)
    }
  }, [onGroupSelect, handleTabClick, activeTab])

  // Filter tabs based on search query
  const filterTabs = useCallback((tabs: any[], query: string) => {
    if (!query || query.trim() === '') {
      return tabs
    }
    const lowerQuery = query.toLowerCase()
    return tabs.filter(tab => 
      tab.name.toLowerCase().includes(lowerQuery) ||
      tab.id.toLowerCase().includes(lowerQuery) ||
      (tab.description && tab.description.toLowerCase().includes(lowerQuery))
    )
  }, [])



  const sidebarBg = mode === 'primary' 
    ? 'var(--brand-platform-sidebar-bg, hsl(var(--background)))'
    : 'var(--brand-secondary-sidebar-bg, hsl(var(--muted)))'
  
  const sidebarText = mode === 'primary'
    ? 'var(--brand-platform-sidebar-text, hsl(var(--foreground)))'
    : 'var(--brand-secondary-sidebar-text, hsl(var(--muted-foreground)))'

  return (
    <div 
      className={`h-full flex flex-col w-full`}
      data-sidebar={mode}
      data-component="platform-sidebar"
      style={{ 
        position: 'relative',
        zIndex: Z_INDEX.sidebar,
        pointerEvents: 'auto',
        backgroundColor: sidebarBg,
        color: sidebarText
      }}
    >
 

      {/* GCP-style Navigation */}
      <ScrollArea 
        className="flex-1 overflow-auto"
        style={{ pointerEvents: 'auto' }}
      >
        <div 
          className={mode === 'secondary' ? 'min-h-full py-2 px-2' : 'py-2 px-2'}
          style={{ pointerEvents: 'auto' }}
        >
          {mode === 'primary' ? (
            // Primary sidebar - show groups
            collapsed ? (
              // Collapsed view - show only group icons
              <div className="space-y-1">
                {Object.entries(groupMetadata).map(([groupId, group], index) => {
                  const Icon = group.icon
                  const isDataManagement = groupId === 'data-management'
                  const isInfrastructure = groupId === 'infrastructure'
                  
                  return (
                    <div key={groupId}>
                      {isDataManagement && index > 0 && (
                        <div className="border-t border-border my-1 mx-2" />
                      )}
                    <Button
                      variant="ghost"
                      className={cn(
                          "platform-sidebar-menu-button w-full justify-center h-10 transition-colors duration-150 cursor-pointer",
                          (selectedGroup === groupId || (groupId === 'data-management' && (activeTab === 'space-selection' || selectedGroup === 'data-management')) || (groupId === 'infrastructure' && activeTab === 'infrastructure'))
                           ? "platform-sidebar-menu-button-active !bg-muted !text-foreground rounded-sm" 
                          : "text-muted-foreground !hover:bg-muted !hover:text-foreground rounded-none"
                      )}
                      onClick={() => handleGroupClick(groupId)}
                      onMouseEnter={() => {
                        const tabs = groupedTabs[groupId as keyof typeof groupedTabs]
                        // Only show secondary sidebar if group has tabs and is not data-management
                        if (tabs && tabs.length > 0 && groupId !== 'data-management') {
                          onGroupHover?.(groupId)
                        }
                      }}
                      onMouseLeave={() => {
                        // Only clear hover if not currently selected
                        if (selectedGroup !== groupId) {
                          onGroupLeave?.()
                        }
                      }}
                      title={group.name}
                      style={{ 
                        pointerEvents: 'auto', 
                        position: 'relative', 
                        zIndex: Z_INDEX.sidebar + 1
                      }}
                    >
                        <Icon className="h-5 w-5" />
                    </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Expanded view - show groups with names
              <div className="space-y-1">
                {Object.entries(groupMetadata).map(([groupId, group], index) => {
                  const Icon = group.icon
                  const tabs = groupedTabs[groupId as keyof typeof groupedTabs]
                  const isDataManagement = groupId === 'data-management'
                  const isInfrastructure = groupId === 'infrastructure'
                  const isLastGroup = index === Object.entries(groupMetadata).length - 1
                  
                  return (
                    <div key={groupId}>
                      {isDataManagement && (
                        <div className="border-t border-border my-2 mx-4" />
                      )}
                    <Button
                      variant="ghost"
                      className={cn(
                        "platform-sidebar-menu-button w-full justify-start text-sm font-medium h-10 px-4 transition-colors duration-150 cursor-pointer",
                          (selectedGroup === groupId || (groupId === 'data-management' && activeTab === 'space-selection') || (groupId === 'infrastructure' && activeTab === 'infrastructure'))
                          ? "platform-sidebar-menu-button-active !bg-muted !text-foreground rounded-sm" 
                          : "text-foreground !hover:bg-muted !hover:text-foreground rounded-none"
                      )}
                      onClick={() => handleGroupClick(groupId)}
                      onMouseEnter={() => {
                        const tabs = groupedTabs[groupId as keyof typeof groupedTabs]
                        // Only show secondary sidebar if group has tabs and is not data-management
                        if (tabs && tabs.length > 0 && groupId !== 'data-management') {
                          onGroupHover?.(groupId)
                        }
                      }}
                      onMouseLeave={() => {
                        // Only clear hover if not currently selected
                        if (selectedGroup !== groupId) {
                          onGroupLeave?.()
                        }
                      }}
                      style={{ 
                        pointerEvents: 'auto', 
                        position: 'relative', 
                        zIndex: Z_INDEX.sidebar + 1
                      }}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      <span className="flex-1 text-left">{group.name}</span>
                        {!isDataManagement && !isInfrastructure && (
                      <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                        )}
                    </Button>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            // Secondary sidebar - show submenu items for selected group or Horizon tab for infrastructure
            selectedGroup === 'infrastructure' ? (
              // Infrastructure group - show Horizon tab with VMs and Services
              <div className="w-full h-full flex flex-col">
                {/* Collapse button for secondary sidebar */}
                {onToggleCollapse && (
                  <div className="border-b border-border">
                    <Button
                      variant="ghost"
                      className="platform-sidebar-menu-button w-full justify-start text-sm font-medium h-9 px-4 rounded-none text-muted-foreground !hover:bg-muted cursor-pointer"
                      onClick={onToggleCollapse}
                      style={{ 
                        pointerEvents: 'auto', 
                        position: 'relative', 
                        zIndex: 101
                      }}
                      title="Collapse secondary sidebar"
                      aria-label="Collapse secondary sidebar"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      <span>Collapse</span>
                    </Button>
                  </div>
                )}
                <HorizonSidebar
                  selectedVmId={selectedVmId}
                  onVmSelect={onVmSelect}
                  spaceId={selectedSpace}
                  onVmPermission={onVmPermission}
                  onVmRemove={onVmRemove}
                  onVmReboot={onVmReboot}
                  onVmEdit={onVmEdit}
                  onVmAccess={onVmAccess}
                  onAddVm={onAddVm}
                />
              </div>
            ) : selectedGroup && groupedTabs[selectedGroup as keyof typeof groupedTabs] ? (
              <div className="w-full pb-4">
                {/* Collapse button for secondary sidebar */}
                {onToggleCollapse && (
                  <div className="border-b border-border mb-2">
                    <Button
                      variant="ghost"
                      className="platform-sidebar-menu-button w-full justify-start text-sm font-medium h-9 px-4 rounded-none text-muted-foreground !hover:bg-muted cursor-pointer"
                      onClick={onToggleCollapse}
                      style={{ 
                        pointerEvents: 'auto', 
                        position: 'relative', 
                        zIndex: 101
                      }}
                      title="Collapse secondary sidebar"
                      aria-label="Collapse secondary sidebar"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      <span>Collapse</span>
                    </Button>
                  </div>
                )}
                
           

                {/* Submenu items with separators between sections (for system group) */}
                {selectedGroup === 'system' ? (
                  <>
                    {/* Management Section */}
                    <div className="py-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Management
                      </div>
                      {groupedTabs.system
                        .filter(tab => groupSections.management.includes(tab.id))
                        .map(tab => (
                          <Button
                            key={tab.id}
                            variant="ghost"
                            className={cn(
                              "platform-sidebar-menu-button w-full justify-start items-center text-sm h-9 px-4 transition-colors duration-150 cursor-pointer",
                              activeTab === tab.id 
                                ? "platform-sidebar-menu-button-active !bg-muted !text-foreground rounded-sm" 
                                : "text-muted-foreground !hover:bg-muted !hover:text-foreground rounded-none"
                            )}
                            onClick={() => handleTabClick(tab.id, (tab as any).href)}
                            style={{ 
                              pointerEvents: 'auto', 
                              position: 'relative', 
                              zIndex: Z_INDEX.sidebar + 1
                            }}
                          >
                            <tab.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                            <span className="truncate text-left">{tab.name}</span>
                          </Button>
                        ))}
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-border my-2 mx-0" />
                    
                    {/* Kernels Section */}
                    <div className="py-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Kernels
                      </div>
                      {filterTabs(
                        groupedTabs.system.filter(tab => groupSections.kernels.includes(tab.id)),
                        searchValue
                      ).map(tab => (
                          <Button
                            key={tab.id}
                            variant="ghost"
                            className={cn(
                              "platform-sidebar-menu-button w-full justify-start items-center text-sm h-9 px-4 transition-colors duration-150 cursor-pointer",
                              activeTab === tab.id 
                                ? "platform-sidebar-menu-button-active !bg-muted !text-foreground rounded-sm" 
                                : "text-muted-foreground !hover:bg-muted !hover:text-foreground rounded-none"
                            )}
                            onClick={() => handleTabClick(tab.id, (tab as any).href)}
                            style={{ 
                              pointerEvents: 'auto', 
                              position: 'relative', 
                              zIndex: Z_INDEX.sidebar + 1
                            }}
                          >
                            <tab.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                            <span className="truncate text-left">{tab.name}</span>
                          </Button>
                        ))}
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-border my-2 mx-0" />
                    
                    {/* System Section */}
                    <div className="py-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        System
                      </div>
                      {filterTabs(
                        groupedTabs.system.filter(tab => groupSections.system.includes(tab.id)),
                        searchValue
                      ).map(tab => (
                          <Button
                            key={tab.id}
                            variant="ghost"
                            className={cn(
                              "platform-sidebar-menu-button w-full justify-start items-center text-sm h-9 px-4 transition-colors duration-150 cursor-pointer",
                              activeTab === tab.id 
                                ? "platform-sidebar-menu-button-active !bg-muted !text-foreground rounded-sm" 
                                : "text-muted-foreground !hover:bg-muted !hover:text-foreground rounded-none"
                            )}
                            onClick={() => handleTabClick(tab.id, (tab as any).href)}
                            style={{ 
                              pointerEvents: 'auto', 
                              position: 'relative', 
                              zIndex: Z_INDEX.sidebar + 1
                            }}
                          >
                            <tab.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                            <span className="truncate text-left">{tab.name}</span>
                          </Button>
                        ))}
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-border my-2 mx-0" />
                    
                    {/* Security Section */}
                    <div className="py-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Security
                      </div>
                      {filterTabs(
                        groupedTabs.system.filter(tab => groupSections.security.includes(tab.id)),
                        searchValue
                      ).map(tab => (
                          <Button
                            key={tab.id}
                            variant="ghost"
                            className={cn(
                              "platform-sidebar-menu-button w-full justify-start items-center text-sm h-9 px-4 transition-colors duration-150 cursor-pointer",
                              activeTab === tab.id 
                                ? "platform-sidebar-menu-button-active !bg-muted !text-foreground rounded-md" 
                                : "text-muted-foreground !hover:bg-muted !hover:text-foreground rounded-none"
                            )}
                            onClick={() => handleTabClick(tab.id, (tab as any).href)}
                            style={{ 
                              pointerEvents: 'auto', 
                              position: 'relative', 
                              zIndex: Z_INDEX.sidebar + 1
                            }}
                          >
                            <tab.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                            <span className="truncate text-left">{tab.name}</span>
                          </Button>
                        ))}
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-border my-2 mx-4" />
                    
                    {/* Integrations Section */}
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Integrations
                      </div>
                      {filterTabs(
                        groupedTabs.system.filter(tab => groupSections.integrations.includes(tab.id)),
                        searchValue
                      ).map(tab => (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    className={cn(
                      "platform-sidebar-menu-button w-full justify-start items-center text-sm h-9 px-4 transition-colors duration-150 cursor-pointer",
                      activeTab === tab.id 
                        ? "platform-sidebar-menu-button-active !bg-muted !text-foreground rounded-sm" 
                        : "text-muted-foreground !hover:bg-muted !hover:text-foreground rounded-none"
                    )}
                    onClick={() => handleTabClick(tab.id, (tab as any).href)}
                    style={{ 
                      pointerEvents: 'auto', 
                      position: 'relative', 
                      zIndex: 101
                    }}
                  >
                    <tab.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span className="truncate text-left">{tab.name}</span>
                  </Button>
                ))}
                    </div>
                  </>
                ) : selectedGroup === 'tools' ? (
                  // Tools group with category section headers
                  <>
                    {Object.entries(toolSections).map(([sectionName, ids], sectionIndex) => (
                      <div key={sectionName} className="px-4 py-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {sectionName}
                        </div>
                        {filterTabs(
                          groupedTabs.tools.filter(tab => ids.includes(tab.id)),
                          searchValue
                        ).map(tab => (
                            <Button
                              key={tab.id}
                              variant="ghost"
                              className={cn(
                                "platform-sidebar-menu-button w-full justify-start items-center text-sm h-9 px-4 transition-colors duration-150 cursor-pointer",
                                activeTab === tab.id 
                                  ? "platform-sidebar-menu-button-active !bg-muted !text-foreground rounded-sm" 
                                  : "text-muted-foreground !hover:bg-muted !hover:text-foreground rounded-none"
                              )}
                              onClick={() => handleTabClick(tab.id, (tab as any).href)}
                              style={{ 
                                pointerEvents: 'auto', 
                                position: 'relative', 
                                zIndex: Z_INDEX.sidebar + 1,
                                ...(activeTab === tab.id ? { backgroundColor: 'hsl(var(--muted))' } : {})
                              }}
                            >
                              <tab.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                              <span className="truncate text-left">{tab.name}</span>
                            </Button>
                          ))}
                        {sectionIndex < Object.entries(toolSections).length - 1 && (
                          <div className="border-t border-border my-2 mx-0" />
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  // Other groups - no separators
                  filterTabs(
                    groupedTabs[selectedGroup as keyof typeof groupedTabs] || [],
                    searchValue
                  ).map(tab => (
                    <Button
                      key={tab.id}
                      variant="ghost"
                      className={cn(
                        "platform-sidebar-menu-button w-full justify-start items-center text-sm h-9 px-4 transition-colors duration-150 cursor-pointer",
                        activeTab === tab.id 
                          ? "platform-sidebar-menu-button-active !bg-muted !text-foreground rounded-md" 
                          : "text-muted-foreground !hover:bg-muted !hover:text-foreground rounded-none"
                      )}
                      onClick={() => handleTabClick(tab.id, (tab as any).href)}
                      style={{ 
                        pointerEvents: 'auto', 
                        position: 'relative', 
                        zIndex: Z_INDEX.sidebar + 1,
                        ...(activeTab === tab.id ? { backgroundColor: 'hsl(var(--muted))' } : {})
                      }}
                    >
                      <tab.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span className="truncate text-left">{tab.name}</span>
                    </Button>
                  ))
                )}
              </div>
            ) : (
              // Fallback: Show message if group not found
              <div className="p-4 text-sm text-muted-foreground">
                No menu items available for this group.
              </div>
            )
          )}
        </div>
      </ScrollArea>

      {/* GCP-style Footer */}
      {mode === 'primary' && onToggleCollapse && (
        <div 
          className={`px-4 py-3 border-t border-border bg-background ${collapsed ? 'px-2' : ''}`}
          style={{ pointerEvents: 'auto' }}
        >
          {collapsed ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleCollapse}
                title="Expand sidebar"
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 101 }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
              <span className="text-xs text-muted-foreground" style={{ color: sidebarText }}>
                v{APP_VERSION}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleCollapse}
                className="w-full justify-start flex items-center gap-2"
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 101 }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Collapse
              </Button>
              <div className="text-xs text-muted-foreground text-center" style={{ color: sidebarText }}>
                Version {APP_VERSION}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
