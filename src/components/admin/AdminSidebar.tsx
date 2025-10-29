'use client'

import { useState, useEffect } from 'react'
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
  Layout
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  selectedSpace?: string
  onSpaceChange?: (spaceId: string) => void
  collapsed?: boolean
}

export function AdminSidebar({ 
  activeTab, 
  onTabChange, 
  selectedSpace, 
  onSpaceChange,
  collapsed = false
}: AdminSidebarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [spaces, setSpaces] = useState<any[]>([])
  const [expandedSection, setExpandedSection] = useState<string>('overview')

  const adminTabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: Monitor,
      description: 'System overview and health'
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
      name: 'BigQuery Interface',
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
      id: 'cache',
      name: 'Cache',
      icon: Zap,
      description: 'Cache management'
    },
    {
      id: 'filesystem',
      name: 'File System',
      icon: HardDrive,
      description: 'File system management'
    },
    {
      id: 'bi',
      name: 'BI & Reports',
      icon: BarChart3,
      description: 'Business intelligence'
    },
  ]

  const groupedTabs = {
    overview: [
      { id: 'overview', name: 'Overview', icon: Monitor },
      { id: 'analytics', name: 'Analytics', icon: BarChart3 }
    ],
    management: [
      { id: 'users', name: 'User Management', icon: Users },
      { id: 'spaces', name: 'Space Management', icon: Building },
      { id: 'space-layouts', name: 'Space Layouts', icon: Layout },
      { id: 'data', name: 'Data Models', icon: Database },
      { id: 'attachments', name: 'Attachments', icon: Paperclip }
    ],
    tools: [
      { id: 'bigquery', name: 'BigQuery Interface', icon: Code },
      { id: 'notebook', name: 'Data Science', icon: FileText },
      { id: 'kernels', name: 'Kernel Management', icon: Server },
      { id: 'ai-analyst', name: 'AI Analyst', icon: Bot },
      { id: 'bi', name: 'BI & Reports', icon: BarChart3 },
    ],
    system: [
      { id: 'health', name: 'System Health', icon: Heart },
      { id: 'logs', name: 'Logs', icon: FileTextIcon },
      { id: 'database', name: 'Database', icon: DatabaseIcon },
      { id: 'cache', name: 'Cache', icon: Zap },
      { id: 'filesystem', name: 'File System', icon: HardDrive }
    ],
    security: [
      { id: 'security', name: 'Security', icon: Shield },
      { id: 'performance', name: 'Performance', icon: Activity }
    ],
    integrations: [
      { id: 'settings', name: 'System Settings', icon: Settings },
      { id: 'page-templates', name: 'Page Templates', icon: FileText },
      { id: 'export', name: 'Data Export', icon: Cloud },
      { id: 'integrations', name: 'Integrations', icon: Key }
    ]
  }

  useEffect(() => {
    loadSpaces()
  }, [])

  const loadSpaces = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section)
  }

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId)
  }


  return (
    <div className={`h-full border-r border-gray-200 flex flex-col w-full ${collapsed ? 'bg-blue-50' : 'bg-white'}`}>
      {/* GCP-style Header */}
      <div className={`px-4 py-3 border-b border-gray-200 bg-white ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-base font-medium text-gray-900">Admin Console</h2>
              <p className="text-xs text-gray-500">System Administration</p>
            </div>
          )}
        </div>
      </div>

      {/* GCP-style Navigation */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {collapsed ? (
            // Collapsed view - show only icons
            <div className="space-y-1">
              {adminTabs.map(tab => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-center h-10 rounded-none transition-colors duration-150",
                    activeTab === tab.id 
                      ? "bg-blue-100 text-blue-700" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => handleTabClick(tab.id)}
                  title={tab.name}
                >
                  <tab.icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          ) : (
            // Expanded view - show full navigation
            Object.entries(groupedTabs).map(([sectionName, tabs]) => (
              <div key={sectionName} className="mb-1">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-sm font-normal h-9 px-4 rounded-none hover:bg-gray-50 transition-colors duration-150",
                    expandedSection === sectionName 
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600" 
                      : "text-gray-700 hover:text-gray-900"
                  )}
                  onClick={() => toggleSection(sectionName)}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {tabs.length}
                    </span>
                  </span>
                  {expandedSection === sectionName ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
                
                {expandedSection === sectionName && (
                  <div className="bg-gray-50 border-l-2 border-blue-200">
                    {tabs.map(tab => (
                      <Button
                        key={tab.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-sm h-8 px-8 rounded-none transition-colors duration-150",
                          activeTab === tab.id 
                            ? "bg-blue-100 text-blue-700 border-r-2 border-blue-600" 
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        onClick={() => handleTabClick(tab.id)}
                      >
                        <tab.icon className="h-4 w-4 mr-3 text-gray-500" />
                        <span className="truncate">{tab.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* GCP-style Footer */}
      <div className={`px-4 py-3 border-t border-gray-200 bg-gray-50 ${collapsed ? 'px-2' : ''}`}>
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>System Online</span>
            </div>
            <span>v1.0</span>
          </div>
        )}
      </div>
    </div>
  )
}
