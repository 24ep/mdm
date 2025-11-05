import React from 'react'
import { computeWidgetStyle, WidgetStyleProps } from './widgetStyles'

interface FilterWidgetProps extends WidgetStyleProps {
  widget: {
    type: string
  }
}

export function FilterWidget({ props, style }: { props: FilterWidgetProps; style: React.CSSProperties }) {
  const filterType = props.widget.type.replace('-filter', '')
  
  return (
    <div className="w-full h-full p-2 flex items-center" style={style}>
      {filterType === 'text' || filterType === 'search' ? (
        <input 
          type="text"
          placeholder={(props as any).placeholder || 'Filter...'}
          className="w-full px-2 py-1 text-xs border-0 bg-gray-100 rounded-[4px]"
        />
      ) : filterType === 'number' ? (
        <input 
          type="number"
          placeholder={(props as any).placeholder || 'Number...'}
          className="w-full px-2 py-1 text-xs border-0 bg-gray-100 rounded-[4px]"
        />
      ) : filterType === 'date' ? (
        <input 
          type="date"
          className="w-full px-2 py-1 text-xs border-0 bg-gray-100 rounded-[4px]"
        />
      ) : filterType === 'dropdown' ? (
        <select 
          className="w-full px-2 py-1 text-xs border-0 bg-gray-100 rounded-[4px]"
        >
          <option>Select...</option>
        </select>
      ) : filterType === 'checkbox' ? (
        <div className="flex items-center gap-2">
          <input type="checkbox" className="w-4 h-4" />
          <span className="text-xs">{(props as any).label || 'Checkbox'}</span>
        </div>
      ) : filterType === 'slider' || filterType === 'range' ? (
        <input 
          type="range"
          min={(props as any).min || 0}
          max={(props as any).max || 100}
          className="w-full"
        />
      ) : (
        <div className="text-xs text-muted-foreground w-full text-center">
          {props.widget.type.replace('-filter', '').replace(/-/g, ' ')}
        </div>
      )}
    </div>
  )
}

