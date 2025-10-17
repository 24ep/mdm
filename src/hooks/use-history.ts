'use client'

import { useState, useCallback, useRef } from 'react'

interface HistoryState {
  id: string
  timestamp: number
  action: string
  data: any
}

interface UseHistoryOptions {
  maxHistorySize?: number
}

export function useHistory<T>(initialState: T, options: UseHistoryOptions = {}) {
  const { maxHistorySize = 50 } = options
  
  const [currentState, setCurrentState] = useState<T>(initialState)
  const [history, setHistory] = useState<HistoryState[]>([
    {
      id: 'initial',
      timestamp: Date.now(),
      action: 'Initial State',
      data: initialState
    }
  ])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isUndoRedo, setIsUndoRedo] = useState(false)

  const addToHistory = useCallback((action: string, newState: T) => {
    if (isUndoRedo) return

    const newHistoryItem: HistoryState = {
      id: `action-${Date.now()}`,
      timestamp: Date.now(),
      action,
      data: newState
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newHistoryItem)
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize)
      }
      
      return newHistory
    })
    
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1))
    setCurrentState(newState)
  }, [historyIndex, maxHistorySize, isUndoRedo])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoRedo(true)
      const newIndex = historyIndex - 1
      const previousState = history[newIndex].data
      
      setHistoryIndex(newIndex)
      setCurrentState(previousState)
      
      // Reset flag after state update
      setTimeout(() => setIsUndoRedo(false), 0)
      
      return history[newIndex]
    }
    return null
  }, [historyIndex, history])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedo(true)
      const newIndex = historyIndex + 1
      const nextState = history[newIndex].data
      
      setHistoryIndex(newIndex)
      setCurrentState(nextState)
      
      // Reset flag after state update
      setTimeout(() => setIsUndoRedo(false), 0)
      
      return history[newIndex]
    }
    return null
  }, [historyIndex, history])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const getCurrentAction = () => {
    return history[historyIndex]?.action || 'Initial State'
  }

  const clearHistory = useCallback(() => {
    setHistory([{
      id: 'initial',
      timestamp: Date.now(),
      action: 'Initial State',
      data: currentState
    }])
    setHistoryIndex(0)
  }, [currentState])

  return {
    currentState,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrentAction,
    clearHistory,
    history,
    historyIndex
  }
}
