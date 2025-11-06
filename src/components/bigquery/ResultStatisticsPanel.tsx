'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  BarChart3, 
  ChevronDown, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  Hash,
  Calendar,
  Type,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react'
import { statisticsCalculator, ColumnStatistics } from '@/lib/result-statistics'
import { cn } from '@/lib/utils'

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

interface ResultStatisticsPanelProps {
  currentResult: QueryResult | null
  isOpen?: boolean
  onToggle?: () => void
}

export function ResultStatisticsPanel({ 
  currentResult, 
  isOpen = false,
  onToggle 
}: ResultStatisticsPanelProps) {
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set())
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)

  const statistics = useMemo(() => {
    if (!currentResult || !currentResult.results.length) return []
    return statisticsCalculator.calculateStatistics(currentResult.results, currentResult.columns)
  }, [currentResult])

  const toggleColumn = (columnName: string) => {
    const newExpanded = new Set(expandedColumns)
    if (newExpanded.has(columnName)) {
      newExpanded.delete(columnName)
    } else {
      newExpanded.add(columnName)
    }
    setExpandedColumns(newExpanded)
  }

  const getDataTypeIcon = (dataType: ColumnStatistics['dataType']) => {
    switch (dataType) {
      case 'number':
        return <Hash className="h-4 w-4 text-blue-500" />
      case 'date':
        return <Calendar className="h-4 w-4 text-green-500" />
      case 'string':
        return <Type className="h-4 w-4 text-purple-500" />
      case 'boolean':
        return <CheckCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getDataTypeColor = (dataType: ColumnStatistics['dataType']) => {
    switch (dataType) {
      case 'number':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'date':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'string':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'boolean':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (!currentResult || !currentResult.results.length) {
    return null
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm">Column Statistics</CardTitle>
          </div>
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0"
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          {currentResult.results.length} rows analyzed
        </CardDescription>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {statistics.map((stat) => {
                const isExpanded = expandedColumns.has(stat.columnName)
                const isSelected = selectedColumn === stat.columnName

                return (
                  <div
                    key={stat.columnName}
                    className={cn(
                      "border rounded-lg p-3 transition-colors",
                      isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300" : "bg-white dark:bg-gray-900 border-gray-200"
                    )}
                  >
                    {/* Column Header */}
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleColumn(stat.columnName)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        {getDataTypeIcon(stat.dataType)}
                        <span className="font-medium text-sm truncate">{stat.columnName}</span>
                        <Badge variant="outline" className={cn("text-xs", getDataTypeColor(stat.dataType))}>
                          {stat.dataType}
                        </Badge>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-medium">{stat.totalCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Non-null:</span>
                        <span className="font-medium">{stat.nonNullCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Null:</span>
                        <span className="font-medium text-red-600">{stat.nullCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Unique:</span>
                        <span className="font-medium">{stat.uniqueCount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {/* Numeric Statistics */}
                        {stat.dataType === 'number' && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Numeric Statistics</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {stat.min !== undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500 flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    Min:
                                  </span>
                                  <span className="font-medium">{statisticsCalculator.formatStatValue(stat.min, 'number')}</span>
                                </div>
                              )}
                              {stat.max !== undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Max:
                                  </span>
                                  <span className="font-medium">{statisticsCalculator.formatStatValue(stat.max, 'number')}</span>
                                </div>
                              )}
                              {stat.avg !== undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Avg:</span>
                                  <span className="font-medium">{statisticsCalculator.formatStatValue(stat.avg, 'number')}</span>
                                </div>
                              )}
                              {stat.median !== undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Median:</span>
                                  <span className="font-medium">{statisticsCalculator.formatStatValue(stat.median, 'number')}</span>
                                </div>
                              )}
                              {stat.sum !== undefined && (
                                <div className="flex items-center justify-between col-span-2">
                                  <span className="text-gray-500">Sum:</span>
                                  <span className="font-medium">{statisticsCalculator.formatStatValue(stat.sum, 'number')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* String Statistics */}
                        {stat.dataType === 'string' && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">String Statistics</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {stat.minLength !== undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Min Length:</span>
                                  <span className="font-medium">{stat.minLength}</span>
                                </div>
                              )}
                              {stat.maxLength !== undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Max Length:</span>
                                  <span className="font-medium">{stat.maxLength}</span>
                                </div>
                              )}
                              {stat.avgLength !== undefined && (
                                <div className="flex items-center justify-between col-span-2">
                                  <span className="text-gray-500">Avg Length:</span>
                                  <span className="font-medium">{statisticsCalculator.formatStatValue(stat.avgLength, 'number')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Date Statistics */}
                        {stat.dataType === 'date' && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Date Range</div>
                            <div className="space-y-1 text-xs">
                              {stat.minDate && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Earliest:</span>
                                  <span className="font-medium">{statisticsCalculator.formatStatValue(stat.minDate, 'date')}</span>
                                </div>
                              )}
                              {stat.maxDate && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Latest:</span>
                                  <span className="font-medium">{statisticsCalculator.formatStatValue(stat.maxDate, 'date')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Top Values */}
                        {stat.topValues && stat.topValues.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Top Values</div>
                            <div className="space-y-1">
                              {stat.topValues.slice(0, 5).map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-xs p-1 rounded bg-gray-50 dark:bg-gray-800"
                                >
                                  <span className="truncate flex-1 min-w-0">
                                    {statisticsCalculator.formatStatValue(item.value, stat.dataType)}
                                  </span>
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {item.count}
                                  </Badge>
                                </div>
                              ))}
                              {stat.topValues.length > 5 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{stat.topValues.length - 5} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Null Percentage */}
                        {stat.nullCount > 0 && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Null Percentage:</span>
                              <span className="font-medium text-red-600">
                                {((stat.nullCount / stat.totalCount) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-red-500 h-1.5 rounded-full"
                                style={{ width: `${(stat.nullCount / stat.totalCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  )
}

