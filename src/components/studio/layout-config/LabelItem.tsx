'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { MoreVertical, Tag, Trash } from 'lucide-react'
import toast from 'react-hot-toast'
import { UnifiedPage } from './types'
import { SpacesEditorPage } from '@/lib/space-studio-manager'

interface LabelItemProps {
  page: UnifiedPage
  index: number
  isMobileViewport: boolean
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
}

export function LabelItem({
  page,
  index,
  isMobileViewport,
  allPages,
  pages,
  handlePageReorder,
  setAllPages,
}: LabelItemProps) {
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [labelText, setLabelText] = useState<string>(page.label || 'Label')
  const isEditing = editingLabelId === page.id

  return (
    <div
      key={page.id}
      className={`flex items-center gap-2 ${isMobileViewport ? 'px-3 py-2' : 'px-4 py-1.5'} rounded-[10px] border hover:bg-muted`}
    >
      {isEditing ? (
        <>
          <Input
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            onBlur={() => {
              setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, label: labelText || 'Label', name: labelText || 'Label' } : x))
              setEditingLabelId(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, label: labelText || 'Label', name: labelText || 'Label' } : x))
                setEditingLabelId(null)
              }
              if (e.key === 'Escape') {
                setEditingLabelId(null)
                setLabelText(page.label || 'Label')
              }
            }}
            className="flex-1 h-7 text-xs font-semibold"
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </>
      ) : (
        <>
          <Tag className={`${isMobileViewport ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground`} />
          <span 
            className="flex-1 text-xs font-semibold text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setEditingLabelId(page.id)
              setLabelText(page.label || 'Label')
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {page.label || 'Label'}
          </span>
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
            setEditingLabelId(page.id)
            setLabelText(page.label || 'Label')
          }} className="cursor-pointer">
            <Tag className="mr-2 h-4 w-4" />
            <span>Edit Label</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            setAllPages((prev) => prev.filter((x) => x.id !== page.id))
            toast.success('Label removed')
          }} className="cursor-pointer text-destructive focus:text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

