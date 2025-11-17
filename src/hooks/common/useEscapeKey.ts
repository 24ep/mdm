/**
 * Escape Key Handler Hook
 * Handles Escape key press for closing modals/dialogs
 */

import { useEffect } from 'react'

export function useEscapeKey(
  isEnabled: boolean,
  onEscape: () => void
) {
  useEffect(() => {
    if (!isEnabled) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape()
      }
    }

    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isEnabled, onEscape])
}


