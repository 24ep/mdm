import { widgetsPalette } from '../widgets'

export function useDragHandler(onClose: () => void) {
  const handleDragStart = (e: React.DragEvent, widgetType: string) => {
    // Set drag data - must be done synchronously
    // Use multiple formats for better compatibility
    e.dataTransfer.setData('text/plain', widgetType)
    e.dataTransfer.setData('widgetType', widgetType)
    e.dataTransfer.setData('application/x-widget-type', widgetType)
    e.dataTransfer.effectAllowed = 'copy'
    
    // Create drag image synchronously - use a simple canvas for reliability
    const canvas = document.createElement('canvas')
    canvas.width = 80
    canvas.height = 60
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 80, 60)
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, 80, 60)
      ctx.fillStyle = '#374151'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Try to get widget label
      const widget = widgetsPalette.find(w => w.type === widgetType)
      const label = widget?.label || 'Widget'
      ctx.fillText(label.length > 8 ? label.substring(0, 8) : label, 40, 30)
    }
    e.dataTransfer.setDragImage(canvas, 40, 30)
    
    // Close drawer after drag is initiated to allow drop on canvas
    // Use requestAnimationFrame to ensure drag has started
    requestAnimationFrame(() => {
      setTimeout(() => {
        onClose()
      }, 100)
    })
  }
  
  const handleDragEnd = (e: React.DragEvent) => {
    // Cleanup drag image if still exists
    const dragImages = document.querySelectorAll('[style*="position: absolute"][style*="top: -1000px"]')
    dragImages.forEach(img => {
      if (document.body.contains(img)) {
        document.body.removeChild(img)
      }
    })
  }
  
  return {
    handleDragStart,
    handleDragEnd,
  }
}

