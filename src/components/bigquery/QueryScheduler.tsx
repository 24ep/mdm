'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, Repeat, X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScheduledQuery {
  id: string
  name: string
  query: string
  schedule: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
    cronExpression?: string
  }
  enabled: boolean
  createdAt: Date
  lastRun?: Date
  nextRun?: Date
}

interface QuerySchedulerProps {
  query: string
  queryName?: string
  isOpen: boolean
  onClose: () => void
  onSchedule: (schedule: ScheduledQuery) => void
}

export function QueryScheduler({ query, queryName, isOpen, onClose, onSchedule }: QuerySchedulerProps) {
  const [scheduleName, setScheduleName] = useState(queryName || 'Scheduled Query')
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly' | 'monthly' | 'custom'>('daily')
  const [time, setTime] = useState('09:00')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [cronExpression, setCronExpression] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')

  const calculateNextRun = (): Date | undefined => {
    if (frequency === 'once') {
      return scheduledDate ? new Date(scheduledDate) : undefined
    }

    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    const next = new Date()
    next.setHours(hours, minutes, 0, 0)

    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }

    if (frequency === 'daily') {
      return next
    }

    if (frequency === 'weekly') {
      const daysUntilTarget = (dayOfWeek - next.getDay() + 7) % 7
      next.setDate(next.getDate() + daysUntilTarget)
      return next
    }

    if (frequency === 'monthly') {
      next.setDate(dayOfMonth)
      if (next <= now) {
        next.setMonth(next.getMonth() + 1)
      }
      return next
    }

    return undefined
  }

  const handleSchedule = () => {
    if (!scheduleName.trim()) {
      toast.error('Please enter a schedule name')
      return
    }

    if (!query.trim()) {
      toast.error('Query is empty')
      return
    }

    if (frequency === 'once' && !scheduledDate) {
      toast.error('Please select a date for one-time execution')
      return
    }

    const scheduled: ScheduledQuery = {
      id: Date.now().toString(),
      name: scheduleName,
      query,
      schedule: {
        frequency,
        time,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        cronExpression: frequency === 'custom' ? cronExpression : undefined
      },
      enabled: true,
      createdAt: new Date(),
      nextRun: calculateNextRun()
    }

    onSchedule(scheduled)
    toast.success('Query scheduled successfully')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Query
          </DialogTitle>
          <DialogDescription>
            Set up automatic execution of your query
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Schedule Name</Label>
            <Input
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              placeholder="My Scheduled Query"
            />
          </div>

          <div>
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Run Once</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom (Cron)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === 'once' && (
            <div>
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          )}

          {frequency !== 'once' && (
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          )}

          {frequency === 'weekly' && (
            <div>
              <Label>Day of Week</Label>
              <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {frequency === 'monthly' && (
            <div>
              <Label>Day of Month</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {frequency === 'custom' && (
            <div>
              <Label>Cron Expression</Label>
              <Input
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 9 * * * (every day at 9 AM)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: minute hour day month weekday
              </p>
            </div>
          )}

          {calculateNextRun() && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900">Next Run</p>
              <p className="text-xs text-blue-700">
                {calculateNextRun()?.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule}>
            Schedule Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

