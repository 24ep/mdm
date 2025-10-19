import React from 'react'
import { cn } from '@/lib/utils'
import { SCROLLABLE_HEIGHTS, type ScrollableHeight } from '@/lib/constants'

interface ScrollableTableProps {
  children: React.ReactNode
  maxHeight?: ScrollableHeight | string
  className?: string
  tableClassName?: string
  showScrollbar?: boolean
}

export function ScrollableTable({ 
  children, 
  maxHeight = 'MEDIUM',
  className = "",
  tableClassName = "",
  showScrollbar = true
}: ScrollableTableProps) {
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
      <table className={cn("w-full text-sm", tableClassName)}>
        {children}
      </table>
    </div>
  )
}
