'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Clock, 
  Play, 
  Pause, 
  Square as Stop, 
  Settings, 
  Calendar, 
  Repeat, 
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  Bell,
  BellOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface SchedulingAutomationProps {
  notebookId?: string
  onSchedule?: (schedule: Schedule) => void
  onRunNow?: (schedule: Schedule) => void
  onStop?: (scheduleId: string) => void
  onDelete?: (scheduleId: string) => void
  onUpdate?: (schedule: Schedule) => void
}

interface Schedule {
  id: string
  name: string
  description?: string
  notebookId: string
  notebookName: string
  frequency: ScheduleFrequency
  timezone: string
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  status: 'active' | 'paused' | 'error' | 'completed'
  notifications: NotificationConfig
  parameters: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

interface ScheduleFrequency {
  type: 'once' | 'interval' | 'cron' | 'daily' | 'weekly' | 'monthly'
  value: string
  description: string
}

interface NotificationConfig {
  enabled: boolean
  onSuccess: boolean
  onFailure: boolean
  onCompletion: boolean
  email: string[]
  webhook?: string
}

interface Execution {
  id: string
  scheduleId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number
  output?: string
  error?: string
  logs: LogEntry[]
}

interface LogEntry {
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  message: string
  details?: any
}

export function SchedulingAutomation({ 
  notebookId = 'notebook-1',
  onSchedule,
  onRunNow,
  onStop,
  onDelete,
  onUpdate
}: SchedulingAutomationProps) {
  const [activeTab, setActiveTab] = useState<'schedules' | 'executions' | 'create' | 'settings'>('schedules')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    name: '',
    description: '',
    frequency: {
      type: 'daily',
      value: '0 9 * * *',
      description: 'Daily at 9:00 AM'
    },
    timezone: 'UTC',
    enabled: true,
    notifications: {
      enabled: true,
      onSuccess: true,
      onFailure: true,
      onCompletion: false,
      email: []
    },
    parameters: {}
  })

  const frequencyTypes = [
    { type: 'once', label: 'Run Once', description: 'Execute immediately' },
    { type: 'interval', label: 'Interval', description: 'Every X minutes/hours' },
    { type: 'daily', label: 'Daily', description: 'Every day at specific time' },
    { type: 'weekly', label: 'Weekly', description: 'Every week on specific day' },
    { type: 'monthly', label: 'Monthly', description: 'Every month on specific date' },
    { type: 'cron', label: 'Cron Expression', description: 'Custom cron expression' }
  ]

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'Pacific/Auckland'
  ]

  useEffect(() => {
    if (!notebookId) return

    // Fetch schedules from API
    const fetchSchedules = async () => {
      try {
        const response = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/schedules`)
        if (!response.ok) {
          throw new Error('Failed to fetch schedules')
        }

        const data = await response.json()
        if (data.success && data.schedules) {
          // Transform API schedules to component format
          const transformedSchedules: Schedule[] = data.schedules.map((s: any) => {
            const scheduleConfig = typeof s.schedule_config === 'string' 
              ? JSON.parse(s.schedule_config) 
              : s.schedule_config || {}
            
            // Generate frequency description
            let frequencyDesc = ''
            switch (s.schedule_type) {
              case 'daily':
                const hour = scheduleConfig.hour || 9
                const minute = scheduleConfig.minute || 0
                frequencyDesc = `Daily at ${hour}:${minute.toString().padStart(2, '0')}`
                break
              case 'weekly':
                const dayOfWeek = scheduleConfig.dayOfWeek || 1
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                frequencyDesc = `Weekly on ${dayNames[dayOfWeek]}`
                break
              case 'monthly':
                frequencyDesc = `Monthly on day ${scheduleConfig.dayOfMonth || 1}`
                break
              case 'interval':
                frequencyDesc = `Every ${scheduleConfig.value || 60} ${scheduleConfig.unit || 'minutes'}`
                break
              case 'cron':
                frequencyDesc = scheduleConfig.expression || 'Custom cron'
                break
              default:
                frequencyDesc = 'Once'
            }

            return {
              id: s.id,
              name: s.name,
              description: s.description || '',
              notebookId: s.notebook_id,
              notebookName: s.notebook_id, // TODO: Get actual notebook name
              frequency: {
                type: s.schedule_type,
                value: scheduleConfig.expression || scheduleConfig.value || '',
                description: frequencyDesc
              },
              timezone: s.timezone || 'UTC',
              enabled: s.enabled || false,
              lastRun: s.last_run_at ? new Date(s.last_run_at) : undefined,
              nextRun: s.next_run_at ? new Date(s.next_run_at) : undefined,
              status: s.status || 'active',
              notifications: typeof s.notifications === 'string' 
                ? JSON.parse(s.notifications) 
                : s.notifications || { enabled: false },
              parameters: typeof s.parameters === 'string' 
                ? JSON.parse(s.parameters) 
                : s.parameters || {},
              createdAt: new Date(s.created_at),
              updatedAt: new Date(s.updated_at)
            }
          })

          setSchedules(transformedSchedules)
        }
      } catch (error) {
        console.error('Error fetching schedules:', error)
        toast.error('Failed to load schedules')
      }
    }

    fetchSchedules()

    // Fetch executions
    const fetchExecutions = async () => {
      try {
        // TODO: Create API endpoint for executions
        // For now, we'll use mock data
      } catch (error) {
        console.error('Error fetching executions:', error)
      }
    }

    fetchExecutions()
  }, [notebookId])

  const handleCreateSchedule = async () => {
    if (!newSchedule.name?.trim()) {
      toast.error('Please enter a schedule name')
      return
    }

    if (!notebookId) {
      toast.error('Notebook ID is required')
      return
    }

    try {
      // Build schedule config based on frequency type
      let scheduleConfig: any = {}
      const freq = newSchedule.frequency!

      switch (freq.type) {
        case 'daily':
          // Parse time from cron or use defaults
          const dailyMatch = freq.value.match(/(\d+)\s+(\d+)/)
          scheduleConfig = {
            hour: dailyMatch ? parseInt(dailyMatch[1]) : 9,
            minute: dailyMatch ? parseInt(dailyMatch[2]) : 0
          }
          break
        case 'weekly':
          const weeklyMatch = freq.value.match(/\*\s+\*\s+(\d+)/)
          scheduleConfig = {
            dayOfWeek: weeklyMatch ? parseInt(weeklyMatch[1]) : 1,
            hour: 9,
            minute: 0
          }
          break
        case 'monthly':
          const monthlyMatch = freq.value.match(/(\d+)\s+\*/)
          scheduleConfig = {
            dayOfMonth: monthlyMatch ? parseInt(monthlyMatch[1]) : 1,
            hour: 9,
            minute: 0
          }
          break
        case 'interval':
          const intervalMatch = freq.value.match(/(\d+)\s+(minutes|hours)/)
          scheduleConfig = {
            value: intervalMatch ? parseInt(intervalMatch[1]) : 60,
            unit: intervalMatch ? intervalMatch[2] : 'minutes'
          }
          break
        case 'cron':
          scheduleConfig = {
            expression: freq.value
          }
          break
      }

      const response = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSchedule.name,
          description: newSchedule.description,
          schedule_type: freq.type,
          schedule_config: scheduleConfig,
          timezone: newSchedule.timezone || 'UTC',
          enabled: newSchedule.enabled !== false,
          notifications: newSchedule.notifications,
          parameters: newSchedule.parameters
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create schedule')
      }

      const data = await response.json()
      if (data.success) {
        // Refresh schedules
        const refreshResponse = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/schedules`)
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          if (refreshData.success && refreshData.schedules) {
            // Transform and set schedules (same logic as in useEffect)
            const transformed = refreshData.schedules.map((s: any) => {
              const config = typeof s.schedule_config === 'string' ? JSON.parse(s.schedule_config) : s.schedule_config || {}
              let desc = ''
              switch (s.schedule_type) {
                case 'daily':
                  desc = `Daily at ${config.hour || 9}:${(config.minute || 0).toString().padStart(2, '0')}`
                  break
                case 'weekly':
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                  desc = `Weekly on ${dayNames[config.dayOfWeek || 1]}`
                  break
                case 'monthly':
                  desc = `Monthly on day ${config.dayOfMonth || 1}`
                  break
                case 'interval':
                  desc = `Every ${config.value || 60} ${config.unit || 'minutes'}`
                  break
                case 'cron':
                  desc = config.expression || 'Custom cron'
                  break
                default:
                  desc = 'Once'
              }
              return {
                id: s.id,
                name: s.name,
                description: s.description || '',
                notebookId: s.notebook_id,
                notebookName: s.notebook_id,
                frequency: { type: s.schedule_type, value: '', description: desc },
                timezone: s.timezone || 'UTC',
                enabled: s.enabled || false,
                lastRun: s.last_run_at ? new Date(s.last_run_at) : undefined,
                nextRun: s.next_run_at ? new Date(s.next_run_at) : undefined,
                status: s.status || 'active',
                notifications: typeof s.notifications === 'string' ? JSON.parse(s.notifications) : s.notifications || {},
                parameters: typeof s.parameters === 'string' ? JSON.parse(s.parameters) : s.parameters || {},
                createdAt: new Date(s.created_at),
                updatedAt: new Date(s.updated_at)
              }
            })
            setSchedules(transformed)
          }
        }

        onSchedule?.(data.schedule)
        setNewSchedule({
          name: '',
          description: '',
          frequency: {
            type: 'daily',
            value: '0 9 * * *',
            description: 'Daily at 9:00 AM'
          },
          timezone: 'UTC',
          enabled: true,
          notifications: {
            enabled: true,
            onSuccess: true,
            onFailure: true,
            onCompletion: false,
            email: []
          },
          parameters: {}
        })
        setActiveTab('schedules')
        toast.success('Schedule created successfully')
      }
    } catch (error: any) {
      console.error('Error creating schedule:', error)
      toast.error('Failed to create schedule')
    }
  }

  const handleToggleSchedule = async (scheduleId: string) => {
    if (!notebookId) return

    try {
      const schedule = schedules.find((s) => s.id === scheduleId)
      if (!schedule) return

      const response = await fetch(
        `/api/notebooks/${encodeURIComponent(notebookId)}/schedules/${scheduleId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled: !schedule.enabled,
            status: !schedule.enabled ? 'active' : 'paused'
          })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update schedule')
      }

      // Update local state
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === scheduleId
            ? {
                ...s,
                enabled: !s.enabled,
                status: !s.enabled ? 'active' : 'paused'
              }
            : s
        )
      )

      toast.success('Schedule status updated')
    } catch (error: any) {
      console.error('Error updating schedule:', error)
      toast.error('Failed to update schedule')
    }
  }

  const handleRunNow = async (schedule: Schedule) => {
    if (!notebookId) return

    try {
      const response = await fetch(
        `/api/notebooks/${encodeURIComponent(notebookId)}/schedules/${schedule.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to run schedule')
      }

      onRunNow?.(schedule)
      toast.success(`Running schedule: ${schedule.name}`)
    } catch (error: any) {
      console.error('Error running schedule:', error)
      toast.error('Failed to run schedule')
    }
  }

  const handleStopSchedule = async (scheduleId: string) => {
    if (!notebookId) return

    try {
      const response = await fetch(
        `/api/notebooks/${encodeURIComponent(notebookId)}/schedules/${scheduleId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled: false,
            status: 'paused'
          })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to stop schedule')
      }

      setSchedules((prev) =>
        prev.map((s) =>
          s.id === scheduleId ? { ...s, enabled: false, status: 'paused' } : s
        )
      )

      onStop?.(scheduleId)
      toast.success('Schedule stopped')
    } catch (error: any) {
      console.error('Error stopping schedule:', error)
      toast.error('Failed to stop schedule')
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!notebookId) return

    try {
      const response = await fetch(
        `/api/notebooks/${encodeURIComponent(notebookId)}/schedules/${scheduleId}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete schedule')
      }

      setSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId))
      onDelete?.(scheduleId)
      toast.success('Schedule deleted')
    } catch (error: any) {
      console.error('Error deleting schedule:', error)
      toast.error('Failed to delete schedule')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 dark:bg-green-950/30'
      case 'paused': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30'
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-950/30'
      case 'completed': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/30'
    }
  }

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled': return <Stop className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Scheduled Notebooks ({schedules.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map(schedule => (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{schedule.name}</h3>
                          <Badge variant="outline" className={getStatusColor(schedule.status)}>
                            {getStatusIcon(schedule.status)}
                            <span className="ml-1">{schedule.status}</span>
                          </Badge>
                          {!schedule.enabled && (
                            <Badge variant="outline" className="text-gray-600">
                              <Pause className="h-3 w-3 mr-1" />
                              Paused
                            </Badge>
                          )}
                        </div>
                        
                        {schedule.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {schedule.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Notebook:</span> {schedule.notebookName}
                          </div>
                          <div>
                            <span className="font-medium">Frequency:</span> {schedule.frequency.description}
                          </div>
                          <div>
                            <span className="font-medium">Last Run:</span> {schedule.lastRun?.toLocaleString() || 'Never'}
                          </div>
                          <div>
                            <span className="font-medium">Next Run:</span> {schedule.nextRun?.toLocaleString() || 'Not scheduled'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Switch
                          checked={schedule.enabled}
                          onCheckedChange={() => handleToggleSchedule(schedule.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunNow(schedule)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run Now
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('create')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2" />
                Execution History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map(execution => {
                  const schedule = schedules.find(s => s.id === execution.scheduleId)
                  return (
                    <div key={execution.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{schedule?.name || 'Unknown Schedule'}</h3>
                            <Badge variant="outline" className={getStatusColor(execution.status)}>
                              {getExecutionStatusIcon(execution.status)}
                              <span className="ml-1">{execution.status}</span>
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div>
                              <span className="font-medium">Started:</span> {execution.startTime.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {execution.duration ? formatDuration(execution.duration) : 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Ended:</span> {execution.endTime?.toLocaleString() || 'Running'}
                            </div>
                            <div>
                              <span className="font-medium">Schedule ID:</span> {execution.scheduleId}
                            </div>
                          </div>
                          
                          {execution.output && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Output:</span> {execution.output}
                            </div>
                          )}
                          
                          {execution.error && (
                            <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                              <span className="font-medium">Error:</span> {execution.error}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Logs
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Create New Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduleName">Schedule Name</Label>
                  <Input
                    id="scheduleName"
                    placeholder="Daily Data Processing"
                    value={newSchedule.name || ''}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={newSchedule.timezone} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this schedule does"
                  value={newSchedule.description || ''}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>Frequency</Label>
                <div className="space-y-3">
                  <Select value={newSchedule.frequency?.type} onValueChange={(value) => {
                    const freqType = frequencyTypes.find(f => f.type === value)
                    setNewSchedule(prev => ({
                      ...prev,
                      frequency: {
                        type: value as any,
                        value: value === 'daily' ? '0 9 * * *' : value === 'weekly' ? '0 9 * * 1' : value === 'monthly' ? '0 9 1 * *' : '0 */1 * * *',
                        description: freqType?.description || ''
                      }
                    }))
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyTypes.map(freq => (
                        <SelectItem key={freq.type} value={freq.type}>
                          <div>
                            <div className="font-medium">{freq.label}</div>
                            <div className="text-sm text-gray-500">{freq.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {newSchedule.frequency?.type === 'cron' && (
                    <div>
                      <Label htmlFor="cronExpression">Cron Expression</Label>
                      <Input
                        id="cronExpression"
                        placeholder="0 9 * * *"
                        value={newSchedule.frequency.value}
                        onChange={(e) => setNewSchedule(prev => ({
                          ...prev,
                          frequency: {
                            ...prev.frequency!,
                            value: e.target.value
                          }
                        }))}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Notifications</Label>
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable notifications</span>
                    <Switch
                      checked={newSchedule.notifications?.enabled}
                      onCheckedChange={(checked) => setNewSchedule(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications!,
                          enabled: checked
                        }
                      }))}
                    />
                  </div>
                  
                  {newSchedule.notifications?.enabled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Notify on success</span>
                        <Switch
                          checked={newSchedule.notifications?.onSuccess}
                          onCheckedChange={(checked) => setNewSchedule(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications!,
                              onSuccess: checked
                            }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Notify on failure</span>
                        <Switch
                          checked={newSchedule.notifications?.onFailure}
                          onCheckedChange={(checked) => setNewSchedule(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications!,
                              onFailure: checked
                            }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Notify on completion</span>
                        <Switch
                          checked={newSchedule.notifications?.onCompletion}
                          onCheckedChange={(checked) => setNewSchedule(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications!,
                              onCompletion: checked
                            }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newSchedule.enabled}
                    onCheckedChange={(checked) => setNewSchedule(prev => ({ ...prev, enabled: checked }))}
                  />
                  <span className="text-sm">Enable schedule immediately</span>
                </div>
                
                <Button onClick={handleCreateSchedule} disabled={!newSchedule.name?.trim()}>
                  <Clock className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Automation Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Zap className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Settings Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Configure advanced automation settings, webhooks, and integrations.
                </p>
                <Button disabled>
                  <Settings className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
