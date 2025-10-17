import { useState, useCallback, useEffect } from 'react'
import { DashboardElement } from './useDashboardState'

export interface Filter {
  id: string
  sourceElementId: string
  field: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'BETWEEN'
  value: any
  timestamp: string
  isActive: boolean
}

export interface FilterInteraction {
  elementId: string
  field: string
  value: any
  interactionType: 'click' | 'select' | 'range' | 'drilldown'
  timestamp: string
}

export interface CrossFilterConfig {
  enabled: boolean
  propagateTo: string[] // Element IDs that should receive this filter
  receiveFrom: string[] // Element IDs that can send filters to this element
}

export const useInteractiveFiltering = () => {
  const [activeFilters, setActiveFilters] = useState<Record<string, Filter>>({})
  const [filterHistory, setFilterHistory] = useState<Filter[]>([])
  const [crossFilterConfigs, setCrossFilterConfigs] = useState<Record<string, CrossFilterConfig>>({})

  // Add a new filter
  const addFilter = useCallback((filter: Omit<Filter, 'id' | 'timestamp'>) => {
    const newFilter: Filter = {
      ...filter,
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }

    setActiveFilters(prev => ({
      ...prev,
      [newFilter.id]: newFilter
    }))

    setFilterHistory(prev => [newFilter, ...prev.slice(0, 49)]) // Keep last 50 filters
  }, [])

  // Remove a specific filter
  const removeFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[filterId]
      return newFilters
    })
  }, [])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters({})
  }, [])

  // Clear filters from a specific element
  const clearFiltersFromElement = useCallback((elementId: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      Object.keys(newFilters).forEach(filterId => {
        if (newFilters[filterId].sourceElementId === elementId) {
          delete newFilters[filterId]
        }
      })
      return newFilters
    })
  }, [])

  // Toggle filter active state
  const toggleFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: {
        ...prev[filterId],
        isActive: !prev[filterId].isActive
      }
    }))
  }, [])

  // Handle chart interaction (click, select, etc.)
  const handleChartInteraction = useCallback((
    elementId: string,
    interaction: FilterInteraction
  ) => {
    const config = crossFilterConfigs[elementId]
    if (!config?.enabled) return

    // Create filter from interaction
    const filter: Omit<Filter, 'id' | 'timestamp'> = {
      sourceElementId: elementId,
      field: interaction.field,
      operator: '=',
      value: interaction.value,
      isActive: true
    }

    // Add filter to source element
    addFilter(filter)

    // Propagate to configured elements
    config.propagateTo.forEach(targetElementId => {
      const targetConfig = crossFilterConfigs[targetElementId]
      if (targetConfig?.enabled && targetConfig.receiveFrom.includes(elementId)) {
        addFilter({
          ...filter,
          sourceElementId: elementId
        })
      }
    })
  }, [crossFilterConfigs, addFilter])

  // Apply filters to data
  const applyFiltersToData = useCallback((data: any[], elementId: string): any[] => {
    const elementFilters = Object.values(activeFilters).filter(
      filter => filter.isActive && filter.sourceElementId !== elementId
    )

    if (elementFilters.length === 0) return data

    return data.filter(row => {
      return elementFilters.every(filter => {
        const rowValue = row[filter.field]
        if (rowValue === undefined || rowValue === null) return false

        switch (filter.operator) {
          case '=':
            return rowValue === filter.value
          case '!=':
            return rowValue !== filter.value
          case '>':
            return rowValue > filter.value
          case '<':
            return rowValue < filter.value
          case '>=':
            return rowValue >= filter.value
          case '<=':
            return rowValue <= filter.value
          case 'LIKE':
            return String(rowValue).toLowerCase().includes(String(filter.value).toLowerCase())
          case 'IN':
            return Array.isArray(filter.value) && filter.value.includes(rowValue)
          case 'BETWEEN':
            return Array.isArray(filter.value) && 
                   filter.value.length === 2 && 
                   rowValue >= filter.value[0] && 
                   rowValue <= filter.value[1]
          default:
            return true
        }
      })
    })
  }, [activeFilters])

  // Configure cross-filtering for an element
  const configureCrossFiltering = useCallback((
    elementId: string,
    config: CrossFilterConfig
  ) => {
    setCrossFilterConfigs(prev => ({
      ...prev,
      [elementId]: config
    }))
  }, [])

  // Get filters affecting a specific element
  const getFiltersForElement = useCallback((elementId: string): Filter[] => {
    return Object.values(activeFilters).filter(
      filter => filter.isActive && filter.sourceElementId !== elementId
    )
  }, [activeFilters])

  // Get filter statistics
  const getFilterStats = useCallback(() => {
    const totalFilters = Object.keys(activeFilters).length
    const activeFilterCount = Object.values(activeFilters).filter(f => f.isActive).length
    const elementsWithFilters = new Set(Object.values(activeFilters).map(f => f.sourceElementId)).size

    return {
      totalFilters,
      activeFilterCount,
      elementsWithFilters,
      filterHistory: filterHistory.length
    }
  }, [activeFilters, filterHistory])

  // Export filter configuration
  const exportFilterConfig = useCallback(() => {
    return {
      activeFilters,
      crossFilterConfigs,
      exportDate: new Date().toISOString()
    }
  }, [activeFilters, crossFilterConfigs])

  // Import filter configuration
  const importFilterConfig = useCallback((config: any) => {
    if (config.activeFilters) {
      setActiveFilters(config.activeFilters)
    }
    if (config.crossFilterConfigs) {
      setCrossFilterConfigs(config.crossFilterConfigs)
    }
  }, [])

  // Reset all filtering
  const resetFiltering = useCallback(() => {
    setActiveFilters({})
    setFilterHistory([])
    setCrossFilterConfigs({})
  }, [])

  return {
    // State
    activeFilters,
    filterHistory,
    crossFilterConfigs,

    // Actions
    addFilter,
    removeFilter,
    clearAllFilters,
    clearFiltersFromElement,
    toggleFilter,
    handleChartInteraction,
    applyFiltersToData,
    configureCrossFiltering,

    // Utilities
    getFiltersForElement,
    getFilterStats,
    exportFilterConfig,
    importFilterConfig,
    resetFiltering
  }
}
