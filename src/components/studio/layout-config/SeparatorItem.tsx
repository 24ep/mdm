'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Trash } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorInput } from './ColorInput'
import toast from 'react-hot-toast'
import { UnifiedPage } from './types'
import { SpacesEditorPage } from '@/lib/space-studio-manager'

interface SeparatorItemProps {
  page: UnifiedPage
  index: number
  isMobileViewport: boolean
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
}

export function SeparatorItem({
  page,
  index,
  isMobileViewport,
  allPages,
  pages,
  handlePageReorder,
  setAllPages,
}: SeparatorItemProps) {
  return (
    <div
      key={page.id}
      className="flex items-center gap-2 py-2 min-h-[28px]"
    >
      <div className="flex-1 h-px bg-border" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <MoreVertical className={isMobileViewport ? "h-4 w-4" : "h-3.5 w-3.5"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="p-2 space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Line color</Label>
              <ColorInput
                value={(page as any).separatorColor || '#dedede'}
                onChange={(color) => {
                  setAllPages(prev => prev.map(p => p.id === page.id ? { ...p, separatorColor: color } as any : p))
                }}
                allowImageVideo={true}
                className="relative w-28"
                placeholder="#dedede"
                inputClassName="h-7 text-xs pl-7"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Weight (px)</Label>
                <Input
                  type="number"
                  min={1}
                  value={Number((page as any).separatorWeight ?? 1)}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1)
                    setAllPages(prev => prev.map(p => p.id === page.id ? { ...p, separatorWeight: val } as any : p))
                  }}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Padding (Y px)</Label>
                <Input
                  type="number"
                  min={0}
                  value={Number((page as any).separatorPadding ?? 0)}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0)
                    setAllPages(prev => prev.map(p => p.id === page.id ? { ...p, separatorPadding: val } as any : p))
                  }}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Padding (X px)</Label>
                <Input
                  type="number"
                  min={0}
                  value={Number((page as any).separatorPaddingX ?? 0)}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0)
                    setAllPages(prev => prev.map(p => p.id === page.id ? { ...p, separatorPaddingX: val } as any : p))
                  }}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Margin (X px)</Label>
                <Input
                  type="number"
                  min={0}
                  value={Number((page as any).separatorMarginX ?? 0)}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0)
                    setAllPages(prev => prev.map(p => p.id === page.id ? { ...p, separatorMarginX: val } as any : p))
                  }}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Margin (Y px)</Label>
                <Input
                  type="number"
                  min={0}
                  value={Number((page as any).separatorMargin ?? 8)}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0)
                    setAllPages(prev => prev.map(p => p.id === page.id ? { ...p, separatorMargin: val } as any : p))
                  }}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            setAllPages((prev) => prev.filter((x) => x.id !== page.id))
            toast.success('Separator removed')
          }} className="cursor-pointer text-destructive focus:text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

