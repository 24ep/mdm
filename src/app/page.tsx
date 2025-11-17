'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Database,
  BarChart3,
  Settings,
  Users,
  FileText,
  Cloud,
  Table,
  ArrowLeft,
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
  BarChart3 as BarChart3Icon,
  Bot,
  Layout,
  BookOpen,
  Building2,
  Kanban,
  TestTube
} from 'lucide-react'
import { addRecentItem, getRecentItems, type RecentItem } from '@/lib/recent-items'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { BigQueryInterface } from './admin/features/business-intelligence/components/BigQueryInterface'
import { OutlineKnowledgeBase } from '@/features/knowledge'
import { MarketplaceHome } from '@/features/marketplace'
import { InfrastructureOverview } from '@/features/infrastructure'
import { ProjectsList } from '@/components/datascience/ProjectsList'
import { AttachmentManager } from './admin/features/content'
import { UserManagement, RoleManagement, PermissionTester } from './admin/features/users'
import { SystemSettings, PageTemplatesAdmin } from './admin/features/system'
import { AnalyticsDashboard } from './admin/features/analytics'
import { AuditLogs } from './admin/features/security'
import { BackupRecovery } from './admin/features/storage'
import { APIManagement } from './admin/features/integration'
import { NotificationCenter, ThemeBranding } from './admin/features/system'
import { SecurityFeatures } from './admin/features/security'
import { PerformanceMonitoring } from './admin/features/analytics'
import { DataExportImport } from './admin/features/data'
import { IntegrationHub } from './admin/features/integration'
import { SystemHealthDashboard, LogManagement } from './admin/features/analytics'
import { DatabaseManagement } from './admin/features/data'
import { CacheManagement, StorageManagement } from './admin/features/storage'
import { MergedBIReports } from './admin/features/business-intelligence'
import { SpaceSelection, SpaceLayoutsAdmin } from './admin/features/spaces'
import { AIAnalyst, AIChatUI, KernelManagement } from './admin/features/business-intelligence'
import { DataModelManagement } from './admin/features/data'
import { SpaceSettingsAdmin } from './admin/features/spaces'
import { ChangeRequests } from './admin/features/content'
import { SQLLinting, SchemaMigrations, DataMasking } from './admin/features/data'
import { ProjectsManagement } from './admin/features/content'
import { DataGovernance } from './admin/features/data-governance'
import { QuickLinksSection } from '@/components/quick-links/QuickLinksSection'

