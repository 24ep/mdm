'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Layout, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Settings,
  FileText,
  Database,
  BarChart3,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react'
import { SpaceStudioPage } from '@/lib/space-studio-manager'
import { Template } from '@/lib/template-generator'

interface PagesManagementProps {
  spaceId: string
  pages: SpaceStudioPage[]
  templates: Template[]
  onCreatePage: (pageData: Partial<SpaceStudioPage>) => Promise<SpaceStudioPage>
  onUpdatePage: (pageId: string, updates: Partial<SpaceStudioPage>) => Promise<void>
  onDeletePage: (pageId: string) => Promise<void>
  onAssignTemplate: (pageId: string, templateId: string) => Promise<void>
  onEditPage: (page: SpaceStudioPage) => void
  onViewPage: (page: SpaceStudioPage) => void
}

export function PagesManagement({
  spaceId,
  pages,
  templates,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  onAssignTemplate,
  onEditPage,
  onViewPage
}: PagesManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingPage, setEditingPage] = useState<SpaceStudioPage | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  
  const [newPageForm, setNewPageForm] = useState({
    name: '',
    displayName: '',
    description: '',
    templateId: ''
  })

  const handleCreatePage = async () => {
    try {
      await onCreatePage({
        name: newPageForm.name,
        displayName: newPageForm.displayName,
        description: newPageForm.description,
        templateId: newPageForm.templateId || undefined,
        isCustom: !newPageForm.templateId
      })
      
      setNewPageForm({ name: '', displayName: '', description: '', templateId: '' })
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create page:', error)
    }
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return
    
    try {
      await onCreatePage({
        name: newPageForm.name,
        displayName: newPageForm.displayName,
        description: newPageForm.description,
        templateId: selectedTemplate.id,
        isCustom: false
      })
      
      setNewPageForm({ name: '', displayName: '', description: '', templateId: '' })
      setSelectedTemplate(null)
      setShowTemplateDialog(false)
    } catch (error) {
      console.error('Failed to create page from template:', error)
    }
  }

  const handleDeletePage = async (page: SpaceStudioPage) => {
    if (window.confirm(`Are you sure you want to delete "${page.displayName}"?`)) {
      try {
        await onDeletePage(page.id)
      } catch (error) {
        console.error('Failed to delete page:', error)
      }
    }
  }

  const getPageIcon = (page: SpaceStudioPage) => {
    if (page.templateId) {
      const template = templates.find(t => t.id === page.templateId)
      if (template) {
        switch (template.category) {
          case 'Entity Management':
            return <Database className="h-5 w-5" />
          case 'Analytics':
            return <BarChart3 className="h-5 w-5" />
          case 'Forms':
            return <FileText className="h-5 w-5" />
          default:
            return <Layout className="h-5 w-5" />
        }
      }
    }
    return <Layout className="h-5 w-5" />
  }

  const getPageStatus = (page: SpaceStudioPage) => {
    if (page.templateId) {
      return { label: 'Template', variant: 'default' as const }
    }
    return { label: 'Custom', variant: 'secondary' as const }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pages</h2>
          <p className="text-muted-foreground">
            Manage your space pages and assign templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            From Template
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        {pages.map(page => {
          const status = getPageStatus(page)
          const template = page.templateId ? templates.find(t => t.id === page.templateId) : null
          
          return (
            <Card key={page.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getPageIcon(page)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{page.displayName}</h3>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                        {!page.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {page.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Path: {page.path}</span>
                        {template && (
                          <span>Template: {template.displayName}</span>
                        )}
                        <span>Created: {new Date(page.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewPage(page)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditPage(page)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePage(page)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {pages.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pages created yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first page to get started with Space Studio
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                From Template
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Page Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="page-name">Page Name</Label>
              <Input
                id="page-name"
                value={newPageForm.name}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="my-page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-display-name">Display Name</Label>
              <Input
                id="page-display-name"
                value={newPageForm.displayName}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="My Page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-description">Description</Label>
              <Input
                id="page-description"
                value={newPageForm.description}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A description of this page"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage}>
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create from Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Page from Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-page-name">Page Name</Label>
              <Input
                id="template-page-name"
                value={newPageForm.name}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="my-page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-page-display-name">Display Name</Label>
              <Input
                id="template-page-display-name"
                value={newPageForm.displayName}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="My Page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-page-description">Description</Label>
              <Input
                id="template-page-description"
                value={newPageForm.description}
                onChange={(e) => setNewPageForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A description of this page"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Select Template</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                {templates.map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {template.category === 'Entity Management' && <Database className="h-4 w-4" />}
                          {template.category === 'Analytics' && <BarChart3 className="h-4 w-4" />}
                          {template.category === 'Forms' && <FileText className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{template.displayName}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              v{template.version}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFromTemplate}
              disabled={!selectedTemplate}
            >
              Create from Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
