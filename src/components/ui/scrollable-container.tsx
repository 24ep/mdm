import React from 'react'
import { cn } from '@/lib/utils'
import { SCROLLABLE_HEIGHTS, type ScrollableHeight } from '@/lib/constants'

interface ScrollableContainerProps {
  children: React.ReactNode
  maxHeight?: ScrollableHeight | string
  className?: string
  showScrollbar?: boolean
}

export function ScrollableContainer({ 
  children, 
  maxHeight = 'MEDIUM',
  className = "",
  showScrollbar = true
}: ScrollableContainerProps) {
  const heightClass = typeof maxHeight === 'string' && maxHeight in SCROLLABLE_HEIGHTS 
    ? SCROLLABLE_HEIGHTS[maxHeight as ScrollableHeight]
    : maxHeight

  return (
    <div 
      className={cn(
        "overflow-y-auto scrollbar-custom",
        heightClass,
        !showScrollbar && "scrollbar-hide",
        className
      )}
    >
      {children}
    </div>
  )
}
