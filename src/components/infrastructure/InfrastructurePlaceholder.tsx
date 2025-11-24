'use client'

import { Button } from '@/components/ui/button'
import { Server, Settings, Plus } from 'lucide-react'

interface InfrastructurePlaceholderProps {
  onAddVm?: () => void
  onAddService?: () => void
}

export function InfrastructurePlaceholder({
  onAddVm,
  onAddService,
}: InfrastructurePlaceholderProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-6">
              <Server className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold">No VM or Service Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a VM or service from the sidebar to view details, or add a new VM or service to get started.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onAddVm && (
            <Button onClick={onAddVm} className="gap-2">
              <Plus className="h-4 w-4" />
              Add VM
            </Button>
          )}
          {onAddService && (
            <Button onClick={onAddService} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

