/**
 * Shared File Drag & Drop Hook
 * Provides reusable drag and drop functionality for file uploads
 */

import { useState, useRef } from 'react'

export interface UseFileDragDropOptions {
  disabled?: boolean
  onFilesSelected?: (files: FileList) => void | Promise<void>
  multiple?: boolean
}

export interface UseFileDragDropReturn {
  dragOver: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  handleDrop: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  openFileDialog: () => void
}

export function useFileDragDrop({
  disabled = false,
  onFilesSelected,
  multiple = false
}: UseFileDragDropOptions = {}): UseFileDragDropReturn {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files && files.length > 0 && onFilesSelected) {
      onFilesSelected(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && onFilesSelected) {
      onFilesSelected(files)
    }
  }

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return {
    dragOver,
    fileInputRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInputChange,
    openFileDialog
  }
}

