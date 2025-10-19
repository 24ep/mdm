import React from 'react'
import { cn } from '@/lib/utils'
import { SCROLLABLE_HEIGHTS, type ScrollableHeight } from '@/lib/constants'

interface ScrollableListProps {
  children: React.ReactNode
  maxHeight?: ScrollableHeight | string
  className?: string
  listClassName?: string
  showScrollbar?: boolean
  bordered?: boolean
  padded?: boolean
}

export function ScrollableList({ 
  children, 
  maxHeight = 'MEDIUM',
  className = "",
  listClassName = "",
  showScrollbar = true,
  bordered = true,
  padded = true
}: ScrollableListProps) {
  const heightClass = typeof maxHeight === 'string' && maxHeight in SCROLLABLE_HEIGHTS 
    ? SCROLLABLE_HEIGHTS[maxHeight as ScrollableHeight]
    : maxHeight

  return (
    <div 
      className={cn(
        "overflow-y-auto scrollbar-custom",
        heightClass,
        !showScrollbar && "scrollbar-hide",
        bordered && "border rounded-lg",
        padded && "p-4",
        className
      )}
    >
      <div className={cn("space-y-2", listClassName)}>
        {children}
      </div>
    </div>
  )
}
