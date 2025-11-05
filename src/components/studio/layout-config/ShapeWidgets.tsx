import React from 'react'
import { computeWidgetStyle, WidgetStyleProps } from './widgetStyles'

interface ShapeWidgetProps extends WidgetStyleProps {
  widget: {
    type: string
    width?: number
    height?: number
  }
}

export function RectangleWidget({ props, style }: { props: ShapeWidgetProps; style: React.CSSProperties }) {
  return (
    <div 
      className="w-full h-full"
      style={style}
    />
  )
}

export function CircleWidget({ props, style }: { props: ShapeWidgetProps; style: React.CSSProperties }) {
  return (
    <div 
      className="w-full h-full rounded-full"
      style={style}
    />
  )
}

export function TriangleWidget({ props, style }: { props: ShapeWidgetProps; style: React.CSSProperties }) {
  const size = Math.min(props.widget.width || 200, props.widget.height || 200)
  return (
    <div className="w-full h-full flex items-center justify-center" style={style}>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${props.backgroundColor || '#e5e7eb'}`,
        }}
      />
    </div>
  )
}

export function HexagonWidget({ props, style }: { props: ShapeWidgetProps; style: React.CSSProperties }) {
  const size = Math.min(props.widget.width || 200, props.widget.height || 200)
  return (
    <div className="w-full h-full flex items-center justify-center" style={style}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon
          points="50,5 95,25 95,75 50,95 5,75 5,25"
          fill={props.backgroundColor || '#e5e7eb'}
          stroke={props.borderColor || '#d1d5db'}
          strokeWidth={props.borderWidth || 1}
        />
      </svg>
    </div>
  )
}

export function DividerWidget({ props, style }: { props: ShapeWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full flex items-center justify-center" style={style}>
      <div 
        className="w-full"
        style={{
          height: (props as any).thickness ? `${(props as any).thickness}px` : '1px',
          backgroundColor: (props as any).color || props.borderColor || '#e5e7eb',
        }}
      />
    </div>
  )
}

export function SpacerWidget({ props, style }: { props: ShapeWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full" style={style} />
  )
}

export function GenericShapeWidget({ props, style }: { props: ShapeWidgetProps; style: React.CSSProperties }) {
  const shapeType = (props as any).shapeType || 'rectangle'
  
  if (shapeType === 'rectangle' || !shapeType) {
    return <RectangleWidget props={props} style={style} />
  }
  
  if (shapeType === 'circle') {
    return <CircleWidget props={props} style={style} />
  }
  
  if (shapeType === 'triangle') {
    return <TriangleWidget props={props} style={style} />
  }
  
  if (shapeType === 'hexagon') {
    return <HexagonWidget props={props} style={style} />
  }
  
  // Default to rectangle
  return <RectangleWidget props={props} style={style} />
}

