'use client'

import { cn } from '@/lib/utils'
import { Button } from './button'

interface ColorSwatchProps {
  colors: string[]
  selectedColor: string
  onColorSelect: (color: string) => void
  className?: string
}

const predefinedColors = [
  '#1e40af', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#ca8a04', // Yellow
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#be123c', // Rose
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#0d9488', // Teal
  '#c2410c', // Amber
  '#1f2937', // Gray
  '#374151', // Dark Gray
  '#6b7280', // Light Gray
  '#9ca3af', // Very Light Gray
]

export function ColorSwatch({ 
  colors = predefinedColors, 
  selectedColor, 
  onColorSelect, 
  className 
}: ColorSwatchProps) {
  return (
    <div className={cn('grid grid-cols-8 gap-2', className)}>
      {colors.map((color) => (
        <Button
          key={color}
          variant="outline"
          size="sm"
          className={cn(
            'w-8 h-8 p-0 border-2 rounded-md transition-all hover:scale-110',
            selectedColor === color 
              ? 'border-primary ring-2 ring-primary/20' 
              : 'border-border hover:border-primary/50'
          )}
          style={{ backgroundColor: color }}
          onClick={() => onColorSelect(color)}
          title={color}
        >
          {selectedColor === color && (
            <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
          )}
        </Button>
      ))}
    </div>
  )
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  className?: string
}

export function ColorPicker({ value, onChange, label, className }: ColorPickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 border border-border rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 border border-border rounded text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}
