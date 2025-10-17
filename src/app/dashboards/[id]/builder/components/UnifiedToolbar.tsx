import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Save, 
  Eye, 
  Database, 
  Filter, 
  Share2, 
  Grid3X3, 
  Move, 
  Minus, 
  Plus, 
  RotateCcw, 
  Undo, 
  Redo,
  Wrench,
  Palette,
  Type,
  Square,
  Circle,
  Triangle,
  Image,
  Video,
  FileText,
  MousePointer,
  Crop,
  Layers,
  Settings,
  Download,
  Upload,
  Copy,
  Trash2,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Code,
  Table,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Activity,
  Zap,
  Star,
  Heart,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Clock,
  Map,
  Globe,
  Mail,
  Phone,
  User,
  Users,
  Building,
  Home,
  Search,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Maximize,
  Minimize,
  X,
  Check,
  Plus as PlusIcon,
  Minus as MinusIcon,
  MoreHorizontal,
  MoreVertical,
  Edit,
  Clipboard
} from 'lucide-react'

interface UnifiedToolbarProps {
  dashboard: any
  gridSize: number
  setGridSize: (size: number) => void
  snapToGrid: boolean
  setSnapToGrid: (snap: boolean) => void
  showPixelMode: boolean
  setShowPixelMode: (show: boolean) => void
  zoom: number
  setZoom: (zoom: number) => void
  saving: boolean
  activeFilters: Record<string, any>
  canUndo: boolean
  canRedo: boolean
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  onClearFilters: () => void
  showGrid: boolean
  setShowGrid: (v: boolean) => void
  onShowTools: () => void
  onPreview: () => void
  onRenameDashboard: (name: string) => void
  selectedElement?: any
  onUpdateElement?: (elementId: string, updates: any) => void
}

