import React from 'react'
import { Plus, X, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, Hash, Type as TypeIcon } from 'lucide-react'
import { Attribute } from './chartDataSourceTypes'
import { getAttributeIcon, getTypeBadgeClass, getEffectiveType } from './chartDataSourceUtils'
import { AggregationType } from './ChartDataSourceConfig'

interface AttributeDropZoneProps {
  dimKey: string
  dimLabel: string
  required?: boolean
  isMultiple: boolean
  values: string[]
  singleValue: string
  attributes: Attribute[]
  selectedModelId?: string
  loading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onAttributeSelect: (dimKey: string, attrName: string) => void
  onDimensionValueChange: (dimKey: string, value: string) => void
  attributeTypeOverrides: Record<string, Record<string, string>>
  onTypeOverride: (dimKey: string, attrName: string, nextType: string) => void
  isValueMetric?: boolean
  attributeAggregations?: Record<string, AggregationType>
  onAggregationChange?: (dimKey: string, attrName: string, aggregation: AggregationType) => void
  dragOverDimensions: Set<string>
  draggingBadge: { dimKey: string; index: number } | null
  dragOverBadge: { dimKey: string; index: number } | null
  onDragStart: (dimKey: string, index: number) => void
  onDragOver: (dimKey: string, index: number) => void
  onDragLeave: () => void
  onDrop: (dimKey: string, fromIndex: number, toIndex: number) => void
  onDragEnd: () => void
  onDragOverZone: (e: React.DragEvent, dimKey: string) => void
  onDragLeaveZone: (e: React.DragEvent, dimKey: string) => void
  onDropZone: (e: React.DragEvent, dimKey: string) => void
  openCombobox: boolean
  onOpenChange: (open: boolean) => void
}

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'SUM', label: 'Sum' },
  { value: 'AVG', label: 'Avg' },
  { value: 'COUNT', label: 'Count' },
  { value: 'COUNT_DISTINCT', label: 'Count Distinct' },
  { value: 'MIN', label: 'Min' },
  { value: 'MAX', label: 'Max' },
  { value: 'NONE', label: 'None' },
]

