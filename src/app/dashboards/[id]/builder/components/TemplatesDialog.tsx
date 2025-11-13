import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, BarChart3, PieChart, LineChart, Table, TrendingUp, Users, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

interface DashboardTemplate {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  elements: any[]
  tags: string[]
}

interface TemplatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: DashboardTemplate) => void
  onCreateBlank: () => void
}

const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: BarChart3 },
  { id: 'business', name: 'Business', icon: TrendingUp },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'marketing', name: 'Marketing', icon: Users },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart }
]

const MOCK_TEMPLATES: DashboardTemplate[] = [
  {
    id: '1',
    name: 'Executive Dashboard',
    description: 'High-level KPIs and metrics for executives',
    category: 'business',
    thumbnail: '/api/placeholder/400/300',
    elements: [],
    tags: ['executive', 'kpi', 'business']
  },
  {
    id: '2',
    name: 'Sales Analytics',
    description: 'Comprehensive sales performance tracking',
    category: 'analytics',
    thumbnail: '/api/placeholder/400/300',
    elements: [],
    tags: ['sales', 'revenue', 'performance']
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Track marketing campaign effectiveness',
    category: 'marketing',
    thumbnail: '/api/placeholder/400/300',
    elements: [],
    tags: ['marketing', 'campaign', 'roi']
  },
  {
    id: '4',
    name: 'E-commerce Overview',
    description: 'Online store performance and customer insights',
    category: 'ecommerce',
    thumbnail: '/api/placeholder/400/300',
    elements: [],
    tags: ['ecommerce', 'customers', 'orders']
  },
  {
    id: '5',
    name: 'Financial Report',
    description: 'Financial metrics and budget tracking',
    category: 'business',
    thumbnail: '/api/placeholder/400/300',
    elements: [],
    tags: ['finance', 'budget', 'revenue']
  },
  {
    id: '6',
    name: 'User Analytics',
    description: 'User behavior and engagement metrics',
    category: 'analytics',
    thumbnail: '/api/placeholder/400/300',
    elements: [],
    tags: ['users', 'engagement', 'behavior']
  }
]

export function TemplatesDialog({ open, onOpenChange, onSelectTemplate, onCreateBlank }: TemplatesDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredTemplates = MOCK_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleSelectTemplate = (template: DashboardTemplate) => {
    onSelectTemplate(template)
    onOpenChange(false)
    toast.success(`Applied template: ${template.name}`)
  }

  const handleCreateBlank = () => {
    onCreateBlank()
    onOpenChange(false)
    toast.success('Created blank dashboard')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Templates</DialogTitle>
          <DialogDescription>
            Choose from pre-built dashboard templates or create a blank dashboard to get started.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {TEMPLATE_CATEGORIES.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Create Blank Dashboard */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
               onClick={handleCreateBlank}>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-600">+</div>
              <div className="font-medium">Create Blank Dashboard</div>
              <div className="text-sm text-gray-500">Start from scratch with a clean canvas</div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleSelectTemplate(template)}>
                <CardHeader className="p-0">
                  <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <div className="text-sm">Template Preview</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div className="text-lg font-medium">No templates found</div>
                <div className="text-sm">Try adjusting your search or filter criteria</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
