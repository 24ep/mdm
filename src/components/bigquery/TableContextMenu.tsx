'use client'

import { Table, Eye, Hash, Info, Database, Copy, Trash2 } from 'lucide-react'

interface TableContextMenuProps {
  visible: boolean
  x: number
  y: number
  tableName: string
  projectName: string
  sourceType?: 'INTERNAL' | 'EXTERNAL'
  onAction: (action: string, tableName: string, projectName: string) => void
  onClose: () => void
}

export function TableContextMenu({
  visible,
  x,
  y,
  tableName,
  projectName,
  sourceType = 'INTERNAL',
  onAction,
  onClose
}: TableContextMenuProps) {
  if (!visible) return null

  const handleAction = (action: string) => {
    onAction(action, tableName, projectName)
    onClose()
  }

  return (
    <>
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48"
        style={{
          left: x,
          top: y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
          {projectName}.{tableName}
        </div>
        
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          onClick={() => handleAction('select')}
        >
          <Table className="h-4 w-4 text-gray-400" />
          Select all columns
        </button>
        
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          onClick={() => handleAction('preview')}
        >
          <Eye className="h-4 w-4 text-gray-400" />
          Preview
        </button>
        
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          onClick={() => handleAction('count')}
        >
          <Hash className="h-4 w-4 text-gray-400" />
          Count rows
        </button>
        
        <div className="border-t border-gray-100 my-1"></div>
        
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          onClick={() => handleAction('describe')}
        >
          <Info className="h-4 w-4 text-gray-400" />
          Describe table
        </button>
        
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          onClick={() => handleAction('schema')}
        >
          <Database className="h-4 w-4 text-gray-400" />
          Show schema
        </button>
        
        <div className="border-t border-gray-100 my-1"></div>
        
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          onClick={() => handleAction('copy_name')}
        >
          <Copy className="h-4 w-4 text-gray-400" />
          Copy table name
        </button>
        
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          onClick={() => handleAction('copy_path')}
        >
          <Copy className="h-4 w-4 text-gray-400" />
          Copy table path
        </button>
        
        <div className="border-t border-gray-100 my-1"></div>
        
        {/* Only show drop table option for external data sources */}
        {sourceType === 'EXTERNAL' && (
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            onClick={() => handleAction('drop')}
          >
            <Trash2 className="h-4 w-4 text-red-400" />
            Drop table
          </button>
        )}
      </div>

      {/* Click outside to close context menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
    </>
  )
}
