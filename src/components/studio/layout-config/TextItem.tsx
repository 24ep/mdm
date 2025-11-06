'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Trash, Type } from 'lucide-react'
import toast from 'react-hot-toast'
import { UnifiedPage } from './types'
import { SpacesEditorPage } from '@/lib/space-studio-manager'

interface TextItemProps {
  page: UnifiedPage
  index: number
  isMobileViewport: boolean
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
}

export function TextItem({
  page,
  index,
  isMobileViewport,
  allPages,
  pages,
  handlePageReorder,
  setAllPages,
}: TextItemProps) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string>(page.text || 'Text')
  const isEditing = editingTextId === page.id

  return (
    <div
      key={page.id}
      className={`flex items-center gap-2 ${isMobileViewport ? 'px-3 py-2' : 'px-4 py-1.5'} rounded-[10px] border hover:bg-muted select-none`}
    >
      {isEditing ? (
        <>
          <Type className={`${isMobileViewport ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground`} />
          <Input
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            onBlur={() => {
              setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, text: textContent || 'Text', name: textContent || 'Text' } : x))
              setEditingTextId(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAllPages((prev) => prev.map((x) => x.id === page.id ? { ...x, text: textContent || 'Text', name: textContent || 'Text' } : x))
                setEditingTextId(null)
              }
              if (e.key === 'Escape') {
                setEditingTextId(null)
                setTextContent(page.text || 'Text')
              }
            }}
            className="flex-1 h-7 text-xs"
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </>
      ) : (
        <>
          <Type className={`${isMobileViewport ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground`} />
          <span 
            className="flex-1 text-xs text-foreground pointer-events-none"
            onClick={(e) => {
              e.stopPropagation()
              setEditingTextId(page.id)
              setTextContent(page.text || 'Text')
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {page.text || 'Text'}
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
            setEditingTextId(page.id)
            setTextContent(page.text || 'Text')
          }} className="cursor-pointer">
            <Type className="mr-2 h-4 w-4" />
            <span>Edit Text</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            setAllPages((prev) => prev.filter((x) => x.id !== page.id))
            toast.success('Text removed')
          }} className="cursor-pointer text-destructive focus:text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

