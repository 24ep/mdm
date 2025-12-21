'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Plus, Copy, Upload, Globe, Lock, Search, Download, User } from 'lucide-react'
import { showError } from '@/lib/toast-utils'
import { UploadTemplateDialog } from './UploadTemplateDialog'

interface ReportTemplate {
  id: string
  name: string
  description?: string
  source: string
  category_id?: string
  folder_id?: string
  metadata?: Record<string, any>
  is_public: boolean
  visibility?: 'private' | 'public'
  usage_count: number
  downloads?: number
  author_name?: string
  preview_image?: string
  tags?: string[]
  created_by?: string
}

interface ReportTemplatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: ReportTemplate) => void
}

export function ReportTemplatesDialog({ open, onOpenChange, onSelectTemplate }: ReportTemplatesDialogProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [marketplaceTemplates, setMarketplaceTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open])

  const loadTemplates = async () => {
    try {
      setLoading(true)

      // Load from both local and marketplace APIs
      const [localRes, marketplaceRes] = await Promise.all([
        fetch('/api/reports/templates'),
        fetch('/api/marketplace/templates')
      ])

      if (localRes.ok) {
        const data = await localRes.json()
        setTemplates(data.templates || [])
      }

      if (marketplaceRes.ok) {
        const data = await marketplaceRes.json()
        setMarketplaceTemplates(data.templates || [])
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = (items: ReportTemplate[]) => {
    if (!searchTerm.trim()) return items
    const query = searchTerm.toLowerCase()
    return items.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.tags?.some(t => t.toLowerCase().includes(query))
    )
  }

  const filteredMyTemplates = filterTemplates(templates)
  const filteredMarketplace = filterTemplates(marketplaceTemplates)

  const TemplateCard = ({ template, showAuthor = false }: { template: ReportTemplate; showAuthor?: boolean }) => (
    <Card
      className="cursor-pointer hover:border-primary transition-colors group"
      onClick={() => {
        onSelectTemplate(template)
        onOpenChange(false)
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
            {template.name}
          </CardTitle>
          <div className="flex items-center gap-1 flex-shrink-0">
            {template.visibility === 'public' || template.is_public ? (
              <Globe className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <Badge variant="outline" className="text-xs">{template.source}</Badge>
          </div>
        </div>
        {template.description && (
          <CardDescription className="line-clamp-2 text-xs">
            {template.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Copy className="h-3 w-3" />
              {template.usage_count}
            </span>
            {template.downloads !== undefined && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {template.downloads}
              </span>
            )}
          </div>
          {showAuthor && template.author_name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {template.author_name}
            </span>
          )}
        </div>
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Report Templates</DialogTitle>
                <DialogDescription>
                  Select a template to create a new report or upload your own
                </DialogDescription>
              </div>
              <Button onClick={() => setShowUploadDialog(true)} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Template
              </Button>
            </div>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="marketplace" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="marketplace" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Marketplace
                {filteredMarketplace.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{filteredMarketplace.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="my-templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Templates
                {filteredMyTemplates.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{filteredMyTemplates.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marketplace" className="flex-1 mt-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading marketplace templates...</p>
                </div>
              ) : filteredMarketplace.length === 0 ? (
                <EmptyState message="No marketplace templates found" />
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMarketplace.map((template) => (
                      <TemplateCard key={template.id} template={template} showAuthor />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="my-templates" className="flex-1 mt-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading your templates...</p>
                </div>
              ) : filteredMyTemplates.length === 0 ? (
                <EmptyState message="You haven't created any templates yet" />
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMyTemplates.map((template) => (
                      <TemplateCard key={template.id} template={template} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UploadTemplateDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={loadTemplates}
      />
    </>
  )
}
