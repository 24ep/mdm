'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CalendarProps {
  mode?: 'single' | 'range' | 'multiple'
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  initialFocus?: boolean
  className?: string
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  initialFocus,
  className,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(selected)

  React.useEffect(() => {
    setSelectedDate(selected)
  }, [selected])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined
    setSelectedDate(date)
    onSelect?.(date)
  }

  return (
    <div className={cn('p-3', className)}>
      <input
        type="date"
        value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
        onChange={handleDateChange}
        className="w-full px-3 py-2 border rounded-md"
        autoFocus={initialFocus}
      />
    </div>
  )
}
