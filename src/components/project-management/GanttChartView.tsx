'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, differenceInDays, addDays } from 'date-fns'

interface Ticket {
  id: string
  title: string
  status: string
  priority: string
  startDate?: string | null
  dueDate?: string | null
  estimate?: number | null
}

interface GanttChartViewProps {
  tickets: Ticket[]
  onTicketClick?: (ticket: Ticket) => void
}

export function GanttChartView({ tickets, onTicketClick }: GanttChartViewProps) {
  // Calculate date range
  const dateRange = useMemo(() => {
    const dates = tickets
      .filter((t) => t.startDate || t.dueDate)
      .map((t) => [
        t.startDate ? new Date(t.startDate) : null,
        t.dueDate ? new Date(t.dueDate) : null,
      ])
      .flat()
      .filter((d): d is Date => d !== null)

    if (dates.length === 0) {
      const today = new Date()
      return {
        start: addDays(today, -7),
        end: addDays(today, 30),
      }
    }

    const start = new Date(Math.min(...dates.map((d) => d.getTime())))
    const end = new Date(Math.max(...dates.map((d) => d.getTime())))

    return {
      start: addDays(start, -7),
      end: addDays(end, 7),
    }
  }, [tickets])

  // Generate date columns
  const dateColumns = useMemo(() => {
    const days = differenceInDays(dateRange.end, dateRange.start)
    const columns: Date[] = []
    for (let i = 0; i <= days; i++) {
      columns.push(addDays(dateRange.start, i))
    }
    return columns
  }, [dateRange])

  const getBarPosition = (ticket: Ticket) => {
    if (!ticket.startDate && !ticket.dueDate) return null

    const start = ticket.startDate
      ? new Date(ticket.startDate)
      : dateRange.start
    const end = ticket.dueDate ? new Date(ticket.dueDate) : dateRange.end

    const startOffset = differenceInDays(start, dateRange.start)
    const duration = differenceInDays(end, start) || 1

    return {
      left: `${(startOffset / dateColumns.length) * 100}%`,
      width: `${(duration / dateColumns.length) * 100}%`,
    }
  }

  const priorityColors = {
    LOW: 'bg-gray-400',
    MEDIUM: 'bg-blue-500',
    HIGH: 'bg-orange-500',
    URGENT: 'bg-red-500',
  }

  return (
    <div className="space-y-4">
      {/* Date Header */}
      <div className="overflow-x-auto">
        <div className="flex min-w-full border-b">
          <div className="w-64 flex-shrink-0 p-2 font-medium border-r">Task</div>
          <div className="flex-1 flex">
            {dateColumns
              .filter((_, i) => i % 7 === 0) // Show weekly
              .map((date) => (
                <div
                  key={date.toISOString()}
                  className="flex-1 p-2 text-xs text-center border-r"
                  style={{ minWidth: '100px' }}
                >
                  {format(date, 'MMM d')}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Gantt Bars */}
      <div className="space-y-2">
        {tickets.map((ticket) => {
          const barPosition = getBarPosition(ticket)
          return (
            <Card
              key={ticket.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onTicketClick?.(ticket)}
            >
              <div className="flex items-center relative h-12">
                <div className="w-64 flex-shrink-0 p-3 border-r">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        priorityColors[ticket.priority as keyof typeof priorityColors] ||
                        priorityColors.MEDIUM
                      }`}
                    />
                    <span className="text-sm font-medium truncate">{ticket.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex-1 relative h-full">
                  {barPosition && (
                    <div
                      className={`absolute top-2 bottom-2 rounded ${
                        priorityColors[ticket.priority as keyof typeof priorityColors] ||
                        priorityColors.MEDIUM
                      } opacity-80 hover:opacity-100 transition-opacity`}
                      style={{
                        left: barPosition.left,
                        width: barPosition.width,
                      }}
                    >
                      <div className="h-full flex items-center px-2 text-white text-xs">
                        {ticket.title}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

