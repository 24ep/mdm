'use client'

import { useState, useCallback, useRef } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export function useUndoRedo<T>(initialState: T) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  })

  const maxHistorySize = useRef(50) // Limit history size

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const undo = useCallback(() => {
    if (!canUndo) return

    const previous = state.past[state.past.length - 1]
    const newPast = state.past.slice(0, state.past.length - 1)

    setState({
      past: newPast,
      present: previous,
      future: [state.present, ...state.future]
    })

    return previous
  }, [state, canUndo])

  const redo = useCallback(() => {
    if (!canRedo) return

    const next = state.future[0]
    const newFuture = state.future.slice(1)

    setState({
      past: [...state.past, state.present],
      present: next,
      future: newFuture
    })

    return next
  }, [state, canRedo])

  const setStateWithHistory = useCallback((newState: T) => {
    // Don't add to history if state hasn't changed
    if (JSON.stringify(newState) === JSON.stringify(state.present)) {
      return
    }

    const newPast = [...state.past, state.present]
    
    // Limit history size
    if (newPast.length > maxHistorySize.current) {
      newPast.shift()
    }

    setState({
      past: newPast,
      present: newState,
      future: [] // Clear future when new action is performed
    })
  }, [state.present])

  const clearHistory = useCallback(() => {
    setState({
      past: [],
      present: state.present,
      future: []
    })
  }, [state.present])

  const getHistoryInfo = useCallback(() => {
    return {
      canUndo,
      canRedo,
      historySize: state.past.length,
      futureSize: state.future.length
    }
  }, [canUndo, canRedo, state.past.length, state.future.length])

  return {
    state: state.present,
    setState: setStateWithHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getHistoryInfo
  }
}
