'use client'

import { Button } from '@/components/ui/button'
import { Timer, HardDrive } from 'lucide-react'

interface QueryResult {
  id: string
  query: string
  results: any[]
  columns: string[]
  status: 'success' | 'error' | 'running'
  executionTime?: number
  timestamp: Date
  spaceName?: string
  userId?: string
  userName?: string
  size?: number
}

interface StatusIndicatorsProps {
  currentResult: QueryResult | null
  footerHeight: number
  formatDuration: (ms: number) => string
  formatBytes: (bytes: number) => string
  setFooterHeight: (height: number) => void
}

export function StatusIndicators({
  currentResult,
  footerHeight,
  formatDuration,
  formatBytes,
  setFooterHeight
}: StatusIndicatorsProps) {
  return (
    <div className="flex items-center gap-2">
      {currentResult && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{currentResult.results.length} rows</span>
          {currentResult.executionTime && (
            <span>• {formatDuration(currentResult.executionTime)}</span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Height: {Math.round(footerHeight)}px</span>
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 px-2 text-xs"
            onClick={() => setFooterHeight(200)}
            title="Small (200px)"
          >
            S
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 px-2 text-xs"
            onClick={() => setFooterHeight(400)}
            title="Medium (400px)"
          >
            M
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 px-2 text-xs"
            onClick={() => setFooterHeight(600)}
            title="Large (600px)"
          >
            L
          </Button>
        </div>
      </div>
    </div>
  )
}
