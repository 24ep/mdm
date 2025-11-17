/**
 * Dialog State Management Hook
 * Combines modal state with dialog-specific features (scroll lock, escape key)
 */

import { useState, useCallback } from 'react'
import { useBodyScrollLock } from './useBodyScrollLock'
import { useEscapeKey } from './useEscapeKey'

export interface UseDialogOptions {
  initialOpen?: boolean
  closeOnEscape?: boolean
  lockBodyScroll?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface UseDialogReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setOpen: (open: boolean) => void
}

export function useDialog(options: UseDialogOptions = {}): UseDialogReturn {
  const {
    initialOpen = false,
    closeOnEscape = true,
    lockBodyScroll = true,
    onOpenChange
  } = options

  const [isOpen, setIsOpen] = useState(initialOpen)

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }, [onOpenChange])

  const open = useCallback(() => setOpen(true), [setOpen])
  const close = useCallback(() => setOpen(false), [setOpen])
  const toggle = useCallback(() => setOpen(!isOpen), [setOpen, isOpen])

  // Lock body scroll when dialog is open
  useBodyScrollLock(lockBodyScroll && isOpen)

  // Handle escape key
  useEscapeKey(closeOnEscape && isOpen, close)

  return {
    isOpen,
    open,
    close,
    toggle,
    setOpen
  }
}


