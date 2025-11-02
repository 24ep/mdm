'use client'

import React, { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Copy, Scissors, Clipboard, Trash2, Lock, Unlock, Eye, EyeOff, ArrowUp, ArrowDown, Layers } from 'lucide-react'
import { PlacedWidget } from './widgets'

interface WidgetContextMenuProps {
  widget: PlacedWidget
  isLocked: boolean
  isHidden: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCopy: () => void
  onCut: () => void
  onPaste?: () => void
  onDelete: () => void
  onDuplicate: () => void
  onLock: () => void
  onUnlock: () => void
  onHide: () => void
  onShow: () => void
  onBringToFront?: () => void
  onSendToBack?: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
  children: React.ReactNode
}

export function WidgetContextMenu({
  widget,
  isLocked,
  isHidden,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onDuplicate,
  onLock,
  onUnlock,
  onHide,
  onShow,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  children,
}: WidgetContextMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {children}
      <DropdownMenuContent className="w-48" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuItem onClick={() => { onCopy(); setOpen(false) }} disabled={isLocked}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
          <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => { onCut(); setOpen(false) }} disabled={isLocked}>
          <Scissors className="h-4 w-4 mr-2" />
          Cut
          <DropdownMenuShortcut>⌘X</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        {onPaste && (
          <DropdownMenuItem onClick={() => { onPaste(); setOpen(false) }}>
            <Clipboard className="h-4 w-4 mr-2" />
            Paste
            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => { onDuplicate(); setOpen(false) }} disabled={isLocked}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
          <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => { isHidden ? onShow() : onHide(); setOpen(false) }}>
          {isHidden ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => { isLocked ? onUnlock() : onLock(); setOpen(false) }}>
          {isLocked ? (
            <>
              <Unlock className="h-4 w-4 mr-2" />
              Unlock
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Lock
            </>
          )}
        </DropdownMenuItem>
        
        {(onBringToFront || onSendToBack || onBringForward || onSendBackward) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              <Layers className="h-3 w-3 mr-1.5 inline" />
              Layer Order
            </DropdownMenuLabel>
            {onBringToFront && (
              <DropdownMenuItem onClick={() => { onBringToFront(); setOpen(false) }} disabled={isLocked}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Bring to Front
              </DropdownMenuItem>
            )}
            {onBringForward && (
              <DropdownMenuItem onClick={() => { onBringForward(); setOpen(false) }} disabled={isLocked}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Bring Forward
              </DropdownMenuItem>
            )}
            {onSendBackward && (
              <DropdownMenuItem onClick={() => { onSendBackward(); setOpen(false) }} disabled={isLocked}>
                <ArrowDown className="h-4 w-4 mr-2" />
                Send Backward
              </DropdownMenuItem>
            )}
            {onSendToBack && (
              <DropdownMenuItem onClick={() => { onSendToBack(); setOpen(false) }} disabled={isLocked}>
                <ArrowDown className="h-4 w-4 mr-2" />
                Send to Back
              </DropdownMenuItem>
            )}
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => { onDelete(); setOpen(false) }} disabled={isLocked} className="text-red-600 focus:text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
          <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

