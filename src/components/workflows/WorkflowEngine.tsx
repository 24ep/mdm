'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Settings,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Database,
  Mail,
  Webhook,
  Zap
} from 'lucide-react'
import { useSpacePermissions } from '@/hooks/use-space-permissions'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  name: string
  description: string
  config: Record<string, any>
  position: { x: number; y: number }
  connections: string[]
}

interface Workflow {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  nodes: WorkflowNode[]
  triggers: WorkflowTrigger[]
  isSystem: boolean
  created_at: Date
  updated_at: Date
}

interface WorkflowTrigger {
  id: string
  type: 'record_created' | 'record_updated' | 'record_deleted' | 'scheduled' | 'webhook'
  name: string
  config: Record<string, any>
  enabled: boolean
}

interface WorkflowExecution {
  id: string
  workflow_id: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  started_at: Date
  completed_at?: Date
  error_message?: string
  context: Record<string, any>
}

const NODE_TYPES = [
  {
    type: 'trigger',
    name: 'Trigger',
    description: 'Start a workflow',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-blue-500'
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Check if condition is met',
    icon: <Activity className="h-4 w-4" />,
    color: 'bg-yellow-500'
  },
  {
    type: 'action',
    name: 'Action',
    description: 'Perform an action',
    icon: <Database className="h-4 w-4" />,
    color: 'bg-green-500'
  },
  {
    type: 'delay',
    name: 'Delay',
    description: 'Wait for specified time',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-purple-500'
  }
]

const TRIGGER_TYPES = [
  {
    type: 'record_created',
    name: 'Record Created',
    description: 'Triggered when a new record is created',
    icon: <Database className="h-4 w-4" />
  },
  {
    type: 'record_updated',
    name: 'Record Updated',
    description: 'Triggered when a record is updated',
    icon: <Edit className="h-4 w-4" />
  },
  {
    type: 'record_deleted',
    name: 'Record Deleted',
    description: 'Triggered when a record is deleted',
    icon: <Trash2 className="h-4 w-4" />
  },
  {
    type: 'scheduled',
    name: 'Scheduled',
    description: 'Triggered on a schedule',
    icon: <Clock className="h-4 w-4" />
  },
  {
    type: 'webhook',
    name: 'Webhook',
    description: 'Triggered by external webhook',
    icon: <Webhook className="h-4 w-4" />
  }
]

const ACTION_TYPES = [
  {
    type: 'send_email',
    name: 'Send Email',
    description: 'Send an email notification',
    icon: <Mail className="h-4 w-4" />
  },
  {
    type: 'update_record',
    name: 'Update Record',
    description: 'Update a data record',
    icon: <Database className="h-4 w-4" />
  },
  {
    type: 'create_record',
    name: 'Create Record',
    description: 'Create a new data record',
    icon: <Plus className="h-4 w-4" />
  },
  {
    type: 'webhook_call',
    name: 'Webhook Call',
    description: 'Call an external webhook',
    icon: <Webhook className="h-4 w-4" />
  }
]

interface WorkflowEngineProps {
  spaceId: string
}

