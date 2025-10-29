import { CellType, NotebookCell } from './types'

export const getDefaultContent = (type: CellType): string => {
  switch (type) {
    case 'code':
      return '# Write your code here\nprint("Hello, World!")'
    case 'markdown':
      return '# Markdown Cell\n\nWrite your markdown content here...'
    case 'raw':
      return 'Raw text content...'
    default:
      return ''
  }
}

export const createNewCell = (type: CellType): NotebookCell => {
  return {
    id: `cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    content: getDefaultContent(type),
    status: 'idle',
    timestamp: new Date(),
    metadata: {}
  }
}

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success': 
      return { icon: 'CheckCircle', className: 'h-4 w-4 text-green-500' }
    case 'error': 
      return { icon: 'XCircle', className: 'h-4 w-4 text-red-500' }
    case 'running': 
      return { icon: 'RefreshCw', className: 'h-4 w-4 text-blue-500 animate-spin' }
    default: 
      return { icon: 'Clock', className: 'h-4 w-4 text-gray-400' }
  }
}

export const formatExecutionTime = (time: number): string => {
  if (time < 1000) {
    return `${time}ms`
  } else if (time < 60000) {
    return `${(time / 1000).toFixed(1)}s`
  } else {
    return `${(time / 60000).toFixed(1)}m`
  }
}

export const generateNotebookId = (): string => {
  return `notebook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const generateCellId = (): string => {
  return `cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const validateNotebook = (notebook: any): boolean => {
  return (
    notebook &&
    typeof notebook === 'object' &&
    Array.isArray(notebook.cells) &&
    typeof notebook.name === 'string' &&
    typeof notebook.id === 'string'
  )
}

export const exportNotebook = (notebook: any, filename?: string): void => {
  const dataStr = JSON.stringify(notebook, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${notebook.name.replace(/\s+/g, '_')}.ipynb`
  link.click()
  URL.revokeObjectURL(url)
}

export const importNotebook = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedNotebook = JSON.parse(e.target?.result as string)
        if (validateNotebook(importedNotebook)) {
          resolve(importedNotebook)
        } else {
          reject(new Error('Invalid notebook format'))
        }
      } catch (error) {
        reject(new Error('Failed to parse notebook file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    throw error
  }
}

export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
