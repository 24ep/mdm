'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Bot
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { BigQueryInterface } from './components/BigQueryInterface'
// import { DeepNoteLayoutRefactored as DeepNoteLayout } from '@/components/datascience'
import { AttachmentManager } from './components/AttachmentManager'
import { UserManagement } from './components/UserManagement'
import { SystemSettings } from './components/SystemSettings'
import { PageTemplatesAdmin } from './components/PageTemplatesAdmin'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { AuditLogs } from './components/AuditLogs'
import { BackupRecovery } from './components/BackupRecovery'
import { APIManagement } from './components/APIManagement'
import { NotificationCenter } from './components/NotificationCenter'
import { ThemeBranding } from './components/ThemeBranding'
import { SecurityFeatures } from './components/SecurityFeatures'
import { PerformanceMonitoring } from './components/PerformanceMonitoring'
import { DataExportImport } from './components/DataExportImport'
import { IntegrationHub } from './components/IntegrationHub'
import { SystemHealthDashboard } from './components/SystemHealthDashboard'
import { LogManagement } from './components/LogManagement'
import { DatabaseManagement } from './components/DatabaseManagement'
import { CacheManagement } from './components/CacheManagement'
import { FileSystemManagement } from './components/FileSystemManagement'
import { BusinessIntelligence } from './components/BusinessIntelligence'
import { SpaceManagement } from './components/SpaceManagement'
import { AIAnalyst } from './components/AIAnalyst'
import { KernelManagement } from './components/KernelManagement'

export default function AdminConsolePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Add error boundary for client-side errors
    const handleError = (event: ErrorEvent) => {
      console.error('Admin page error:', event.error)
      setError(event.error?.message || 'An error occurred')
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  const handleBackToSpaces = () => {
    router.push('/spaces')
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error loading admin console</CardTitle>
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
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      selectedSpace={selectedSpace}
      onSpaceChange={setSelectedSpace}
    >
      <div>
        {/* Overview Cards */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('bigquery')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">BigQuery Interface</CardTitle>
                  <CardDescription>Query data across all spaces</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Google BigQuery-like interface for cross-space data analysis
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

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('settings')}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/20">
                  <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
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
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="text-center py-12 px-6">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Admin Console Overview</h3>
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
        {activeTab === 'data' && <DataExportImport />}
        {activeTab === 'health' && <SystemHealthDashboard />}
        {activeTab === 'logs' && <LogManagement />}
        {activeTab === 'database' && <DatabaseManagement />}
        {activeTab === 'cache' && <CacheManagement />}
        {activeTab === 'filesystem' && <FileSystemManagement />}
        {activeTab === 'bi' && <BusinessIntelligence />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'spaces' && <SpaceManagement />}
        {activeTab === 'attachments' && <AttachmentManager />}
        {activeTab === 'bigquery' && <BigQueryInterface />}
        {activeTab === 'notebook' && (
          <div className="h-screen p-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Data Science Notebook</h2>
              <p className="text-gray-600">Notebook component temporarily disabled for debugging.</p>
            </div>
          </div>
        )}
        {activeTab === 'kernels' && <KernelManagement />}
        {activeTab === 'ai-analyst' && <AIAnalyst />}
        {activeTab === 'integrations' && <IntegrationHub />}
        {activeTab === 'settings' && <SystemSettings />}
        {activeTab === 'page-templates' && <PageTemplatesAdmin />}
      </div>
    </AdminLayout>
  )
}
