'use client'

import React, { useRef, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { UnifiedPage } from './types'

interface SidebarPositionPickerProps {
  spaceId: string
  page: UnifiedPage
  customPage: SpacesEditorPage
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
  triggerRef?: React.RefObject<HTMLButtonElement>
}

export function SidebarPositionPicker({
  spaceId,
  page,
  customPage,
  isOpen,
  onOpenChange,
  setAllPages,
  triggerRef,
}: SidebarPositionPickerProps) {
  const defaultTriggerRef = useRef<HTMLButtonElement>(null)
  const actualTriggerRef = triggerRef || defaultTriggerRef

  return (
    <Popover 
      open={isOpen} 
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger asChild>
        <button 
          ref={actualTriggerRef}
          className="absolute opacity-0 pointer-events-none w-0 h-0" 
          aria-hidden="true" 
          tabIndex={-1}
        />
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-4"
        align="end"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '256px', minWidth: '256px', maxWidth: '256px' }}
      >
        <div className="space-y-3">
          <div className="text-sm font-semibold">Sidebar Position</div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation()
                setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, sidebarPosition: 'top' } : x))
                try {
                  await SpacesEditorManager.updatePage(spaceId, customPage.id, { sidebarPosition: 'top' } as any)
                  toast.success('Sidebar position updated')
                  onOpenChange(false)
                } catch (err) {
                  toast.error('Failed to update sidebar position')
                  console.error(err)
                }
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                page.sidebarPosition === 'top' || !page.sidebarPosition
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm">Top</span>
            </button>
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation()
                setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, sidebarPosition: 'bottom' } : x))
                try {
                  await SpacesEditorManager.updatePage(spaceId, customPage.id, { sidebarPosition: 'bottom' } as any)
                  toast.success('Sidebar position updated')
                  onOpenChange(false)
                } catch (err) {
                  toast.error('Failed to update sidebar position')
                  console.error(err)
                }
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                page.sidebarPosition === 'bottom'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <ArrowDown className="h-4 w-4" />
              <span className="text-sm">Bottom</span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

