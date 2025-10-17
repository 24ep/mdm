'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  BarChart3, 
  FileText, 
  Sparkles, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { Template } from '@/lib/template-generator'
import { useTemplates } from '@/hooks/use-templates'

interface TemplateManagementProps {
  spaceId: string
  onSelectTemplate?: (template: Template) => void
  onEditTemplate?: (template: Template) => void
  onDeleteTemplate?: (template: Template) => void
}

export function TemplateManagement({ 
  spaceId, 
  onSelectTemplate, 
  onEditTemplate, 
  onDeleteTemplate 
}: TemplateManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  const { 
    templates, 
    loading, 
    error, 
    deleteTemplate, 
    duplicateTemplate 
  } = useTemplates({ autoFetch: true })

  const categories = ['All', 'Entity Management', 'Forms', 'Analytics', 'Dashboard']

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDeleteTemplate = async (template: Template) => {
    if (window.confirm(`Are you sure you want to delete "${template.displayName}"?`)) {
      try {
        await deleteTemplate(template.id)
        onDeleteTemplate?.(template)
      } catch (error) {
        console.error('Failed to delete template:', error)
      }
    }
  }

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      await duplicateTemplate(template.id, `${template.displayName} (Copy)`)
    } catch (error) {
      console.error('Failed to duplicate template:', error)
    }
  }

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'Entity Management':
        return <Table className="h-5 w-5" />
      case 'Analytics':
        return <BarChart3 className="h-5 w-5" />
      case 'Forms':
        return <FileText className="h-5 w-5" />
      default:
        return <Table className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-red-600 mb-4">
            <p className="font-medium">Error loading templates</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates</h2>
          <p className="text-muted-foreground">
            Manage and organize your Space Studio templates
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getTemplateIcon(template.category)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.displayName}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelectTemplate?.(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditTemplate?.(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTemplate(template)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <span>•</span>
                  <span>v{template.version}</span>
                  <span>•</span>
                  <span>{template.pages.length} pages</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Auto-Generated
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Table className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'All' 
                ? 'Try adjusting your search terms or category filter'
                : 'Create your first template to get started'
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
              }}>
                Clear filters
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
