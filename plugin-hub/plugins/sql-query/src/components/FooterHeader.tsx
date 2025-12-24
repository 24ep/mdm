'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, History, BarChart3 } from 'lucide-react'
import { StatusIndicators } from './StatusIndicators'

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

interface FooterHeaderProps {
  footerTab: 'results' | 'history' | 'visualization'
  onFooterTabChange: (tab: 'results' | 'history' | 'visualization') => void
  currentResult: QueryResult | null
  footerHeight: number
  formatDuration: (ms: number) => string
  formatBytes: (bytes: number) => string
  setFooterHeight: (height: number) => void
}

export function FooterHeader({
  footerTab,
  onFooterTabChange,
  currentResult,
  footerHeight,
  formatDuration,
  formatBytes,
  setFooterHeight
}: FooterHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-4">
        <Tabs value={footerTab} onValueChange={(value) => onFooterTabChange(value as any)}>
          <TabsList className="flex gap-1">
            <TabsTrigger value="results" className="flex items-center gap-2 px-3 py-1 text-sm">
              <Table className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 px-3 py-1 text-sm">
              <History className="h-4 w-4" />
              Query history
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2 px-3 py-1 text-sm">
              <BarChart3 className="h-4 w-4" />
              Visualization
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <StatusIndicators
        currentResult={currentResult}
        footerHeight={footerHeight}
        formatDuration={formatDuration}
        formatBytes={formatBytes}
        setFooterHeight={setFooterHeight}
      />
    </div>
  )
}