export function AttributeDropZone({
  dimKey,
  dimLabel,
  required,
  isMultiple,
  values,
  singleValue,
  attributes,
  selectedModelId,
  loading,
  searchQuery,
  onSearchChange,
  onAttributeSelect,
  onDimensionValueChange,
  attributeTypeOverrides,
  onTypeOverride,
  isValueMetric = false,
  attributeAggregations = {},
  onAggregationChange,
  dragOverDimensions,
  draggingBadge,
  dragOverBadge,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onDragOverZone,
  onDragLeaveZone,
  onDropZone,
  openCombobox,
  onOpenChange,
}: AttributeDropZoneProps) {
  const getFilteredAttributes = () => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return attributes
    
    return attributes.filter(attr => 
      (attr.name?.toLowerCase() || '').includes(query) ||
      (attr.display_name?.toLowerCase() || '').includes(query)
    )
  }

  if (isMultiple) {
    return (
      <div className="space-y-2">
        <Popover open={openCombobox} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <div
              className={`min-h-[60px] border-2 border-dashed rounded p-2 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                dragOverDimensions.has(dimKey)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const types = Array.from(e.dataTransfer.types)
                if (types.includes('application/json')) {
                  onDragOverZone(e, dimKey)
                }
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDragLeaveZone(e, dimKey)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const data = e.dataTransfer.getData('application/json')
                if (data) {
                  onDropZone(e, dimKey)
                }
              }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('[data-attribute-badge]')) {
                  e.stopPropagation()
                }
              }}
            >
              {values.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {values.map((attrName, badgeIndex) => {
                    const attr = attributes.find(a => a.name === attrName)
                    const effectiveType = getEffectiveType(dimKey, attr, attributeTypeOverrides)
                    const Icon = attr ? getAttributeIcon(effectiveType) : TypeIcon
                    const isDragging = draggingBadge?.dimKey === dimKey && draggingBadge?.index === badgeIndex
                    const isDragOver = dragOverBadge?.dimKey === dimKey && dragOverBadge?.index === badgeIndex
                    return (
                      <div
                        key={`${attrName}-${badgeIndex}`}
                        data-attribute-badge
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', '')
                          onDragStart(dimKey, badgeIndex)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.dataTransfer.dropEffect = 'move'
                          if (!isDragOver) {
                            onDragOver(dimKey, badgeIndex)
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (isDragOver) {
                            onDragLeave()
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (draggingBadge && draggingBadge.dimKey === dimKey && draggingBadge.index !== badgeIndex) {
                            onDrop(dimKey, draggingBadge.index, badgeIndex)
                          }
                          onDragEnd()
                        }}
                        onDragEnd={onDragEnd}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs pointer-events-auto cursor-move transition-all w-full ${
                          isDragging ? 'opacity-50 scale-95' : ''
                        } ${
                          isDragOver ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {attr && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="p-0.5 rounded hover:bg-blue-200/60 dark:hover:bg-blue-900/50"
                                title="Change attribute type"
                              >
                                <Icon className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="z-[10000] min-w-[220px] w-auto p-1" align="start" sideOffset={6}>
                              <div className="flex flex-col gap-1">
                                {[
                                  { key: 'text', label: 'Text', Icon: TypeIcon },
                                  { key: 'number', label: 'Number', Icon: Hash },
                                  { key: 'date', label: 'Date', Icon: CalendarIcon },
                                ].map(opt => (
                                  <button
                                    key={opt.key}
                                    className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground text-xs ${getTypeBadgeClass(opt.key)}`}
                                    onClick={() => onTypeOverride(dimKey, attr.name, opt.key)}
                                  >
                                    <opt.Icon className="h-3.5 w-3.5" />
                                    <span>{opt.label}</span>
                                    {effectiveType === opt.key && <Check className="ml-auto h-3.5 w-3.5" />}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                        <span className="truncate flex-1">
                          {attr?.display_name || attrName}
                          {isValueMetric && attributeAggregations[attrName] && (
                            <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                              ({AGGREGATION_OPTIONS.find(o => o.value === attributeAggregations[attrName])?.label || attributeAggregations[attrName]})
                            </span>
                          )}
                        </span>
                        {isValueMetric && attributeAggregations[attrName] && onAggregationChange && (
                          <Select
                            value={attributeAggregations[attrName]}
                            onValueChange={(value) => onAggregationChange(dimKey, attrName, value as AggregationType)}
                            onOpenChange={(open) => {
                              if (open) {
                                // Stop propagation when opening aggregation selector
                              }
                            }}
                          >
                            <SelectTrigger 
                              className="h-5 w-24 text-[10px] px-1.5 ml-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[10001]" onClick={(e) => e.stopPropagation()}>
                              {AGGREGATION_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onAttributeSelect(dimKey, attrName)
                          }}
                          className="ml-0.5 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5 transition-colors"
                          title="Remove attribute"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground pointer-events-none">
                <Plus className="h-3.5 w-3.5" />
                <span>{selectedModelId ? 'Click anywhere to add attribute or drag here' : 'Select a data model first'}</span>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="z-[10000] w-[300px] p-0" align="start">
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search attributes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border rounded outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {loading ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading attributes...</div>
              ) : (
                <>
                  {getFilteredAttributes().filter(attr => !values.includes(attr.name)).length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                      {attributes.length === 0 
                        ? (selectedModelId 
                            ? 'No attributes available for this data model' 
                            : 'Please select a data model first')
                        : 'No attributes match your search'}
                    </div>
                  ) : (
                    <div className="p-1">
                      {getFilteredAttributes()
                        .filter(attr => !values.includes(attr.name))
                        .map(attr => {
                          const Icon = getAttributeIcon(attr.type)
                          return (
                            <button
                              key={attr.id}
                              type="button"
                              onClick={() => {
                                onAttributeSelect(dimKey, attr.name)
                                onOpenChange(false)
                                onSearchChange('')
                              }}
                              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate text-gray-900 dark:text-gray-100">
                                  {attr.display_name || attr.name}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Popover open={openCombobox} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <div
            className={`min-h-[60px] border-2 border-dashed rounded p-2 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
              dragOverDimensions.has(dimKey)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const types = Array.from(e.dataTransfer.types)
              if (types.includes('application/json')) {
                onDragOverZone(e, dimKey)
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDragLeaveZone(e, dimKey)
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const data = e.dataTransfer.getData('application/json')
              if (data) {
                onDropZone(e, dimKey)
              }
            }}
          >
            {singleValue ? (
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const attr = attributes.find(a => a.name === singleValue)
                  const effectiveType = getEffectiveType(dimKey, attr, attributeTypeOverrides)
                  const Icon = attr ? getAttributeIcon(effectiveType) : TypeIcon
                  return (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs w-full" data-attribute-badge>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-blue-200/60 dark:hover:bg-blue-900/50"
                            title="Change attribute type"
                          >
                            <Icon className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="z-[10000] min-w-[220px] w-auto p-1" align="start" sideOffset={6}>
                          <div className="flex flex-col gap-1">
                            {[
                              { key: 'text', label: 'Text', Icon: TypeIcon },
                              { key: 'number', label: 'Number', Icon: Hash },
                              { key: 'date', label: 'Date', Icon: CalendarIcon },
                            ].map(opt => (
                              <button
                                key={opt.key}
                                className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground text-xs ${getTypeBadgeClass(opt.key)}`}
                                onClick={() => onTypeOverride(dimKey, attr?.name || singleValue, opt.key)}
                              >
                                <opt.Icon className="h-3.5 w-3.5" />
                                <span>{opt.label}</span>
                                {effectiveType === opt.key && <Check className="ml-auto h-3.5 w-3.5" />}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <span className="truncate flex-1">
                        {attr?.display_name || singleValue}
                        {isValueMetric && attributeAggregations[singleValue] && (
                          <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                            ({AGGREGATION_OPTIONS.find(o => o.value === attributeAggregations[singleValue])?.label || attributeAggregations[singleValue]})
                          </span>
                        )}
                      </span>
                      {isValueMetric && attributeAggregations[singleValue] && onAggregationChange && (
                        <Select
                          value={attributeAggregations[singleValue]}
                          onValueChange={(value) => onAggregationChange(dimKey, singleValue, value as AggregationType)}
                        >
                          <SelectTrigger 
                            className="h-5 w-24 text-[10px] px-1.5 ml-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]" onClick={(e) => e.stopPropagation()}>
                            {AGGREGATION_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDimensionValueChange(dimKey, '')
                        }}
                        className="ml-0.5 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded p-0.5 transition-colors"
                        title="Remove attribute"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })()}
              </div>
            ) : null}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pointer-events-none">
              <Plus className="h-3.5 w-3.5" />
              <span>{selectedModelId ? (singleValue ? 'Click to change attribute or drag here' : 'Click to select attribute or drag here') : 'Select a data model first'}</span>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="z-[10000] w-[300px] p-0" align="start">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search attributes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border rounded outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {loading ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading attributes...</div>
            ) : (
              <>
                {getFilteredAttributes().length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                    {attributes.length === 0 
                      ? (selectedModelId 
                          ? 'No attributes available for this data model' 
                          : 'Please select a data model first')
                      : 'No attributes match your search'}
                  </div>
                ) : (
                  <div className="p-1">
                    {getFilteredAttributes().map(attr => {
                      const Icon = getAttributeIcon(attr.type)
                      return (
                        <button
                          key={attr.id}
                          type="button"
                          onClick={() => {
                            onDimensionValueChange(dimKey, attr.name)
                            onOpenChange(false)
                            onSearchChange('')
                          }}
                          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate text-gray-900 dark:text-gray-100">
                              {attr.display_name || attr.name}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

