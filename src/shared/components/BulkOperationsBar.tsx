'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Edit, MoreVertical, X } from 'lucide-react'
import { showSuccess, showError } from '@/lib/toast-utils'

interface BulkOperationsBarProps {
  selectedIds: string[]
  onClearSelection: () => void
  onBulkOperation: (operation: string, data?: any) => Promise<void>
  operations?: Array<{
    id: string
    label: string
    icon?: React.ReactNode
    requiresData?: boolean
    dataComponent?: React.ComponentType<{ onSubmit: (data: any) => void }>
  }>
  resourceName?: string
}

export function BulkOperationsBar({
  selectedIds,
  onClearSelection,
  onBulkOperation,
  operations = [],
  resourceName = 'items',
}: BulkOperationsBarProps) {
  const [loading, setLoading] = useState(false)

  const defaultOperations = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
    },
    ...operations,
  ]

  const handleOperation = async (operationId: string, data?: any) => {
    if (selectedIds.length === 0) return

    setLoading(true)
    try {
      await onBulkOperation(operationId, data)
      showSuccess(`Successfully ${operationId}d ${selectedIds.length} ${resourceName}`)
      onClearSelection()
    } catch (error: any) {
      showError(error.message || `Failed to ${operationId} ${resourceName}`)
    } finally {
      setLoading(false)
    }
  }

  if (selectedIds.length === 0) return null

  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox checked={true} disabled />
          <span className="text-sm font-medium">
            {selectedIds.length} {resourceName} selected
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {defaultOperations.map((op) => (
          <Button
            key={op.id}
            variant={op.id === 'delete' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => handleOperation(op.id)}
            disabled={loading}
            className="h-8"
          >
            {op.icon && <span className="mr-1">{op.icon}</span>}
            {op.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