export function WorkflowEngine({ spaceId }: WorkflowEngineProps) {
  const permissions = useSpacePermissions()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger_type: 'record_created' as string
  })

  const canCreateWorkflow = permissions.canCreate
  const canEditWorkflow = permissions.canEdit
  const canDeleteWorkflow = permissions.canDelete

  const createWorkflow = () => {
    if (!newWorkflow.name.trim()) return

    const workflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name: newWorkflow.name,
      description: newWorkflow.description,
      status: 'draft',
      nodes: [],
      triggers: [{
        id: `trigger_${Date.now()}`,
        type: newWorkflow.trigger_type as any,
        name: `Trigger: ${TRIGGER_TYPES.find(t => t.type === newWorkflow.trigger_type)?.name}`,
        config: {},
        enabled: true
      }],
      isSystem: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    setWorkflows(prev => [...prev, workflow])
    setSelectedWorkflow(workflow)
    setShowCreateDialog(false)
    setNewWorkflow({ name: '', description: '', trigger_type: 'record_created' })
  }

  const updateWorkflow = (id: string, updates: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(w => 
      w.id === id ? { ...w, ...updates, updated_at: new Date() } : w
    ))
    if (selectedWorkflow?.id === id) {
      setSelectedWorkflow(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const deleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id))
    if (selectedWorkflow?.id === id) {
      setSelectedWorkflow(null)
    }
  }

  const addNode = (workflowId: string, nodeType: string) => {
    const node: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType as any,
      name: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`,
      description: '',
      config: {},
      position: { x: 100, y: 100 },
      connections: []
    }

    updateWorkflow(workflowId, {
      nodes: [...(selectedWorkflow?.nodes || []), node]
    })
  }

  const executeWorkflow = async (workflowId: string) => {
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      workflow_id: workflowId,
      status: 'running',
      started_at: new Date(),
      context: {}
    }

    setExecutions(prev => [...prev, execution])

    // Simulate workflow execution
    setTimeout(() => {
      setExecutions(prev => prev.map(e => 
        e.id === execution.id 
          ? { ...e, status: 'completed', completed_at: new Date() }
          : e
      ))
    }, 3000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Engine</h2>
          <p className="text-muted-foreground">
            Create and manage automated workflows
          </p>
        </div>
        {canCreateWorkflow && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        )}
      </div>

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <Card 
                key={workflow.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedWorkflow?.id === workflow.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedWorkflow(workflow)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <Badge className={getStatusColor(workflow.status)}>
                      {workflow.status}
                    </Badge>
                  </div>
                  <CardDescription>{workflow.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Nodes:</span>
                      <span>{workflow.nodes.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Triggers:</span>
                      <span>{workflow.triggers.length}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {canEditWorkflow && (
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteWorkflow && (
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          executeWorkflow(workflow.id)
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedWorkflow && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedWorkflow.name}
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedWorkflow.status)}>
                      {selectedWorkflow.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{selectedWorkflow.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="nodes" className="w-full">
                  <TabsList>
                    <TabsTrigger value="nodes">Nodes</TabsTrigger>
                    <TabsTrigger value="triggers">Triggers</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="nodes" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Workflow Nodes</h4>
                      {canEditWorkflow && (
                        <div className="flex gap-2">
                          {NODE_TYPES.map((nodeType) => (
                            <Button
                              key={nodeType.type}
                              size="sm"
                              variant="outline"
                              onClick={() => addNode(selectedWorkflow.id, nodeType.type)}
                            >
                              {nodeType.icon}
                              {nodeType.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {selectedWorkflow.nodes.map((node) => (
                        <Card key={node.id} className="p-3">
                          <div className="flex items-center gap-2">
                            {NODE_TYPES.find(t => t.type === node.type)?.icon}
                            <div>
                              <div className="font-medium text-sm">{node.name}</div>
                              <div className="text-xs text-muted-foreground">{node.type}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="triggers" className="space-y-4">
                    <div className="space-y-3">
                      {selectedWorkflow.triggers.map((trigger) => (
                        <Card key={trigger.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {TRIGGER_TYPES.find(t => t.type === trigger.type)?.icon}
                              <div>
                                <div className="font-medium">{trigger.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {TRIGGER_TYPES.find(t => t.type === trigger.type)?.description}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={trigger.enabled}
                                onCheckedChange={(enabled) => {
                                  updateWorkflow(selectedWorkflow.id, {
                                    triggers: selectedWorkflow.triggers.map(t =>
                                      t.id === trigger.id ? { ...t, enabled } : t
                                    )
                                  })
                                }}
                              />
                              {canEditWorkflow && (
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="workflow-name">Workflow Name</Label>
                        <Input
                          id="workflow-name"
                          value={selectedWorkflow.name}
                          onChange={(e) => updateWorkflow(selectedWorkflow.id, { name: e.target.value })}
                          disabled={!canEditWorkflow}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workflow-status">Status</Label>
                        <Select
                          value={selectedWorkflow.status}
                          onValueChange={(status) => updateWorkflow(selectedWorkflow.id, { status: status as any })}
                          disabled={!canEditWorkflow}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workflow-description">Description</Label>
                      <Textarea
                        id="workflow-description"
                        value={selectedWorkflow.description}
                        onChange={(e) => updateWorkflow(selectedWorkflow.id, { description: e.target.value })}
                        disabled={!canEditWorkflow}
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <div className="space-y-3">
            {executions.map((execution) => (
              <Card key={execution.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {execution.status === 'running' && <Activity className="h-4 w-4 animate-pulse text-blue-500" />}
                        {execution.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {execution.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <span className="font-medium">Execution {execution.id}</span>
                      </div>
                      <Badge className={getExecutionStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Started: {execution.started_at.toLocaleString()}
                    </div>
                  </div>
                  {execution.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {execution.error_message}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Workflow templates will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      {showCreateDialog && (
        <Card className="fixed inset-0 z-50 m-4 max-w-md">
          <CardHeader>
            <CardTitle>Create New Workflow</CardTitle>
            <CardDescription>
              Create a new automated workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                placeholder="Enter workflow name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                placeholder="Enter workflow description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trigger-type">Trigger Type</Label>
              <Select
                value={newWorkflow.trigger_type}
                onValueChange={(type) => setNewWorkflow({ ...newWorkflow, trigger_type: type })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((trigger) => (
                    <SelectItem key={trigger.type} value={trigger.type}>
                      <div className="flex items-center gap-2">
                        {trigger.icon}
                        <div>
                          <div className="font-medium">{trigger.name}</div>
                          <div className="text-xs text-muted-foreground">{trigger.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={createWorkflow} disabled={!newWorkflow.name.trim()}>
                Create Workflow
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
