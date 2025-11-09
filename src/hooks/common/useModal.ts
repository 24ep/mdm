/**
 * Modal State Management Hook
 * Common pattern for managing modal open/close state
 */

import { useState, useCallback } from 'react'

export function useModal(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialState)
  
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])
  
  return { isOpen, open, close, toggle }
}
