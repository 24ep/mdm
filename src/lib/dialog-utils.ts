/**
 * Shared Dialog Utilities
 * Common logic for Dialog and AlertDialog components
 */

import * as React from 'react'

export interface UseControlledDialogStateOptions {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

export interface UseControlledDialogStateReturn {
  open: boolean
  setOpen: (open: boolean) => void
  isControlled: boolean
}

/**
 * Manages controlled/uncontrolled dialog state
 */
export function useControlledDialogState(
  options: UseControlledDialogStateOptions
): UseControlledDialogStateReturn {
  const { open: controlledOpen, onOpenChange, defaultOpen = false } = options
  
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  return { open, setOpen, isControlled }
}

/**
 * Lock body scroll when dialog is open
 */
export function useDialogBodyScrollLock(open: boolean) {
  React.useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [open])
}

/**
 * Handle escape key for dialog
 */
export function useDialogEscapeKey(
  open: boolean,
  onClose: () => void,
  enabled: boolean = true
) {
  React.useEffect(() => {
    if (!open || !enabled) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose, enabled])
}


