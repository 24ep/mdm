'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  BarChart3, 
  Table, 
  FileText, 
  Calendar, 
  Map, 
  Image, 
  Users,
  Database,
  Filter,
  PieChart,
  TrendingUp,
  Activity,
  Globe,
  Mail,
  Phone,
  Star,
  Heart,
  MessageSquare,
  Bell,
  Settings,
  User,
  Building,
  Briefcase,
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  Home,
  Folder,
  File,
  Download,
  Upload,
  Link,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Check,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Move,
  RotateCcw,
  Save,
  Share,
  MoreHorizontal,
  Play
} from 'lucide-react'

interface Component {
  id: string
  name: string
  description: string
  category: string
  icon: any
  type: string
  defaultSize: { width: number; height: number }
  isPremium?: boolean
}

const components: Component[] = [
  // Data Visualization
  {
    id: 'chart-line',
    name: 'Line Chart',
    description: 'Display data trends over time',
    category: 'Charts',
    icon: TrendingUp,
    type: 'chart',
    defaultSize: { width: 400, height: 300 }
  },
  {
    id: 'chart-bar',
    name: 'Bar Chart',
    description: 'Compare data across categories',
    category: 'Charts',
    icon: BarChart3,
    type: 'chart',
    defaultSize: { width: 400, height: 300 }
  },
  {
    id: 'chart-pie',
    name: 'Pie Chart',
    description: 'Show data distribution',
    category: 'Charts',
    icon: PieChart,
    type: 'chart',
    defaultSize: { width: 300, height: 300 }
  },
  {
    id: 'chart-area',
    name: 'Area Chart',
    description: 'Display cumulative data over time',
    category: 'Charts',
    icon: Activity,
    type: 'chart',
    defaultSize: { width: 400, height: 300 }
  },

  // Data Display
  {
    id: 'table',
    name: 'Data Table',
    description: 'Display tabular data with sorting and filtering',
    category: 'Data',
    icon: Table,
    type: 'table',
    defaultSize: { width: 600, height: 400 }
  },
  {
    id: 'metric-card',
    name: 'Metric Card',
    description: 'Display key performance indicators',
    category: 'Data',
    icon: BarChart3,
    type: 'metric',
    defaultSize: { width: 200, height: 120 }
  },
  {
    id: 'data-grid',
    name: 'Data Grid',
    description: 'Advanced table with pagination and search',
    category: 'Data',
    icon: Database,
    type: 'grid',
    defaultSize: { width: 600, height: 400 },
    isPremium: true
  },

  // Forms & Inputs
  {
    id: 'form',
    name: 'Form',
    description: 'Collect user input with validation',
    category: 'Forms',
    icon: FileText,
    type: 'form',
    defaultSize: { width: 400, height: 300 }
  },
  {
    id: 'filter-panel',
    name: 'Filter Panel',
    description: 'Filter data with multiple criteria',
    category: 'Forms',
    icon: Filter,
    type: 'filter',
    defaultSize: { width: 300, height: 200 }
  },
  {
    id: 'search-box',
    name: 'Search Box',
    description: 'Search functionality with suggestions',
    category: 'Forms',
    icon: Search,
    type: 'search',
    defaultSize: { width: 300, height: 40 }
  },

  // Layout & Navigation
  {
    id: 'card',
    name: 'Card',
    description: 'Container for related content',
    category: 'Layout',
    icon: FileText,
    type: 'card',
    defaultSize: { width: 300, height: 200 }
  },
  {
    id: 'accordion',
    name: 'Accordion',
    description: 'Collapsible content sections',
    category: 'Layout',
    icon: FileText,
    type: 'accordion',
    defaultSize: { width: 400, height: 200 }
  },
  {
    id: 'tabs',
    name: 'Tabs',
    description: 'Organize content in tabs',
    category: 'Layout',
    icon: FileText,
    type: 'tabs',
    defaultSize: { width: 400, height: 300 }
  },

  // Media & Content
  {
    id: 'image',
    name: 'Image',
    description: 'Display images with captions',
    category: 'Media',
    icon: Image,
    type: 'image',
    defaultSize: { width: 300, height: 200 }
  },
  {
    id: 'video',
    name: 'Video Player',
    description: 'Embed and play videos',
    category: 'Media',
    icon: Play,
    type: 'video',
    defaultSize: { width: 400, height: 225 }
  },
  {
    id: 'text-block',
    name: 'Text Block',
    description: 'Rich text content with formatting',
    category: 'Media',
    icon: FileText,
    type: 'text',
    defaultSize: { width: 400, height: 150 }
  },

  // Maps & Location
  {
    id: 'map',
    name: 'Map',
    description: 'Interactive maps with markers',
    category: 'Maps',
    icon: Map,
    type: 'map',
    defaultSize: { width: 500, height: 400 }
  },
  {
    id: 'location-picker',
    name: 'Location Picker',
    description: 'Select locations on a map',
    category: 'Maps',
    icon: Map,
    type: 'location',
    defaultSize: { width: 400, height: 300 }
  },

  // Calendar & Time
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Display events and schedules',
    category: 'Calendar',
    icon: Calendar,
    type: 'calendar',
    defaultSize: { width: 400, height: 300 }
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Show chronological events',
    category: 'Calendar',
    icon: Activity,
    type: 'timeline',
    defaultSize: { width: 500, height: 200 }
  },

  // Social & Communication
  {
    id: 'user-profile',
    name: 'User Profile',
    description: 'Display user information',
    category: 'Social',
    icon: User,
    type: 'profile',
    defaultSize: { width: 300, height: 200 }
  },
  {
    id: 'comments',
    name: 'Comments',
    description: 'User comments and discussions',
    category: 'Social',
    icon: MessageSquare,
    type: 'comments',
    defaultSize: { width: 400, height: 300 }
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Display system notifications',
    category: 'Social',
    icon: Bell,
    type: 'notifications',
    defaultSize: { width: 300, height: 200 }
  },

  // Business
  {
    id: 'company-card',
    name: 'Company Card',
    description: 'Display company information',
    category: 'Business',
    icon: Building,
    type: 'company',
    defaultSize: { width: 300, height: 200 }
  },
  {
    id: 'product-card',
    name: 'Product Card',
    description: 'Show product details',
    category: 'Business',
    icon: Package,
    type: 'product',
    defaultSize: { width: 250, height: 300 }
  },
  {
    id: 'order-summary',
    name: 'Order Summary',
    description: 'Display order information',
    category: 'Business',
    icon: ShoppingCart,
    type: 'order',
    defaultSize: { width: 400, height: 200 }
  }
]

const categories = [
  'All',
  'Charts',
  'Data',
  'Forms',
  'Layout',
  'Media',
  'Maps',
  'Calendar',
  'Social',
  'Business'
]

export function ComponentLibrary() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(search.toLowerCase()) ||
                         component.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || component.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDragStart = (e: React.DragEvent, component: Component) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'component',
      component: {
        id: `component-${Date.now()}`,
        type: component.type,
        x: 0,
        y: 0,
        width: component.defaultSize.width,
        height: component.defaultSize.height,
        config: {},
        style: {}
      }
    }))
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search components..."
          className="pl-9"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1">
        {categories.map(category => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Components Grid */}
      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-auto">
        {filteredComponents.map(component => {
          const IconComponent = component.icon
          return (
            <Card
              key={component.id}
              className="cursor-grab hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => handleDragStart(e, component)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">
                        {component.name}
                      </h4>
                      {component.isPremium && (
                        <Badge variant="secondary" className="text-xs">
                          Pro
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {component.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {component.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {component.defaultSize.width}×{component.defaultSize.height}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredComponents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No components found</p>
        </div>
      )}
    </div>
  )
}
