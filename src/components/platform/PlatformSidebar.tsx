'use client'

import { useState, useEffect } from 'react'
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
  Kanban
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlatformSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  selectedSpace?: string
  onSpaceChange?: (spaceId: string) => void
  collapsed?: boolean
  selectedGroup?: string | null
  onGroupSelect?: (group: string) => void
  mode?: 'primary' | 'secondary'
  onToggleCollapse?: () => void
}

export function PlatformSidebar({ 
  activeTab, 
  onTabChange, 
  selectedSpace, 
  onSpaceChange,
  collapsed = false,
  selectedGroup,
  onGroupSelect,
  mode = 'primary',
  onToggleCollapse
}: PlatformSidebarProps) {
  const router = useRouter()

  const adminTabs = [
    {
      id: 'overview',
      name: 'Homepage',
      icon: Monitor,
      description: 'System homepage'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      description: 'Analytics and monitoring'
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
      id: 'attachments',
      name: 'Attachments',
      icon: Paperclip,
      description: 'File and attachment management'
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
      name: 'AI Analyst',
      icon: Bot,
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
      id: 'health',
      name: 'System Health',
      icon: Heart,
      description: 'System health monitoring'
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
  ]

  const groupedTabs = {
    overview: [
      { id: 'overview', name: 'Homepage', icon: Monitor },
      { id: 'analytics', name: 'Analytics', icon: BarChart3 }
    ],
    tools: [
      { id: 'bigquery', name: 'SQL Query', icon: Code },
      { id: 'notebook', name: 'Data Science', icon: FileText },
      { id: 'ai-analyst', name: 'AI Analyst', icon: Bot },
      { id: 'ai-chat-ui', name: 'AI Chat UI', icon: Bot },
      { id: 'knowledge-base', name: 'Knowledge Base', icon: BookOpen },
      { id: 'projects', name: 'Project Management', icon: Kanban },
      { id: 'bi', name: 'BI & Reports', icon: BarChart3 },
      { id: 'storage', name: 'Storage', icon: HardDrive },
    ],
    system: [
      { id: 'users', name: 'User Management', icon: Users },
      { id: 'space-layouts', name: 'Space Layouts', icon: Layout },
      { id: 'data', name: 'Data Models', icon: Database },
      { id: 'attachments', name: 'Attachments', icon: Paperclip },
      { id: 'kernels', name: 'Kernel Management', icon: Server },
      { id: 'health', name: 'System Health', icon: Heart },
      { id: 'logs', name: 'Logs', icon: FileTextIcon },
      { id: 'database', name: 'Database', icon: DatabaseIcon },
      { id: 'change-requests', name: 'Change Requests', icon: GitBranch },
      { id: 'sql-linting', name: 'SQL Linting', icon: CheckCircle2 },
      { id: 'schema-migrations', name: 'Schema Migrations', icon: FileCode },
      { id: 'data-masking', name: 'Data Masking', icon: ShieldCheck },
      { id: 'cache', name: 'Cache', icon: Zap },
      { id: 'security', name: 'Security', icon: Shield },
      { id: 'performance', name: 'Performance', icon: Activity },
      { id: 'settings', name: 'System Settings', icon: Settings },
      { id: 'page-templates', name: 'Page Templates', icon: FileText },
      { id: 'export', name: 'Data Export', icon: Cloud },
      { id: 'integrations', name: 'Integrations', icon: Key }
    ],
    'data-management': [
      { id: 'space-selection', name: 'Data Management', icon: FolderKanban }
    ]
  }

  // Group metadata for primary sidebar
  const groupMetadata = {
    overview: { name: 'Homepage', icon: Monitor },
    tools: { name: 'Tools', icon: FlaskConical },
    system: { name: 'System', icon: Settings },
    'data-management': { name: 'Data Management', icon: FolderKanban }
  }
  
  // Define group sections for secondary sidebar separators
  const groupSections: Record<string, string[]> = {
    management: ['users', 'space-layouts', 'data', 'attachments'],
    kernels: ['kernels'],
    system: ['health', 'logs', 'database', 'change-requests', 'sql-linting', 'schema-migrations', 'data-masking', 'cache'],
    security: ['security', 'performance'],
    integrations: ['settings', 'page-templates', 'export', 'integrations']
  }

  // Define tool categories for the Tools group
  const toolSections: Record<string, string[]> = {
    'AI & Assistants': ['ai-analyst', 'ai-chat-ui'],
    'Data Tools': ['bigquery', 'storage'],
    'Knowledge': ['knowledge-base'],
    'Project Management': ['projects'],
    'Reporting': ['bi']
  }


  const handleGroupClick = (groupName: string) => {
    const tabs = groupedTabs[groupName as keyof typeof groupedTabs]
    // Data Management has no secondary sidebar - go directly to the tab and clear selectedGroup
    if (groupName === 'data-management' && tabs && tabs.length > 0) {
      if (onGroupSelect) {
        onGroupSelect('') // Clear selectedGroup to hide secondary sidebar
      }
      handleTabClick(tabs[0].id)
      return
    }
    
    if (onGroupSelect) {
      onGroupSelect(groupName)
    }
    // If group has tabs, select the first one
    if (tabs && tabs.length > 0) {
      handleTabClick(tabs[0].id)
    }
  }

  const handleTabClick = (tabId: string) => {
    // Update parent state if present
    onTabChange(tabId)
    // Ensure navigation to homepage with the selected tab
    try {
      router.push(`/?tab=${encodeURIComponent(tabId)}`)
    } catch {}
  }



  return (
    <div className={`h-full border-r border-border flex flex-col w-full bg-background`}>
      {/* GCP-style Header */}
      {mode === 'primary' && (
        <div className={`px-4 py-3 border-b border-border bg-background ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-base font-medium text-foreground">Unified Data Platform</h2>
                <p className="text-xs text-muted-foreground">System Administration</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GCP-style Navigation */}
      <ScrollArea className="flex-1">
        <div className="py-2 px-2">
          {mode === 'primary' ? (
            // Primary sidebar - show groups
            collapsed ? (
              // Collapsed view - show only group icons
              <div className="space-y-1">
                {Object.entries(groupMetadata).map(([groupId, group], index) => {
                  const Icon = group.icon
                  const isDataManagement = groupId === 'data-management'
                  
                  return (
                    <div key={groupId}>
                      {isDataManagement && index > 0 && (
                        <div className="border-t border-gray-200 my-1 mx-2" />
                      )}
                    <Button
                      variant="ghost"
                      className={cn(
                          "w-full justify-center h-10 transition-colors duration-150",
                          (selectedGroup === groupId || (groupId === 'data-management' && activeTab === 'space-selection'))
                           ? "bg-gray-200 text-gray-900 rounded-sm" 
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-none"
                      )}
                      onClick={() => handleGroupClick(groupId)}
                      title={group.name}
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
                  const isLastGroup = index === Object.entries(groupMetadata).length - 1
                  
                  return (
                    <div key={groupId}>
                      {isDataManagement && (
                        <div className="border-t border-gray-200 my-2 mx-4" />
                      )}
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sm font-medium h-10 px-4 transition-colors duration-150",
                          (selectedGroup === groupId || (groupId === 'data-management' && activeTab === 'space-selection'))
                          ? "bg-gray-200 text-gray-900 rounded-sm" 
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-none"
                      )}
                      onClick={() => handleGroupClick(groupId)}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      <span className="flex-1 text-left">{group.name}</span>
                        {tabs && !isDataManagement && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {tabs.length}
                        </span>
                      )}
                        {!isDataManagement && (
                      <ChevronRight className="h-4 w-4 ml-2 text-gray-400" />
                        )}
                    </Button>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            // Secondary sidebar - show submenu items for selected group
            selectedGroup && groupedTabs[selectedGroup as keyof typeof groupedTabs] ? (
              <div className="space-y-1">
                {/* Back button to deselect group */}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-medium h-9 px-4 rounded-none mb-2 text-gray-600 hover:bg-gray-100"
                  onClick={() => onGroupSelect?.('')}
                >
                  <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                  <span>Back</span>
                </Button>
                
                {/* Group header */}
                <div className="px-4 py-2 mb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = groupMetadata[selectedGroup as keyof typeof groupMetadata]?.icon
                      return Icon ? <Icon className="h-4 w-4 text-gray-500" /> : null
                    })()}
                    <span className="text-sm font-semibold text-gray-900">
                      {groupMetadata[selectedGroup as keyof typeof groupMetadata]?.name}
                    </span>
                  </div>
                </div>

                {/* Submenu items with separators between sections (for system group) */}
                {selectedGroup === 'system' ? (
                  <>
                    {/* Management Section */}
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Management
                      </div>
                      {groupedTabs.system
                        .filter(tab => groupSections.management.includes(tab.id))
                        .map(tab => (
                          <Button
                            key={tab.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-sm h-9 px-4 transition-colors duration-150",
                              activeTab === tab.id 
                                ? "bg-gray-200 text-gray-900 rounded-sm" 
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-none"
                            )}
                            onClick={() => handleTabClick(tab.id)}
                          >
                            <tab.icon className="h-4 w-4 mr-3 text-gray-500" />
                            <span className="truncate">{tab.name}</span>
                          </Button>
                        ))}
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-gray-200 my-2 mx-4" />
                    
                    {/* Kernels Section */}
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Kernels
                      </div>
                      {groupedTabs.system
                        .filter(tab => groupSections.kernels.includes(tab.id))
                        .map(tab => (
                          <Button
                            key={tab.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-sm h-9 px-4 transition-colors duration-150",
                              activeTab === tab.id 
                                ? "bg-gray-200 text-gray-900 rounded-sm" 
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-none"
                            )}
                            onClick={() => handleTabClick(tab.id)}
                          >
                            <tab.icon className="h-4 w-4 mr-3 text-gray-500" />
                            <span className="truncate">{tab.name}</span>
                          </Button>
                        ))}
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-gray-200 my-2 mx-4" />
                    
                    {/* System Section */}
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        System
                      </div>
                      {groupedTabs.system
                        .filter(tab => groupSections.system.includes(tab.id))
                        .map(tab => (
                          <Button
                            key={tab.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-sm h-9 px-4 transition-colors duration-150",
                              activeTab === tab.id 
                                ? "bg-gray-200 text-gray-900 rounded-sm" 
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-none"
                            )}
                            onClick={() => handleTabClick(tab.id)}
                          >
                            <tab.icon className="h-4 w-4 mr-3 text-gray-500" />
                            <span className="truncate">{tab.name}</span>
                          </Button>
                        ))}
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-gray-200 my-2 mx-4" />
                    
                    {/* Security Section */}
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Security
                      </div>
                      {groupedTabs.system
                        .filter(tab => groupSections.security.includes(tab.id))
                        .map(tab => (
                          <Button
                            key={tab.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-sm h-9 px-4 transition-colors duration-150",
                              activeTab === tab.id 
                                ? "bg-gray-200 text-gray-900 rounded-md" 
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-none"
                            )}
                            onClick={() => handleTabClick(tab.id)}
                          >
                            <tab.icon className="h-4 w-4 mr-3 text-gray-500" />
                            <span className="truncate">{tab.name}</span>
                          </Button>
                        ))}
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-gray-200 my-2 mx-4" />
                    
                    {/* Integrations Section */}
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Integrations
                      </div>
                      {groupedTabs.system
                        .filter(tab => groupSections.integrations.includes(tab.id))
                        .map(tab => (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-sm h-9 px-4 transition-colors duration-150",
                      activeTab === tab.id 
                        ? "bg-gray-200 text-gray-900 rounded-sm" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-none"
                    )}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <tab.icon className="h-4 w-4 mr-3 text-gray-500" />
                    <span className="truncate">{tab.name}</span>
                  </Button>
                ))}
                    </div>
                  </>
                ) : selectedGroup === 'tools' ? (
                  // Tools group with category section headers
                  <>
                    {Object.entries(toolSections).map(([sectionName, ids], sectionIndex) => (
                      <div key={sectionName} className="px-4 py-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          {sectionName}
                        </div>
                        {groupedTabs.tools
                          .filter(tab => ids.includes(tab.id))
                          .map(tab => (
                            <Button
                              key={tab.id}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start text-sm h-9 px-4 transition-colors duration-150",
                                activeTab === tab.id 
                                  ? "bg-gray-200 text-gray-900 rounded-sm" 
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-none"
                              )}
                              onClick={() => handleTabClick(tab.id)}
                            >
                              <tab.icon className="h-4 w-4 mr-3 text-gray-500" />
                              <span className="truncate">{tab.name}</span>
                            </Button>
                          ))}
                        {sectionIndex < Object.entries(toolSections).length - 1 && (
                          <div className="border-t border-gray-200 my-2 mx-0" />
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  // Other groups - no separators
                  groupedTabs[selectedGroup as keyof typeof groupedTabs].map(tab => (
                    <Button
                      key={tab.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sm h-9 px-4 transition-colors duration-150",
                        activeTab === tab.id 
                          ? "bg-gray-200 text-gray-900 rounded-md" 
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-none"
                      )}
                      onClick={() => handleTabClick(tab.id)}
                    >
                      <tab.icon className="h-4 w-4 mr-3 text-gray-500" />
                      <span className="truncate">{tab.name}</span>
                    </Button>
                  ))
                )}
              </div>
            ) : null
          )}
        </div>
      </ScrollArea>

      {/* GCP-style Footer */}
      {mode === 'primary' && onToggleCollapse && (
        <div className={`px-4 py-3 border-t border-border bg-background ${collapsed ? 'px-2' : ''}`}>
          {collapsed ? (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleCollapse}
                title="Expand sidebar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleCollapse}
                className="w-full justify-start flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Collapse
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
