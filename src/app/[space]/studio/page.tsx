'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Layout, 
  ArrowRight, 
  Database, 
  FileText,
  Sparkles,
  RefreshCw,
  Settings
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { useSpacesEditor } from '@/hooks/use-space-studio'
import { useTemplateInitialization } from '@/hooks/use-template-initialization'
import { TemplateManagement } from '@/components/studio/template-management'
import { PagesManagement } from '@/components/studio/pages-management'
import { Template } from '@/lib/template-generator'
import type { SpacesEditorPage } from '@/lib/space-studio-manager'

export default function SpacesEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { currentSpace } = useSpace()
  const [activeTab, setActiveTab] = useState('templates')

  // Initialize templates on first load
  const { 
    isInitializing: isInitializingTemplates,
    isInitialized: templatesInitialized,
    error: initializationError,
    initializeTemplates 
  } = useTemplateInitialization()

  // Spaces Editor management
  const {
    config,
    loading: configLoading,
    error: configError,
    pages,
    templates,
    templatesLoading,
    templatesError,
    createPage,
    updatePage,
    deletePage,
    assignTemplateToPage,
    createPageFromTemplate,
    refreshConfig,
    clearError
  } = useSpacesEditor(currentSpace?.id || '')

  // Auto-initialize templates on first load
  useEffect(() => {
    if (!templatesInitialized && !isInitializingTemplates) {
      initializeTemplates()
    }
  }, [templatesInitialized, isInitializingTemplates, initializeTemplates])

  const handleTemplateSelect = (template: Template) => {
    router.push(`/${params.space}/studio/template/${template.id}`)
  }

  const handleEditTemplate = (template: Template) => {
    router.push(`/${params.space}/studio/template/${template.id}/edit`)
  }

  const handleDeleteTemplate = (template: Template) => {
    // Template deleted, refresh the list
    refreshConfig()
  }

  const handleEditPage = (page: SpacesEditorPage) => {
    router.push(`/${params.space}/studio/page/${page.id}`)
  }

  const handleViewPage = (page: SpacesEditorPage) => {
    router.push(`/${params.space}/studio/template/${page.templateId || 'new'}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Spaces Editor</h1>
            <p className="text-muted-foreground">
              Template and page management for your {currentSpace?.name} workspace
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>

        {/* Initialization Status */}
        {isInitializingTemplates && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Initializing Templates</h4>
                  <p className="text-sm text-blue-700">
                    Setting up prebuilt templates for common data models...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {initializationError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                <div>
                  <h4 className="font-medium text-red-900">Initialization Failed</h4>
                  <p className="text-sm text-red-700">{initializationError}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={initializeTemplates}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content with Tabs */}
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <TemplateManagement
              spaceId={currentSpace?.id || ''}
              onSelectTemplate={handleTemplateSelect}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <PagesManagement
              spaceId={currentSpace?.id || ''}
              pages={pages}
              templates={templates}
              onCreatePage={createPage}
              onUpdatePage={updatePage}
              onDeletePage={deletePage}
              onAssignTemplate={assignTemplateToPage}
              onEditPage={handleEditPage}
              onViewPage={handleViewPage}
            />
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}