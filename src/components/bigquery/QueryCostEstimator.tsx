'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Database, Zap, AlertCircle } from 'lucide-react'

interface CostEstimate {
  bytesProcessed: number
  estimatedCost: number
  estimatedRows: number
  tablesScanned: string[]
  cacheHit: boolean
}

interface QueryCostEstimatorProps {
  query: string
  isVisible: boolean
}

export function QueryCostEstimator({ query, isVisible }: QueryCostEstimatorProps) {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)

  useEffect(() => {
    if (!query || !query.trim() || !isVisible) {
      setEstimate(null)
      return
    }

    setIsEstimating(true)
    
    // Simulate cost estimation (in real implementation, this would call an API)
    const timer = setTimeout(() => {
      const mockEstimate = estimateQueryCost(query)
      setEstimate(mockEstimate)
      setIsEstimating(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [query, isVisible])

  const estimateQueryCost = (sql: string): CostEstimate => {
    // Mock estimation logic
    // In production, this would analyze the query, check table sizes, etc.
    
    const queryUpper = sql.toUpperCase()
    const tablesScanned: string[] = []
    
    // Extract table names from query
    const fromMatches = sql.match(/FROM\s+`?(\w+\.\w+\.\w+)`?/gi) || []
    const joinMatches = sql.match(/JOIN\s+`?(\w+\.\w+\.\w+)`?/gi) || []
    
    fromMatches.forEach(m => {
      const table = m.replace(/FROM\s+`?/i, '').replace(/`/g, '')
      if (table && !tablesScanned.includes(table)) {
        tablesScanned.push(table)
      }
    })
    
    joinMatches.forEach(m => {
      const table = m.replace(/JOIN\s+`?/i, '').replace(/`/g, '')
      if (table && !tablesScanned.includes(table)) {
        tablesScanned.push(table)
      }
    })

    // Mock calculations
    const baseBytes = 1000000 // 1MB base
    const bytesPerTable = 50000000 // 50MB per table
    const bytesProcessed = baseBytes + (tablesScanned.length * bytesPerTable)
    
    // BigQuery pricing: $5 per TB ($0.005 per GB)
    const estimatedCost = (bytesProcessed / (1024 ** 4)) * 5
    
    // Estimate rows (rough calculation)
    const estimatedRows = Math.floor(bytesProcessed / 1000) // ~1KB per row
    
    // Check if query might hit cache (simplified)
    const cacheHit = queryUpper.includes('LIMIT') && queryUpper.includes('WHERE')

    return {
      bytesProcessed,
      estimatedCost,
      estimatedRows,
      tablesScanned,
      cacheHit
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatCost = (cost: number): string => {
    if (cost < 0.001) {
      return `$${(cost * 1000).toFixed(3)} (millicents)`
    }
    return `$${cost.toFixed(4)}`
  }

  if (!isVisible || !query.trim()) {
    return null
  }

  if (isEstimating) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Zap className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Estimating query cost...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!estimate) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Cost Estimation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Bytes Processed</p>
            <p className="text-sm font-medium">{formatBytes(estimate.bytesProcessed)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Estimated Cost</p>
            <p className="text-sm font-medium text-green-600">{formatCost(estimate.estimatedCost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Estimated Rows</p>
            <p className="text-sm font-medium">{estimate.estimatedRows.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Tables Scanned</p>
            <p className="text-sm font-medium">{estimate.tablesScanned.length}</p>
          </div>
        </div>

        {estimate.tablesScanned.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-2">Tables:</p>
            <div className="flex flex-wrap gap-1">
              {estimate.tablesScanned.map((table, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {table}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {estimate.cacheHit && (
          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
            <Zap className="h-3 w-3" />
            <span>Query may benefit from result caching</span>
          </div>
        )}

        {estimate.estimatedCost > 0.1 && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 p-2 rounded">
            <AlertCircle className="h-3 w-3" />
            <span>High cost query - consider adding filters or LIMIT clause</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

