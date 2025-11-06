'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Trash, Heading } from 'lucide-react'
import toast from 'react-hot-toast'
import { UnifiedPage } from './types'
import { SpacesEditorPage } from '@/lib/space-studio-manager'

interface HeaderItemProps {
  page: UnifiedPage
  index: number
  isMobileViewport: boolean
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
}

export function HeaderItem({
  page,
  index,
  isMobileViewport,
  allPages,
  pages,
  handlePageReorder,
  setAllPages,
}: HeaderItemProps) {
  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null)
  const [headerText, setHeaderText] = useState<string>(page.headerText || 'Header')
  const isEditing = editingHeaderId === page.id

  return (
    <div
      key={page.id}
      className={`flex items-center gap-2 ${isMobileViewport ? 'px-3 py-2' : 'px-4 py-1.5'} rounded-[10px] border hover:bg-muted select-none`}
    >
      {isEditing ? (
        <>
          <Heading className={`${isMobileViewport ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground`} />
          <Input
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            onBlur={() => {
              setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, headerText: headerText || 'Header', name: headerText || 'Header' } : x))
              setEditingHeaderId(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, headerText: headerText || 'Header', name: headerText || 'Header' } : x))
                setEditingHeaderId(null)
              }
              if (e.key === 'Escape') {
                setEditingHeaderId(null)
                setHeaderText(page.headerText || 'Header')
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
          <Heading className={`${isMobileViewport ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground`} />
          <span 
            className="flex-1 text-xs font-semibold text-foreground pointer-events-none"
            onClick={(e) => {
              e.stopPropagation()
              setEditingHeaderId(page.id)
              setHeaderText(page.headerText || 'Header')
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {page.headerText || 'Header'}
          </span>
        </>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <MoreVertical className={isMobileViewport ? "h-4 w-4" : "h-3.5 w-3.5"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            setEditingHeaderId(page.id)
            setHeaderText(page.headerText || 'Header')
          }} className="cursor-pointer">
            <Heading className="mr-2 h-4 w-4" />
            <span>Edit Header</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            setAllPages((prev) => prev.filter((x) => x.id !== page.id))
            toast.success('Header removed')
          }} className="cursor-pointer text-destructive focus:text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

