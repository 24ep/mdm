'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { MoreVertical, Badge, Trash } from 'lucide-react'
import toast from 'react-hot-toast'
import { UnifiedPage } from './types'
import { SpacesEditorPage } from '@/lib/space-studio-manager'
import { ColorInput } from './ColorInput'

interface BadgeItemProps {
  page: UnifiedPage
  index: number
  isMobileViewport: boolean
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
}

export function BadgeItem({
  page,
  index,
  isMobileViewport,
  allPages,
  pages,
  handlePageReorder,
  setAllPages,
}: BadgeItemProps) {
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null)
  const [badgeText, setBadgeText] = useState<string>(page.badgeText || 'New')
  const [badgeColor, setBadgeColor] = useState<string>(page.badgeColor || '#ef4444')
  const isEditing = editingBadgeId === page.id

  return (
    <div
      key={page.id}
      className={`flex items-center gap-2 ${isMobileViewport ? 'px-3 py-2' : 'px-4 py-1.5'} rounded-[10px] border hover:bg-muted`}
    >
      {isEditing ? (
        <>
          <Input
            type="text"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            placeholder="Badge text"
            className="flex-1 h-7 text-xs"
            onBlur={() => {
              setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, badgeText: badgeText || 'New', badgeColor: badgeColor || '#ef4444', name: badgeText || 'Badge' } : x))
              setEditingBadgeId(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, badgeText: badgeText || 'New', badgeColor: badgeColor || '#ef4444', name: badgeText || 'Badge' } : x))
                setEditingBadgeId(null)
              }
              if (e.key === 'Escape') {
                setEditingBadgeId(null)
                setBadgeText(page.badgeText || 'New')
                setBadgeColor(page.badgeColor || '#ef4444')
              }
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <ColorInput
            value={badgeColor}
            onChange={(color) => setBadgeColor(color)}
            allowImageVideo={false}
            className="relative"
            placeholder="#ef4444"
            inputClassName="h-7 text-xs pl-7"
          />
        </>
      ) : (
        <>
          <div
            className="flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-medium text-white cursor-pointer"
            style={{ backgroundColor: badgeColor || '#ef4444' }}
            onClick={(e) => {
              e.stopPropagation()
              setEditingBadgeId(page.id)
              setBadgeText(page.badgeText || 'New')
              setBadgeColor(page.badgeColor || '#ef4444')
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Badge className={`${isMobileViewport ? 'h-3 w-3' : 'h-3 w-3'}`} />
            <span>{badgeText || 'New'}</span>
          </div>
        </>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
            <MoreVertical className={isMobileViewport ? "h-4 w-4" : "h-3.5 w-3.5"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            setEditingBadgeId(page.id)
            setBadgeText(page.badgeText || 'New')
            setBadgeColor(page.badgeColor || '#ef4444')
          }} className="cursor-pointer">
            <Badge className="mr-2 h-4 w-4" />
            <span>Edit Badge</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            setAllPages((prev) => prev.filter((x) => x.id !== page.id))
            toast.success('Badge removed')
          }} className="cursor-pointer text-destructive focus:text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