// Map tab IDs to their new route paths
const getRouteForTab = (tab: string): string => {
  const routeMap: Record<string, string> = {
    'overview': '/',
    'analytics': '/overview/analytics',
    'bigquery': '/tools/bigquery',
    'notebook': '/tools/notebook',
    'ai-analyst': '/tools/ai-analyst',
    'ai-chat-ui': '/tools/ai-chat-ui',
    'knowledge-base': '/knowledge',
    'marketplace': '/marketplace',
    'infrastructure': '/infrastructure',
    'projects': '/tools/projects',
    'bi': '/tools/bi',
    'storage': '/tools/storage',
    'data-governance': '/tools/data-governance',
    'users': '/system/users',
    'roles': '/system/roles',
    'permission-tester': '/system/permission-tester',
    'space-layouts': '/system/space-layouts',
    'space-settings': '/system/space-settings',
    'assets': '/system/assets',
    'data': '/system/data',
    'attachments': '/system/attachments',
    'kernels': '/system/kernels',
    'health': '/system/health',
    'logs': '/system/logs',
    'audit': '/system/audit',
    'database': '/system/database',
    'change-requests': '/system/change-requests',
    'sql-linting': '/system/sql-linting',
    'schema-migrations': '/system/schema-migrations',
    'data-masking': '/system/data-masking',
    'cache': '/system/cache',
    'backup': '/system/backup',
    'security': '/system/security',
    'performance': '/system/performance',
    'settings': '/system/settings',
    'page-templates': '/system/page-templates',
    'notifications': '/system/notifications',
    'themes': '/system/themes',
    'export': '/system/export',
    'integrations': '/system/integrations',
    'api': '/system/api',
    'space-selection': '/data-management/space-selection',
  }
  return routeMap[tab] || '/'
}

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])

  useEffect(() => {
    // Add error boundary for client-side errors
    const handleError = (event: ErrorEvent) => {
      console.error('Admin page error:', event.error)
      setError(event.error?.message || 'An error occurred')
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Redirect old query parameter URLs to new route structure
  useEffect(() => {
    const urlTab = searchParams?.get('tab')
    if (urlTab && pathname === '/') {
      const newRoute = getRouteForTab(urlTab)
      if (newRoute !== '/') {
        router.replace(newRoute)
        return
      }
    }
  }, [searchParams, pathname, router])

  // Load recent items
  useEffect(() => {
    setRecentItems(getRecentItems(8))
  }, [])

  // Track tab changes as recent items
  useEffect(() => {
    if (activeTab && activeTab !== 'overview') {
      const tabConfig = {
        bigquery: { name: 'SQL Query', icon: 'Database', color: '#2563eb' },
        notebook: { name: 'Data Science Notebooks', icon: 'BarChart3', color: '#16a34a' },
        'ai-analyst': { name: 'AI Analyst', icon: 'Bot', color: '#9333ea' },
        'ai-chat-ui': { name: 'AI Chat UI', icon: 'Bot', color: '#10b981' },
        'knowledge-base': { name: 'Knowledge Base', icon: 'BookOpen', color: '#14b8a6' },
        'space-layouts': { name: 'Space Layouts', icon: 'Layout', color: '#4f46e5' },
        attachments: { name: 'Attachment Manager', icon: 'Paperclip', color: '#ea580c' },
        users: { name: 'User Management', icon: 'Users', color: '#dc2626' },
        'space-settings': { name: 'Space Settings', icon: 'Building2', color: '#0891b2' },
        settings: { name: 'System Settings', icon: 'Settings', color: '#6b7280' },
        analytics: { name: 'Analytics', icon: 'BarChart3', color: '#3b82f6' },
        projects: { name: 'Project Management', icon: 'Kanban', color: '#8b5cf6' },
        'data-governance': { name: 'Data Governance', icon: 'Shield', color: '#059669' },
      }[activeTab]

      if (tabConfig) {
        const route = getRouteForTab(activeTab)
        addRecentItem({
          id: activeTab,
          type: 'tool',
          name: tabConfig.name,
          tabId: activeTab,
          url: route,
          icon: tabConfig.icon,
          color: tabConfig.color,
        })
        // Refresh recent items
        setRecentItems(getRecentItems(8))
      }
    }
  }, [activeTab])

  // Sync activeTab with URL (?tab=...) - only for homepage
  useEffect(() => {
    if (pathname === '/') {
      const urlTab = searchParams?.get('tab')
      if (urlTab && urlTab !== activeTab) {
        setActiveTab(urlTab)
      } else if (!urlTab) {
        setActiveTab('overview')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname])

  const handleTabChange = (tab: string) => {
    const route = getRouteForTab(tab)
    if (route === '/') {
      // For homepage, use query parameter
      setActiveTab(tab)
      const params = new URLSearchParams(Array.from(searchParams?.entries?.() || []))
      params.set('tab', tab)
      router.replace(`?${params.toString()}`)
    } else {
      // For other routes, navigate to the new route
      router.push(route)
    }
  }

  const handleRecentItemClick = (item: RecentItem) => {
    if (item.url) {
      router.push(item.url)
    } else if (item.tabId) {
      handleTabChange(item.tabId)
    }
  }

  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, any> = {
      Database,
      BarChart3,
      Bot,
      BookOpen,
      Layout,
      Paperclip,
      Users,
      Building2,
      Settings,
      Monitor,
      Kanban,
    }
    return iconMap[iconName || 'Monitor'] || Monitor
  }

  const handleBackToSpaces = () => {
    router.push('/spaces')
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error loading Unified Data Platform</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => window.location.reload()}>
              Try again
            </Button>
            <Button variant="outline" onClick={handleBackToSpaces}>
              Back to Spaces
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PlatformLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      selectedSpace={selectedSpace}
      onSpaceChange={setSelectedSpace}
    >
      <div>
        {/* Homepage Content */}
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Recent Items Section */}
            {recentItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Recent</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {recentItems.map((item) => {
                    const IconComponent = getIconComponent(item.icon)
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleRecentItemClick(item)}
                        className="flex flex-col items-center gap-2 min-w-[80px] hover:opacity-80 transition-opacity group"
                      >
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center shadow-sm transition-shadow group-hover:shadow-md"
                          style={{
                            backgroundColor: item.color || '#6b7280',
                          }}
                        >
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-xs text-center text-foreground max-w-[80px] truncate">
                          {item.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Data Platform Collection Section */}
            <QuickLinksSection />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('bigquery')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">SQL Query</CardTitle>
                  <CardDescription>Query data across all spaces</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  SQL query interface for cross-space data analysis
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('notebook')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Data Science Notebooks</CardTitle>
                  <CardDescription>Deepnote-like notebook interface</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Interactive notebooks for data science and analysis
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('ai-analyst')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Analyst</CardTitle>
                  <CardDescription>ChatGPT-like data analysis interface</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI-powered data analysis, visualization, and insights generation
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('knowledge-base')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/20">
                  <BookOpen className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Knowledge Base</CardTitle>
                  <CardDescription>Outline-like knowledge base and wiki</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and organize documentation with markdown editing
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('space-layouts')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                  <Layout className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Space Layouts</CardTitle>
                  <CardDescription>Manage layout templates and allowed spaces</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configure templates, preview, and control which spaces can use them
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('attachments')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <Paperclip className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Attachment Manager</CardTitle>
                  <CardDescription>Manage all file attachments across spaces</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View, upload, and manage attachments from all spaces
                </p>
              </CardContent>
            </Card>


            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('users')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                  <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">User Management</CardTitle>
                  <CardDescription>Manage users and permissions</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  User administration, roles, and access control
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('roles')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                  <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Role & Permission Management</CardTitle>
                  <CardDescription>Manage roles and permissions</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and manage roles with custom permissions for global and space levels
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('permission-tester')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <TestTube className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Permission Tester</CardTitle>
                  <CardDescription>Test and debug permissions</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Test user permissions and debug access control issues
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('space-settings')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/20">
                  <Building2 className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Space Settings</CardTitle>
                  <CardDescription>Configure individual space settings</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage space details, members, layouts, and configurations
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('settings')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Settings className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">System Settings</CardTitle>
                  <CardDescription>Configure system-wide settings</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Global system configuration and preferences
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('projects')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Kanban className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Project Management</CardTitle>
                  <CardDescription>ClickUp-style ticket and project management</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage tickets, projects, and tasks with multiple views
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('data-governance')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Data Governance</CardTitle>
                  <CardDescription>OpenMetadata data governance and quality</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage data assets, policies, quality, and lineage using OpenMetadata
                </p>
              </CardContent>
            </Card>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="text-center py-12 px-6">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unified Data Platform Homepage</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a feature from the cards above or use the sidebar to navigate to different admin functions.
            </p>
          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'audit' && <AuditLogs />}
        {activeTab === 'backup' && <BackupRecovery />}
        {activeTab === 'api' && <APIManagement />}
        {activeTab === 'notifications' && <NotificationCenter />}
        {activeTab === 'themes' && <ThemeBranding />}
        {activeTab === 'security' && <SecurityFeatures />}
        {activeTab === 'performance' && <PerformanceMonitoring />}
        {activeTab === 'data' && <DataModelManagement />}
        {activeTab === 'export' && <DataExportImport />}
        {activeTab === 'health' && <SystemHealthDashboard />}
        {activeTab === 'logs' && <LogManagement />}
        {activeTab === 'database' && <DatabaseManagement />}
        {activeTab === 'change-requests' && <ChangeRequests />}
        {activeTab === 'sql-linting' && <SQLLinting />}
        {activeTab === 'schema-migrations' && <SchemaMigrations />}
        {activeTab === 'data-masking' && <DataMasking />}
        {activeTab === 'cache' && <CacheManagement />}
        {activeTab === 'storage' && <StorageManagement />}
        {activeTab === 'bi' && <MergedBIReports />}
        {activeTab === 'reports' && <MergedBIReports />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'roles' && <RoleManagement />}
        {activeTab === 'permission-tester' && <PermissionTester />}
        {activeTab === 'space-selection' && <SpaceSelection />}
        {activeTab === 'space-settings' && <SpaceSettingsAdmin selectedSpaceId={selectedSpace} />}
        {activeTab === 'attachments' && <AttachmentManager />}
        {activeTab === 'bigquery' && <BigQueryInterface />}
        {activeTab === 'notebook' && <ProjectsList />}
        {activeTab === 'kernels' && <KernelManagement />}
        {activeTab === 'ai-analyst' && <AIAnalyst />}
        {activeTab === 'ai-chat-ui' && <AIChatUI />}
        {activeTab === 'knowledge-base' && <OutlineKnowledgeBase />}
        {activeTab === 'marketplace' && (
          <MarketplaceHome 
            spaceId={selectedSpace || undefined}
            showSpaceSelector={true}
          />
        )}
        {activeTab === 'infrastructure' && (
          <InfrastructureOverview 
            spaceId={selectedSpace || undefined}
            showSpaceSelector={true}
          />
        )}
        {activeTab === 'integrations' && <IntegrationHub />}
        {activeTab === 'settings' && <SystemSettings />}
        {activeTab === 'space-layouts' && <SpaceLayoutsAdmin />}
        {activeTab === 'page-templates' && <PageTemplatesAdmin />}
        {activeTab === 'projects' && <ProjectsManagement />}
        {activeTab === 'data-governance' && <DataGovernance />}
      </div>
    </PlatformLayout>
  )
}
