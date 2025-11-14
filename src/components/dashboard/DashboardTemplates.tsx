'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Users, 
  DollarSign,
  ShoppingCart,
  Building,
  FileText,
  Zap,
  Eye,
  Download
} from 'lucide-react'

interface DashboardTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: React.ReactNode
  elements: any[]
  thumbnail: string
  tags: string[]
}

const TEMPLATES: DashboardTemplate[] = [
  {
    id: 'sales-overview',
    name: 'Sales Overview',
    description: 'Complete sales dashboard with revenue, orders, and customer metrics',
    category: 'Sales',
    icon: <DollarSign className="h-6 w-6" />,
    elements: [
      { type: 'KPI', name: 'Total Revenue', position: { x: 0, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Total Orders', position: { x: 3, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Average Order Value', position: { x: 6, y: 0, width: 3, height: 2 } },
      { type: 'CHART', chartType: 'LINE', name: 'Revenue Trend', position: { x: 0, y: 2, width: 6, height: 4 } },
      { type: 'CHART', chartType: 'PIE', name: 'Sales by Category', position: { x: 6, y: 2, width: 3, height: 4 } },
      { type: 'CHART', chartType: 'BAR', name: 'Top Products', position: { x: 0, y: 6, width: 9, height: 4 } }
    ],
    thumbnail: '/templates/sales-overview.png',
    tags: ['sales', 'revenue', 'orders', 'analytics']
  },
  {
    id: 'marketing-analytics',
    name: 'Marketing Analytics',
    description: 'Marketing performance dashboard with campaigns, leads, and conversions',
    category: 'Marketing',
    icon: <TrendingUp className="h-6 w-6" />,
    elements: [
      { type: 'KPI', name: 'Total Leads', position: { x: 0, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Conversion Rate', position: { x: 3, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Cost per Lead', position: { x: 6, y: 0, width: 3, height: 2 } },
      { type: 'CHART', chartType: 'AREA', name: 'Lead Generation Trend', position: { x: 0, y: 2, width: 6, height: 4 } },
      { type: 'CHART', chartType: 'BAR', name: 'Campaign Performance', position: { x: 6, y: 2, width: 3, height: 4 } },
      { type: 'CHART', chartType: 'SCATTER', name: 'Lead Quality vs Cost', position: { x: 0, y: 6, width: 9, height: 4 } }
    ],
    thumbnail: '/templates/marketing-analytics.png',
    tags: ['marketing', 'leads', 'campaigns', 'conversion']
  },
  {
    id: 'financial-dashboard',
    name: 'Financial Dashboard',
    description: 'Financial metrics including P&L, cash flow, and budget tracking',
    category: 'Finance',
    icon: <BarChart3 className="h-6 w-6" />,
    elements: [
      { type: 'KPI', name: 'Revenue', position: { x: 0, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Expenses', position: { x: 3, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Profit Margin', position: { x: 6, y: 0, width: 3, height: 2 } },
      { type: 'CHART', chartType: 'LINE', name: 'P&L Trend', position: { x: 0, y: 2, width: 6, height: 4 } },
      { type: 'CHART', chartType: 'PIE', name: 'Expense Breakdown', position: { x: 6, y: 2, width: 3, height: 4 } },
      { type: 'CHART', chartType: 'BAR', name: 'Budget vs Actual', position: { x: 0, y: 6, width: 9, height: 4 } }
    ],
    thumbnail: '/templates/financial-dashboard.png',
    tags: ['finance', 'profit', 'expenses', 'budget']
  },
  {
    id: 'customer-analytics',
    name: 'Customer Analytics',
    description: 'Customer insights including demographics, behavior, and satisfaction',
    category: 'Customer',
    icon: <Users className="h-6 w-6" />,
    elements: [
      { type: 'KPI', name: 'Total Customers', position: { x: 0, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Customer Satisfaction', position: { x: 3, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Churn Rate', position: { x: 6, y: 0, width: 3, height: 2 } },
      { type: 'CHART', chartType: 'RADAR', name: 'Customer Segments', position: { x: 0, y: 2, width: 6, height: 4 } },
      { type: 'CHART', chartType: 'PIE', name: 'Customer Demographics', position: { x: 6, y: 2, width: 3, height: 4 } },
      { type: 'CHART', chartType: 'LINE', name: 'Customer Lifecycle', position: { x: 0, y: 6, width: 9, height: 4 } }
    ],
    thumbnail: '/templates/customer-analytics.png',
    tags: ['customer', 'demographics', 'satisfaction', 'churn']
  },
  {
    id: 'ecommerce-dashboard',
    name: 'E-commerce Dashboard',
    description: 'E-commerce metrics including sales, inventory, and customer behavior',
    category: 'E-commerce',
    icon: <ShoppingCart className="h-6 w-6" />,
    elements: [
      { type: 'KPI', name: 'Total Sales', position: { x: 0, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Orders Today', position: { x: 3, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Inventory Value', position: { x: 6, y: 0, width: 3, height: 2 } },
      { type: 'CHART', chartType: 'LINE', name: 'Sales Trend', position: { x: 0, y: 2, width: 6, height: 4 } },
      { type: 'CHART', chartType: 'PIE', name: 'Product Categories', position: { x: 6, y: 2, width: 3, height: 4 } },
      { type: 'CHART', chartType: 'BAR', name: 'Top Selling Products', position: { x: 0, y: 6, width: 9, height: 4 } }
    ],
    thumbnail: '/templates/ecommerce-dashboard.png',
    tags: ['ecommerce', 'sales', 'inventory', 'products']
  },
  {
    id: 'hr-analytics',
    name: 'HR Analytics',
    description: 'Human resources dashboard with employee metrics and performance',
    category: 'HR',
    icon: <Building className="h-6 w-6" />,
    elements: [
      { type: 'KPI', name: 'Total Employees', position: { x: 0, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Employee Satisfaction', position: { x: 3, y: 0, width: 3, height: 2 } },
      { type: 'KPI', name: 'Turnover Rate', position: { x: 6, y: 0, width: 3, height: 2 } },
      { type: 'CHART', chartType: 'BAR', name: 'Department Performance', position: { x: 0, y: 2, width: 6, height: 4 } },
      { type: 'CHART', chartType: 'PIE', name: 'Employee Distribution', position: { x: 6, y: 2, width: 3, height: 4 } },
      { type: 'CHART', chartType: 'LINE', name: 'Hiring Trends', position: { x: 0, y: 6, width: 9, height: 4 } }
    ],
    thumbnail: '/templates/hr-analytics.png',
    tags: ['hr', 'employees', 'performance', 'satisfaction']
  }
]

interface DashboardTemplatesProps {
  onSelectTemplate: (template: DashboardTemplate) => void
  onCreateBlank: () => void
}

export function DashboardTemplates({ onSelectTemplate, onCreateBlank }: DashboardTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))]

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Choose a Dashboard Template</h2>
        <p className="text-muted-foreground mt-2">
          Start with a pre-built template or create from scratch
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                {template.icon}
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{template.category}</Badge>
                  <div className="flex space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>{template.name}</DialogTitle>
                          <DialogDescription>
                            Preview this dashboard template and its components before applying it to your dashboard.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-muted-foreground">{template.description}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Elements ({template.elements.length})</h4>
                              <div className="space-y-1">
                                {template.elements.map((element, index) => (
                                  <div key={index} className="text-sm text-muted-foreground">
                                    • {element.name} ({element.type})
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Tags</h4>
                              <div className="flex flex-wrap gap-1">
                                {template.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      onClick={() => onSelectTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button variant="outline" onClick={onCreateBlank} className="mt-4">
          <FileText className="h-4 w-4 mr-2" />
          Create Blank Dashboard
        </Button>
      </div>
    </div>
  )
}
