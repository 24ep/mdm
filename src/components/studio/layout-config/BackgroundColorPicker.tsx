'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent } from '@/components/ui/popover'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'

interface BackgroundColorPickerProps {
  spaceId: string
  page: SpacesEditorPage
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  setPages: React.Dispatch<React.SetStateAction<SpacesEditorPage[]>>
}

export function BackgroundColorPicker({
  spaceId,
  page,
  isOpen,
  onOpenChange,
  setPages,
}: BackgroundColorPickerProps) {
  const backgroundColor = (page as any)?.backgroundColor || '#ffffff'

  return (
    <Popover 
      open={isOpen} 
      onOpenChange={onOpenChange}
    >
      <PopoverContent 
        className="w-72 p-4"
        align="end"
        side="right"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '288px', minWidth: '288px', maxWidth: '288px' }}
      >
        <div className="space-y-3">
          <div className="text-sm font-semibold">Background Color</div>
          <div className="space-y-2">
            {/* Common Color Swatches */}
            <div className="space-y-1">
              <Label className="text-xs">Quick Colors</Label>
              <div className="grid grid-cols-8 gap-1">
                {['#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827', '#000000', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation()
                      setPages((prev) => prev.map((x) => x.id === page.id ? { ...x, backgroundColor: color } as any : x))
                      try {
                        await SpacesEditorManager.updatePage(spaceId, page.id, { backgroundColor: color } as any)
                        toast.success('Background color updated')
                      } catch (err) {
                        toast.error('Failed to update background color')
                        console.error(err)
                      }
                    }}
                    className={`w-6 h-6 rounded border-2 ${backgroundColor === color ? 'border-blue-500 scale-110' : 'border-border hover:border-gray-400'} transition-all cursor-pointer`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Custom Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => {
                    const color = e.target.value
                    setPages((prev) => prev.map((x) => x.id === page.id ? { ...x, backgroundColor: color } as any : x))
                  }}
                  className="h-8 w-16 p-0 border cursor-pointer"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => {
                    const color = e.target.value
                    if (/^#[0-9A-F]{6}$/i.test(color) || color === '') {
                      setPages((prev) => prev.map((x) => x.id === page.id ? { ...x, backgroundColor: color || '#ffffff' } as any : x))
                    }
                  }}
                  onBlur={async (e) => {
                    const color = e.target.value || '#ffffff'
                    try {
                      await SpacesEditorManager.updatePage(spaceId, page.id, { backgroundColor: color } as any)
                      toast.success('Background color updated')
                      onOpenChange(false)
                    } catch (err) {
                      toast.error('Failed to update background color')
                      console.error(err)
                    }
                  }}
                  placeholder="#ffffff"
                  className="h-8 flex-1 text-xs"
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async (e) => {
                e.stopPropagation()
                const color = backgroundColor
                try {
                  await SpacesEditorManager.updatePage(spaceId, page.id, { backgroundColor: color } as any)
                  toast.success('Background color updated')
                  onOpenChange(false)
                } catch (err) {
                  toast.error('Failed to update background color')
                  console.error(err)
                }
              }}
              className="w-full h-8 text-xs"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

