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
    // Initialize with mock data
    setSchedules([
      {
        id: 'schedule-1',
        name: 'Daily Data Processing',
        description: 'Process daily sales data and generate reports',
        notebookId: 'notebook-1',
        notebookName: 'Sales Analysis',
        frequency: {
          type: 'daily',
          value: '0 6 * * *',
          description: 'Daily at 6:00 AM'
        },
        timezone: 'UTC',
        enabled: true,
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000),
        status: 'active',
        notifications: {
          enabled: true,
          onSuccess: true,
          onFailure: true,
          onCompletion: false,
          email: ['admin@example.com']
        },
        parameters: {
          dataSource: 'sales_db',
          outputFormat: 'pdf'
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'schedule-2',
        name: 'Weekly ML Model Retraining',
        description: 'Retrain machine learning models with new data',
        notebookId: 'notebook-2',
        notebookName: 'ML Pipeline',
        frequency: {
          type: 'weekly',
          value: '0 2 * * 0',
          description: 'Weekly on Sunday at 2:00 AM'
        },
        timezone: 'UTC',
        enabled: true,
        lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'active',
        notifications: {
          enabled: true,
          onSuccess: true,
          onFailure: true,
          onCompletion: true,
          email: ['ml-team@example.com']
        },
        parameters: {
          modelType: 'random_forest',
          validationSplit: 0.2
        },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'schedule-3',
        name: 'Monthly Report Generation',
        description: 'Generate comprehensive monthly business reports',
        notebookId: 'notebook-3',
        notebookName: 'Monthly Reports',
        frequency: {
          type: 'monthly',
          value: '0 8 1 * *',
          description: 'Monthly on 1st at 8:00 AM'
        },
        timezone: 'UTC',
        enabled: false,
        lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'paused',
        notifications: {
          enabled: true,
          onSuccess: true,
          onFailure: true,
          onCompletion: true,
          email: ['executives@example.com']
        },
        parameters: {
          reportType: 'executive',
          includeCharts: true
        },
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    ])

    setExecutions([
      {
        id: 'exec-1',
        scheduleId: 'schedule-1',
        status: 'completed',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000),
        duration: 15 * 60 * 1000,
        output: 'Report generated successfully',
        logs: [
          { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), level: 'info', message: 'Starting data processing' },
          { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000), level: 'info', message: 'Data loaded successfully' },
          { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000), level: 'info', message: 'Analysis completed' },
          { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000), level: 'info', message: 'Report generated and saved' }
        ]
      },
      {
        id: 'exec-2',
        scheduleId: 'schedule-1',
        status: 'failed',
        startTime: new Date(Date.now() - 26 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 26 * 60 * 60 * 1000 + 5 * 60 * 1000),
        duration: 5 * 60 * 1000,
        error: 'Database connection failed',
        logs: [
          { timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000), level: 'info', message: 'Starting data processing' },
          { timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000 + 2 * 60 * 1000), level: 'error', message: 'Database connection failed', details: { error: 'Connection timeout' } },
          { timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000 + 5 * 60 * 1000), level: 'error', message: 'Execution failed' }
        ]
      }
    ])
  }, [])

  const handleCreateSchedule = () => {
    if (!newSchedule.name?.trim()) {
      toast.error('Please enter a schedule name')
      return
    }

    const schedule: Schedule = {
      id: `schedule-${Date.now()}`,
      name: newSchedule.name,
      description: newSchedule.description,
      notebookId: notebookId,
      notebookName: 'Current Notebook',
      frequency: newSchedule.frequency!,
      timezone: newSchedule.timezone!,
      enabled: newSchedule.enabled!,
      status: 'active',
      notifications: newSchedule.notifications!,
      parameters: newSchedule.parameters!,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setSchedules(prev => [schedule, ...prev])
    onSchedule?.(schedule)
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
    toast.success('Schedule created successfully')
  }

  const handleToggleSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { 
            ...schedule, 
            enabled: !schedule.enabled,
            status: !schedule.enabled ? 'active' : 'paused'
          } 
        : schedule
    ))
    toast.success('Schedule status updated')
  }

  const handleRunNow = (schedule: Schedule) => {
    onRunNow?.(schedule)
    toast.success(`Running schedule: ${schedule.name}`)
  }

  const handleStopSchedule = (scheduleId: string) => {
    onStop?.(scheduleId)
    toast.success('Schedule stopped')
  }

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId))
    onDelete?.(scheduleId)
    toast.success('Schedule deleted')
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
