import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Filter, X } from 'lucide-react'

interface ActiveFilter {
  id: string
  sourceElementId: string
  field: string
  operator: string
  value: any
  timestamp: string
}

interface FilterPanelProps {
  activeFilters: Record<string, ActiveFilter>
  dashboardElements: any[]
  onRemoveFilter: (filterId: string) => void
  onClearAllFilters: () => void
}

export function FilterPanel({ activeFilters, dashboardElements, onRemoveFilter, onClearAllFilters }: FilterPanelProps) {
  const filterCount = Object.keys(activeFilters).length

  if (filterCount === 0) {
    return null
  }

  const getElementName = (elementId: string) => {
    const element = dashboardElements.find(el => el.id === elementId)
    return element?.name || 'Unknown Element'
  }

  const getOperatorDisplay = (operator: string) => {
    switch (operator) {
      case '=': return 'equals'
      case '!=': return 'not equals'
      case '>': return 'greater than'
      case '<': return 'less than'
      case '>=': return 'greater than or equal'
      case '<=': return 'less than or equal'
      case 'LIKE': return 'contains'
      case 'IN': return 'in'
      case 'BETWEEN': return 'between'
      default: return operator
    }
  }

  const formatFilterValue = (value: any, operator: string) => {
    if (operator === 'BETWEEN' && Array.isArray(value)) {
      return `${value[0]} - ${value[1]}`
    }
    if (operator === 'IN' && Array.isArray(value)) {
      return value.join(', ')
    }
    return String(value)
  }

  return (
    <div className="w-64 bg-background border-l flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Active Filters</h3>
          <Badge variant="secondary">{filterCount}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{filterCount} filter(s) applied</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Object.values(activeFilters).map((filter) => (
          <div key={filter.id} className="p-3 border rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{filter.field}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFilter(filter.id)}
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <span>{getOperatorDisplay(filter.operator)}</span>
                <span className="font-medium text-foreground">
                  {formatFilterValue(filter.value, filter.operator)}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <span>From:</span>
                <span className="font-medium text-foreground">
                  {getElementName(filter.sourceElementId)}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Applied: {new Date(filter.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAllFilters}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      </div>
    </div>
  )
}
