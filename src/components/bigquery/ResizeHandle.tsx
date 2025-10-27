'use client'

interface ResizeHandleProps {
  isResizing: boolean
  onMouseDown: (e: React.MouseEvent) => void
}

export function ResizeHandle({ isResizing, onMouseDown }: ResizeHandleProps) {
  return (
    <div 
      className={`h-2 cursor-ns-resize relative group border-t border-gray-300 ${
        isResizing 
          ? 'bg-blue-500' 
          : 'bg-gray-200 hover:bg-blue-400 transition-colors'
      }`}
      onMouseDown={onMouseDown}
      title="Drag to resize footer height"
      style={{
        willChange: isResizing ? 'background-color' : 'auto'
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-1">
          <div className={`w-1 h-1 rounded-full ${
            isResizing 
              ? 'bg-white' 
              : 'bg-gray-400 group-hover:bg-blue-600'
          }`}></div>
          <div className={`w-1 h-1 rounded-full ${
            isResizing 
              ? 'bg-white' 
              : 'bg-gray-400 group-hover:bg-blue-600'
          }`}></div>
          <div className={`w-1 h-1 rounded-full ${
            isResizing 
              ? 'bg-white' 
              : 'bg-gray-400 group-hover:bg-blue-600'
          }`}></div>
        </div>
      </div>
    </div>
  )
}
