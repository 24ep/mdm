'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Settings2 } from 'lucide-react'

// Utility functions
function extractNumericValue(value: string | number | undefined): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'number') return String(value)
  const v = String(value).trim()
  if (v === '') return ''
  const match = v.match(/^-?\d+(\.\d+)?/)
  return match ? match[0] : ''
}

function ensurePx(value: string | number): string {
  if (value == null) return ''
  const v = String(value).trim()
  if (v === '') return ''
  if (/px|%|rem|em|vh|vw$/i.test(v)) return v
  if (/^-?\d+(\.\d+)?$/.test(v)) return `${v}px`
  return v
}

// Generic value getter/setter types
type ValueGetter<T> = (key: string) => string | number | undefined
type ValueSetter<T> = (updates: Record<string, any>) => void

interface MultiSideInputProps<T = any> {
  label: string
  baseKey: string
  defaultValue?: string | number
  type?: 'sides' | 'corners'
  getValue: ValueGetter<T>
  setValue: ValueSetter<T>
  disabled?: boolean
  className?: string
  inputClassName?: string
}

export function MultiSideInput<T = any>({
  label,
  baseKey,
  defaultValue = 0,
  type = 'sides',
  getValue,
  setValue,
  disabled = false,
  className = '',
  inputClassName = '',
}: MultiSideInputProps<T>) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  
  const getNumericValue = (side: string) => {
    const value = getValue(side)
    return extractNumericValue(value as string | number | undefined)
  }
  
  let values: string[]
  let labels: string[]
  let allSame: boolean
  let displayValue: string
  
  if (type === 'sides') {
    const top = getNumericValue('top')
    const right = getNumericValue('right')
    const bottom = getNumericValue('bottom')
    const left = getNumericValue('left')
    values = [top, right, bottom, left]
    labels = ['Top', 'Right', 'Bottom', 'Left']
    allSame = top === right && right === bottom && bottom === left
    displayValue = allSame ? top : `${top}, ${right}, ${bottom}, ${left}`
  } else {
    // corners
    const topLeft = getNumericValue('topLeft')
    const topRight = getNumericValue('topRight')
    const bottomRight = getNumericValue('bottomRight')
    const bottomLeft = getNumericValue('bottomLeft')
    values = [topLeft, topRight, bottomRight, bottomLeft]
    labels = ['Top Left', 'Top Right', 'Bottom Right', 'Bottom Left']
    allSame = topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft
    displayValue = allSame ? topLeft : `${topLeft}, ${topRight}, ${bottomRight}, ${bottomLeft}`
  }
  
  const handleUnifiedChange = (value: string) => {
    const paddedValue = ensurePx(value)
    const updates: Record<string, any> = { [baseKey]: paddedValue }
    
    if (type === 'sides') {
      updates[`${baseKey}Top`] = paddedValue
      updates[`${baseKey}Right`] = paddedValue
      updates[`${baseKey}Bottom`] = paddedValue
      updates[`${baseKey}Left`] = paddedValue
    } else {
      updates[`${baseKey}TopLeft`] = paddedValue
      updates[`${baseKey}TopRight`] = paddedValue
      updates[`${baseKey}BottomRight`] = paddedValue
      updates[`${baseKey}BottomLeft`] = paddedValue
    }
    
    setValue(updates)
  }
  
  const handleSideChange = (side: string, value: string) => {
    const key = `${baseKey}${side.charAt(0).toUpperCase() + side.slice(1)}`
    const paddedValue = ensurePx(value)
    setValue({ [key]: paddedValue })
  }
  
  const parseMultiValue = (value: string) => {
    const values = value.split(',').map(v => v.trim())
    if (values.length === 4) {
      const updates: Record<string, any> = {}
      if (type === 'sides') {
        updates[`${baseKey}Top`] = ensurePx(values[0])
        updates[`${baseKey}Right`] = ensurePx(values[1])
        updates[`${baseKey}Bottom`] = ensurePx(values[2])
        updates[`${baseKey}Left`] = ensurePx(values[3])
      } else {
        updates[`${baseKey}TopLeft`] = ensurePx(values[0])
        updates[`${baseKey}TopRight`] = ensurePx(values[1])
        updates[`${baseKey}BottomRight`] = ensurePx(values[2])
        updates[`${baseKey}BottomLeft`] = ensurePx(values[3])
      }
      setValue(updates)
    }
  }
  
  const defaultDisplay = typeof defaultValue === 'number' 
    ? String(defaultValue) 
    : extractNumericValue(String(defaultValue))
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className={disabled ? 'opacity-50' : ''}>{label}</Label>
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          onChange={(e) => {
            // If it's a single number, apply to all sides/corners
            if (/^\d+(\.\d+)?$/.test(e.target.value)) {
              handleUnifiedChange(e.target.value)
            } else if (/^\d+(\.\d+)?,\s*\d+(\.\d+)?,\s*\d+(\.\d+)?,\s*\d+(\.\d+)?$/.test(e.target.value)) {
              parseMultiValue(e.target.value)
            }
          }}
          placeholder={allSame ? defaultDisplay : "20, 30, 20, 10"}
          className={`pr-20 ${inputClassName}`}
          disabled={disabled}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">px</span>
          <span className="text-[10px] text-muted-foreground">|</span>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-transparent"
                onClick={(e) => e.stopPropagation()}
                disabled={disabled}
              >
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-64 p-4" 
              align="start"
              style={{ width: '16rem', minWidth: '16rem', maxWidth: '16rem' }}
            >
              <div className="space-y-4">
                <div className="text-sm font-medium mb-3">Individual {type === 'sides' ? 'Sides' : 'Corners'}</div>
                <div className="grid grid-cols-2 gap-3">
                  {labels.map((label, index) => {
                    const side = type === 'sides' 
                      ? ['top', 'right', 'bottom', 'left'][index]
                      : ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]
                    return (
                      <div key={side} className="space-y-2">
                        <Label className="text-xs">{label}</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={values[index]}
                            onChange={(e) => handleSideChange(side, e.target.value)}
                            placeholder={defaultDisplay}
                            className="pr-8"
                            disabled={disabled}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}

