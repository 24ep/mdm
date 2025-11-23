'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Grid, 
  Move, 
  Trash2, 
  Copy, 
  Settings,
  Maximize2,
  Minimize2,
  MousePointer
} from 'lucide-react'

interface PageComponent {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  config: any
  style: any
}

interface Page {
  id: string
  name: string
  path: string
  components: PageComponent[]
}

interface CanvasBackground {
  type: 'color' | 'image'
  color: string
  image: string
  opacity: number
  blur: number
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size: 'cover' | 'contain' | 'auto' | '100%'
}

interface PageBuilderProps {
  page: Page
  onUpdate: (components: PageComponent[]) => void
  onComponentSelect: (component: PageComponent | null) => void
  onMultiSelect: (componentIds: string[]) => void
  selectedComponent: PageComponent | null
  selectedComponents: string[]
  canvasBackground?: CanvasBackground
}

export function PageBuilder({ 
  page, 
  onUpdate, 
  onComponentSelect, 
  onMultiSelect,
  selectedComponent, 
  selectedComponents,
  canvasBackground 
}: PageBuilderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [gridSize, setGridSize] = useState(20)
  const [showGrid, setShowGrid] = useState(true)
  const [showSizeIndicator, setShowSizeIndicator] = useState(false)
  const [sizeIndicator, setSizeIndicator] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [resizeMode, setResizeMode] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent, component: PageComponent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const offsetX = e.clientX - rect.left - component.x
      const offsetY = e.clientY - rect.top - component.y
      setDragOffset({ x: offsetX, y: offsetY })
    }
    
    setIsDragging(true)
    onComponentSelect(component)
  }, [onComponentSelect])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !selectedComponent) return

    const rect = containerRef.current.getBoundingClientRect()
    const newX = Math.round((e.clientX - rect.left - dragOffset.x) / gridSize) * gridSize
    const newY = Math.round((e.clientY - rect.top - dragOffset.y) / gridSize) * gridSize

    const updatedComponents = page.components.map(comp =>
      comp.id === selectedComponent.id
        ? { ...comp, x: Math.max(0, newX), y: Math.max(0, newY) }
        : comp
    )

    onUpdate(updatedComponents)
  }, [isDragging, dragOffset, selectedComponent, page.components, onUpdate, gridSize])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setShowSizeIndicator(false)
  }, [])

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string, component: PageComponent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setResizeHandle(handle)
    onComponentSelect(component)
    
    // Store initial mouse position and component dimensions
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }, [onComponentSelect])

  const handleResize = useCallback((e: React.MouseEvent) => {
    if (!isResizing || !selectedComponent || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    let newWidth = selectedComponent.width
    let newHeight = selectedComponent.height
    let newX = selectedComponent.x
    let newY = selectedComponent.y

    const minSize = Math.max(gridSize, 20) // Minimum size constraint

    switch (resizeHandle) {
      // Corner handles
      case 'se': // Southeast
        newWidth = Math.round((mouseX - selectedComponent.x) / gridSize) * gridSize
        newHeight = Math.round((mouseY - selectedComponent.y) / gridSize) * gridSize
        break
      case 'sw': // Southwest
        newWidth = Math.round((selectedComponent.x + selectedComponent.width - mouseX) / gridSize) * gridSize
        newHeight = Math.round((mouseY - selectedComponent.y) / gridSize) * gridSize
        newX = Math.round((mouseX) / gridSize) * gridSize
        break
      case 'ne': // Northeast
        newWidth = Math.round((mouseX - selectedComponent.x) / gridSize) * gridSize
        newHeight = Math.round((selectedComponent.y + selectedComponent.height - mouseY) / gridSize) * gridSize
        newY = Math.round((mouseY) / gridSize) * gridSize
        break
      case 'nw': // Northwest
        newWidth = Math.round((selectedComponent.x + selectedComponent.width - mouseX) / gridSize) * gridSize
        newHeight = Math.round((selectedComponent.y + selectedComponent.height - mouseY) / gridSize) * gridSize
        newX = Math.round((mouseX) / gridSize) * gridSize
        newY = Math.round((mouseY) / gridSize) * gridSize
        break
      
      // Edge handles
      case 'e': // East
        newWidth = Math.round((mouseX - selectedComponent.x) / gridSize) * gridSize
        break
      case 'w': // West
        newWidth = Math.round((selectedComponent.x + selectedComponent.width - mouseX) / gridSize) * gridSize
        newX = Math.round((mouseX) / gridSize) * gridSize
        break
      case 's': // South
        newHeight = Math.round((mouseY - selectedComponent.y) / gridSize) * gridSize
        break
      case 'n': // North
        newHeight = Math.round((selectedComponent.y + selectedComponent.height - mouseY) / gridSize) * gridSize
        newY = Math.round((mouseY) / gridSize) * gridSize
        break
    }

    // Apply minimum size constraints
    newWidth = Math.max(minSize, newWidth)
    newHeight = Math.max(minSize, newHeight)

    // Ensure position doesn't go negative
    newX = Math.max(0, newX)
    newY = Math.max(0, newY)

    const updatedComponents = page.components.map(comp =>
      comp.id === selectedComponent.id
        ? { 
            ...comp, 
            x: newX,
            y: newY,
            width: newWidth, 
            height: newHeight
          }
        : comp
    )

    onUpdate(updatedComponents)
    
    // Show size indicator
    setSizeIndicator({ x: newX, y: newY, width: newWidth, height: newHeight })
    setShowSizeIndicator(true)
  }, [isResizing, selectedComponent, resizeHandle, page.components, onUpdate, gridSize])

  const handleDeleteComponent = useCallback((componentId: string) => {
    const updatedComponents = page.components.filter(comp => comp.id !== componentId)
    onUpdate(updatedComponents)
    if (selectedComponent?.id === componentId) {
      onComponentSelect(null)
    }
  }, [page.components, onUpdate, selectedComponent, onComponentSelect])

  const handleDuplicateComponent = useCallback((component: PageComponent) => {
    const newComponent = {
      ...component,
      id: `component-${Date.now()}`,
      x: component.x + 20,
      y: component.y + 20
    }
    onUpdate([...page.components, newComponent])
  }, [page.components, onUpdate])

  const renderComponent = (component: PageComponent) => {
    const isSelected = selectedComponents.includes(component.id)
    const isPrimarySelected = selectedComponent?.id === component.id
    
    return (
      <div
        key={component.id}
        className={`absolute border-2 cursor-move ${
          isSelected 
            ? isPrimarySelected
              ? 'border-primary bg-primary/10'
              : 'border-primary/70 bg-primary/5'
            : 'border-border bg-background hover:border-muted-foreground/50'
        }`}
        style={{
          left: component.x,
          top: component.y,
          width: component.width,
          height: component.height,
          ...component.style
        }}
        onMouseDown={(e) => {
          if (e.ctrlKey || e.metaKey) {
            // Multi-select with Ctrl/Cmd
            e.preventDefault()
            e.stopPropagation()
            const newSelection = isSelected 
              ? selectedComponents.filter(id => id !== component.id)
              : [...selectedComponents, component.id]
            onMultiSelect(newSelection)
          } else {
            handleMouseDown(e, component)
          }
        }}
      >
        {/* Component Content */}
        <div className="w-full h-full p-2 flex items-center justify-center text-sm">
          {component.type}
        </div>

        {/* Resize Handles */}
        {isSelected && (
          <>
            {/* Corner Handles */}
            <div
              className="absolute w-3 h-3 bg-primary border border-background cursor-nw-resize hover:bg-primary/80 transition-colors"
              style={{ left: -1, top: -1 }}
              onMouseDown={(e) => handleResizeStart(e, 'nw', component)}
              title="Resize from top-left"
            />
            <div
              className="absolute w-3 h-3 bg-primary border border-background cursor-ne-resize hover:bg-primary/80 transition-colors"
              style={{ right: -1, top: -1 }}
              onMouseDown={(e) => handleResizeStart(e, 'ne', component)}
              title="Resize from top-right"
            />
            <div
              className="absolute w-3 h-3 bg-primary border border-background cursor-sw-resize hover:bg-primary/80 transition-colors"
              style={{ left: -1, bottom: -1 }}
              onMouseDown={(e) => handleResizeStart(e, 'sw', component)}
              title="Resize from bottom-left"
            />
            <div
              className="absolute w-3 h-3 bg-primary border border-background cursor-se-resize hover:bg-primary/80 transition-colors"
              style={{ right: -1, bottom: -1 }}
              onMouseDown={(e) => handleResizeStart(e, 'se', component)}
              title="Resize from bottom-right"
            />
            
            {/* Edge Handles */}
            <div
              className="absolute w-3 h-3 bg-primary border border-background cursor-n-resize hover:bg-primary/80 transition-colors"
              style={{ left: '50%', top: -1, transform: 'translateX(-50%)' }}
              onMouseDown={(e) => handleResizeStart(e, 'n', component)}
              title="Resize from top"
            />
            <div
              className="absolute w-3 h-3 bg-primary border border-background cursor-s-resize hover:bg-primary/80 transition-colors"
              style={{ left: '50%', bottom: -1, transform: 'translateX(-50%)' }}
              onMouseDown={(e) => handleResizeStart(e, 's', component)}
              title="Resize from bottom"
            />
            <div
              className="absolute w-3 h-3 bg-primary border border-background cursor-w-resize hover:bg-primary/80 transition-colors"
              style={{ left: -1, top: '50%', transform: 'translateY(-50%)' }}
              onMouseDown={(e) => handleResizeStart(e, 'w', component)}
              title="Resize from left"
            />
            <div
              className="absolute w-3 h-3 bg-primary border border-background cursor-e-resize hover:bg-primary/80 transition-colors"
              style={{ right: -1, top: '50%', transform: 'translateY(-50%)' }}
              onMouseDown={(e) => handleResizeStart(e, 'e', component)}
              title="Resize from right"
            />
          </>
        )}

        {/* Component Actions */}
        {isSelected && (
          <div className="absolute -top-8 left-0 flex gap-1">
            <Button size="sm" variant="secondary" className="h-6 w-6 p-0">
              <Settings className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-6 w-6 p-0"
              onClick={() => handleDuplicateComponent(component)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-6 w-6 p-0"
              onClick={() => handleDeleteComponent(component.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-2 bg-background border rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showGrid ? "default" : "outline"}
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={resizeMode ? "default" : "outline"}
            onClick={() => setResizeMode(!resizeMode)}
            title={resizeMode ? "Exit resize mode" : "Enter resize mode"}
          >
            {resizeMode ? <MousePointer className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Grid:</span>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1"
            >
              <option value={10}>10px</option>
              <option value={20}>20px</option>
              <option value={25}>25px</option>
              <option value={50}>50px</option>
            </select>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {page.components.length} components
          {resizeMode && (
            <span className="ml-2 text-primary">
              • Resize mode: Drag any edge or corner to resize
            </span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="relative w-full h-full min-h-[600px] border rounded-lg overflow-hidden"
        style={{
          backgroundColor: canvasBackground?.type === 'color' ? canvasBackground.color : '#ffffff',
          backgroundImage: canvasBackground?.type === 'image' && canvasBackground.image ? `url(${canvasBackground.image})` : undefined,
          backgroundPosition: canvasBackground?.type === 'image' ? canvasBackground.position : undefined,
          backgroundSize: canvasBackground?.type === 'image' ? canvasBackground.size : undefined,
          backgroundRepeat: canvasBackground?.type === 'image' ? 'no-repeat' : undefined,
          opacity: canvasBackground?.type === 'image' ? canvasBackground.opacity : undefined,
          filter: canvasBackground?.type === 'image' && canvasBackground.blur > 0 ? `blur(${canvasBackground.blur}px)` : undefined
        }}
      >
        <div
          ref={containerRef}
          className="relative w-full h-full"
          onMouseMove={isDragging ? handleMouseMove : isResizing ? handleResize : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => onComponentSelect(null)}
        >
          {/* Grid Background */}
          {showGrid && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${gridSize}px ${gridSize}px`
              }}
            />
          )}

          {/* Components */}
          {page.components.map(renderComponent)}

          {/* Size Indicator Overlay */}
          {showSizeIndicator && (
            <div
              className="absolute bg-primary/20 border-2 border-primary pointer-events-none z-10"
              style={{
                left: sizeIndicator.x,
                top: sizeIndicator.y,
                width: sizeIndicator.width,
                height: sizeIndicator.height
              }}
            >
              <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded whitespace-nowrap">
                {sizeIndicator.width} × {sizeIndicator.height}px
              </div>
            </div>
          )}

          {/* Empty State */}
          {page.components.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Move className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No components yet</p>
                <p className="text-sm">Drag components from the right panel to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
