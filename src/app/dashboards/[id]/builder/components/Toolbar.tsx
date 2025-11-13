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
  Wrench
} from 'lucide-react'

interface ToolbarProps {
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
  showGrid?: boolean
  setShowGrid?: (v: boolean) => void
  onShowTools?: () => void
  onPreview: () => void
  onRenameDashboard?: (name: string) => void
  onShowDataSourcePanel?: () => void
  onShowShareDialog?: () => void
  onShowTemplates?: () => void
  onShowVersioning?: () => void
  onShowAdvancedStyling?: () => void
  onShowDataPreview?: () => void
  onShowSettings?: () => void
}

export function Toolbar({
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
  onShowDataSourcePanel,
  onShowShareDialog,
  onShowTemplates,
  onShowVersioning,
  onShowAdvancedStyling,
  onShowDataPreview,
  onShowSettings
}: ToolbarProps) {
  const [nameDraft, setNameDraft] = React.useState(dashboard?.name || '')
  const [isEditingName, setIsEditingName] = React.useState(false)
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
  return (
    <div className="h-16 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        {isEditingName ? (
          <Input
            ref={nameInputRef}
            className="w-64 h-8 border-0 bg-transparent focus-visible:ring-0 shadow-none"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              onRenameDashboard?.(nameDraft.trim() || 'Untitled Dashboard')
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
        {/* Builder Mode badge removed */}
      </div>
      <div className="flex items-center space-x-2">
        {/* Grid Toggle */}
        <Button variant="outline" size="sm" onClick={() => setShowGrid?.(!showGrid)}>
          <Grid3X3 className="h-4 w-4 mr-2" />
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </Button>
        {/* Grid Controls */}
        <div className="flex items-center space-x-2 border-r pr-4">
          <Label htmlFor="grid-size" className="text-sm font-medium">Grid:</Label>
          <Select value={gridSize.toString()} onValueChange={(value) => setGridSize(parseInt(value))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6×6</SelectItem>
              <SelectItem value="12">12×12</SelectItem>
              <SelectItem value="16">16×16</SelectItem>
              <SelectItem value="20">20×20</SelectItem>
              <SelectItem value="24">24×24</SelectItem>
              <SelectItem value="32">32×32</SelectItem>
              <SelectItem value="48">48×48</SelectItem>
              <SelectItem value="64">64×64</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showPixelMode ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPixelMode(!showPixelMode)}
            title="Show Pixel Measurements"
          >
            <Move className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2 border-r pr-4">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(100)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo}>
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={() => onShowTools?.()}>
          <Wrench className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