export function UnifiedToolbar({
  dashboard,
  gridSize,
  setGridSize,
  snapToGrid,
  setSnapToGrid,
  showPixelMode,
  setShowPixelMode,
  zoom,
  setZoom,
  saving,
  activeFilters,
  canUndo,
  canRedo,
  onSave,
  onUndo,
  onRedo,
  onClearFilters,
  showGrid,
  setShowGrid,
  onShowTools,
  onPreview,
  onRenameDashboard,
  selectedElement,
  onUpdateElement
}: UnifiedToolbarProps) {
  const [nameDraft, setNameDraft] = React.useState(dashboard?.name || '')
  const [isEditingName, setIsEditingName] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('main')
  const nameInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    setNameDraft(dashboard?.name || '')
  }, [dashboard?.name])

  React.useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  // Tool categories
  const toolCategories = {
    main: {
      name: 'Main',
      icon: <MousePointer className="h-4 w-4" />,
      tools: [
        { id: 'save', icon: <Save className="h-4 w-4" />, label: 'Save', action: onSave, disabled: saving },
        { id: 'preview', icon: <Eye className="h-4 w-4" />, label: 'Preview', action: onPreview },
        { id: 'settings', icon: <Wrench className="h-4 w-4" />, label: 'Settings', action: onShowTools }
      ]
    },
    edit: {
      name: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      tools: [
        { id: 'undo', icon: <Undo className="h-4 w-4" />, label: 'Undo', action: onUndo, disabled: !canUndo },
        { id: 'redo', icon: <Redo className="h-4 w-4" />, label: 'Redo', action: onRedo, disabled: !canRedo },
        { id: 'copy', icon: <Copy className="h-4 w-4" />, label: 'Copy', action: () => {} },
        { id: 'paste', icon: <Clipboard className="h-4 w-4" />, label: 'Paste', action: () => {} },
        { id: 'delete', icon: <Trash2 className="h-4 w-4" />, label: 'Delete', action: () => {} }
      ]
    },
    view: {
      name: 'View',
      icon: <Eye className="h-4 w-4" />,
      tools: [
        { id: 'zoom-in', icon: <Plus className="h-4 w-4" />, label: 'Zoom In', action: () => setZoom(Math.min(200, zoom + 25)) },
        { id: 'zoom-out', icon: <Minus className="h-4 w-4" />, label: 'Zoom Out', action: () => setZoom(Math.max(25, zoom - 25)) },
        { id: 'zoom-reset', icon: <RotateCcw className="h-4 w-4" />, label: 'Reset Zoom', action: () => setZoom(100) },
        { id: 'grid', icon: <Grid3X3 className="h-4 w-4" />, label: showGrid ? 'Hide Grid' : 'Show Grid', action: () => setShowGrid(!showGrid) },
        { id: 'pixel-mode', icon: <Move className="h-4 w-4" />, label: 'Pixel Mode', action: () => setShowPixelMode(!showPixelMode), active: showPixelMode }
      ]
    },
    style: {
      name: 'Style',
      icon: <Palette className="h-4 w-4" />,
      tools: [
        { id: 'fill', icon: <Square className="h-4 w-4" />, label: 'Fill', action: () => {} },
        { id: 'stroke', icon: <Circle className="h-4 w-4" />, label: 'Stroke', action: () => {} },
        { id: 'shadow', icon: <Layers className="h-4 w-4" />, label: 'Shadow', action: () => {} },
        { id: 'blur', icon: <Zap className="h-4 w-4" />, label: 'Blur', action: () => {} },
        { id: 'opacity', icon: <Eye className="h-4 w-4" />, label: 'Opacity', action: () => {} }
      ]
    },
    layout: {
      name: 'Layout',
      icon: <Layers className="h-4 w-4" />,
      tools: [
        { id: 'align-left', icon: <AlignLeft className="h-4 w-4" />, label: 'Align Left', action: () => {} },
        { id: 'align-center', icon: <AlignCenter className="h-4 w-4" />, label: 'Align Center', action: () => {} },
        { id: 'align-right', icon: <AlignRight className="h-4 w-4" />, label: 'Align Right', action: () => {} },
        { id: 'align-justify', icon: <AlignJustify className="h-4 w-4" />, label: 'Justify', action: () => {} },
        { id: 'distribute', icon: <MoreHorizontal className="h-4 w-4" />, label: 'Distribute', action: () => {} }
      ]
    },
    transform: {
      name: 'Transform',
      icon: <RotateCw className="h-4 w-4" />,
      tools: [
        { id: 'rotate-left', icon: <RotateCcw className="h-4 w-4" />, label: 'Rotate Left', action: () => {} },
        { id: 'rotate-right', icon: <RotateCw className="h-4 w-4" />, label: 'Rotate Right', action: () => {} },
        { id: 'flip-horizontal', icon: <FlipHorizontal className="h-4 w-4" />, label: 'Flip H', action: () => {} },
        { id: 'flip-vertical', icon: <FlipVertical className="h-4 w-4" />, label: 'Flip V', action: () => {} },
        { id: 'crop', icon: <Crop className="h-4 w-4" />, label: 'Crop', action: () => {} }
      ]
    },
    data: {
      name: 'Data',
      icon: <Database className="h-4 w-4" />,
      tools: [
        { id: 'data-source', icon: <Database className="h-4 w-4" />, label: 'Data Source', action: () => {} },
        { id: 'filter', icon: <Filter className="h-4 w-4" />, label: 'Filter', action: () => {} },
        { id: 'sort', icon: <SortAsc className="h-4 w-4" />, label: 'Sort', action: () => {} },
        { id: 'refresh', icon: <RotateCcw className="h-4 w-4" />, label: 'Refresh', action: () => {} },
        { id: 'export', icon: <Download className="h-4 w-4" />, label: 'Export', action: () => {} }
      ]
    },
    charts: {
      name: 'Charts',
      icon: <BarChart3 className="h-4 w-4" />,
      tools: [
        { id: 'bar-chart', icon: <BarChart3 className="h-4 w-4" />, label: 'Bar Chart', action: () => {} },
        { id: 'line-chart', icon: <LineChart className="h-4 w-4" />, label: 'Line Chart', action: () => {} },
        { id: 'pie-chart', icon: <PieChart className="h-4 w-4" />, label: 'Pie Chart', action: () => {} },
        { id: 'area-chart', icon: <TrendingUp className="h-4 w-4" />, label: 'Area Chart', action: () => {} },
        { id: 'table', icon: <Table className="h-4 w-4" />, label: 'Table', action: () => {} }
      ]
    },
    elements: {
      name: 'Elements',
      icon: <Square className="h-4 w-4" />,
      tools: [
        { id: 'rectangle', icon: <Square className="h-4 w-4" />, label: 'Rectangle', action: () => {} },
        { id: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Circle', action: () => {} },
        { id: 'triangle', icon: <Triangle className="h-4 w-4" />, label: 'Triangle', action: () => {} },
        { id: 'text', icon: <Type className="h-4 w-4" />, label: 'Text', action: () => {} },
        { id: 'image', icon: <Image className="h-4 w-4" />, label: 'Image', action: () => {} },
        { id: 'video', icon: <Video className="h-4 w-4" />, label: 'Video', action: () => {} },
        { id: 'icon', icon: <Star className="h-4 w-4" />, label: 'Icon', action: () => {} },
        { id: 'button', icon: <MousePointer className="h-4 w-4" />, label: 'Button', action: () => {} }
      ]
    },
    advanced: {
      name: 'Advanced',
      icon: <Settings className="h-4 w-4" />,
      tools: [
        { id: 'layers', icon: <Layers className="h-4 w-4" />, label: 'Layers', action: () => {} },
        { id: 'group', icon: <Square className="h-4 w-4" />, label: 'Group', action: () => {} },
        { id: 'ungroup', icon: <Square className="h-4 w-4" />, label: 'Ungroup', action: () => {} },
        { id: 'lock', icon: <Lock className="h-4 w-4" />, label: 'Lock', action: () => {} },
        { id: 'unlock', icon: <Unlock className="h-4 w-4" />, label: 'Unlock', action: () => {} },
        { id: 'duplicate', icon: <Copy className="h-4 w-4" />, label: 'Duplicate', action: () => {} },
        { id: 'bring-forward', icon: <ArrowUp className="h-4 w-4" />, label: 'Bring Forward', action: () => {} },
        { id: 'send-backward', icon: <ArrowDown className="h-4 w-4" />, label: 'Send Backward', action: () => {} }
      ]
    }
  }

  const renderToolButton = (tool: any) => (
    <Button
      key={tool.id}
      variant={tool.active ? "default" : "outline"}
      size="sm"
      onClick={tool.action}
      disabled={tool.disabled}
      title={tool.label}
      className="h-8 w-8 p-0"
    >
      {tool.icon}
    </Button>
  )

  const renderToolCategory = (categoryKey: string, category: any) => (
    <div key={categoryKey} className="flex items-center space-x-1">
      <div className="flex items-center space-x-1 px-2 py-1 bg-muted/20 rounded-md">
        {category.icon}
        <span className="text-xs font-medium">{category.name}</span>
      </div>
      <div className="flex items-center space-x-1">
        {category.tools.map(renderToolButton)}
      </div>
    </div>
  )

  return (
    <div className="h-20 border-b bg-background">
      {/* Top Row - Dashboard Name and Main Controls */}
      <div className="h-10 flex items-center justify-between px-4 border-b">
        <div className="flex items-center space-x-4">
          {isEditingName ? (
            <Input
              ref={nameInputRef}
              className="w-64 h-8 border-0 bg-transparent focus-visible:ring-0 shadow-none"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => {
                onRenameDashboard(nameDraft.trim() || 'Untitled Dashboard')
                setIsEditingName(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                } else if (e.key === 'Escape') {
                  setNameDraft(dashboard?.name || '')
                  setIsEditingName(false)
                }
              }}
              placeholder="Dashboard name"
            />
          ) : (
            <button
              className="text-left w-64 h-8 px-2 rounded bg-transparent hover:bg-muted/20 transition-colors border-0"
              onClick={() => setIsEditingName(true)}
              title="Click to rename"
            >
              <span className="block truncate font-medium">{dashboard?.name || 'Untitled Dashboard'}</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{zoom}%</span>
          <Button onClick={onSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Bottom Row - Tool Categories */}
      <div className="h-10 flex items-center space-x-4 px-4 overflow-x-auto">
        {Object.entries(toolCategories).map(([key, category]) => 
          renderToolCategory(key, category)
        )}
      </div>
    </div>
  )
}

