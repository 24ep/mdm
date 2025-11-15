'use client'

import { useState } from 'react'
import { ApiEnvironment, KeyValuePair } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Plus, Settings, X, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface EnvironmentManagerProps {
  environments: ApiEnvironment[]
  activeEnvironment: ApiEnvironment | null
  onSelectEnvironment: (env: ApiEnvironment | null) => void
  workspaceId?: string
  onEnvironmentsChange: (environments: ApiEnvironment[]) => void
}

export function EnvironmentManager({
  environments,
  activeEnvironment,
  onSelectEnvironment,
  workspaceId,
  onEnvironmentsChange,
}: EnvironmentManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEnv, setEditingEnv] = useState<ApiEnvironment | null>(null)

  const handleCreateEnvironment = async () => {
    if (!workspaceId) return

    const name = prompt('Environment name:')
    if (!name) return

    try {
      const res = await fetch('/api/api-client/environments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name,
          variables: [],
        }),
      })

      if (res.ok) {
        const data = await res.json()
        onEnvironmentsChange([...environments, data.environment])
        onSelectEnvironment(data.environment)
      }
    } catch (error) {
      console.error('Failed to create environment:', error)
    }
  }

  const handleUpdateEnvironment = async (env: ApiEnvironment) => {
    if (!env.id) return

    try {
      const res = await fetch(`/api/api-client/environments/${env.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(env),
      })

      if (res.ok) {
        const data = await res.json()
        onEnvironmentsChange(
          environments.map((e) => (e.id === env.id ? data.environment : e))
        )
        if (activeEnvironment?.id === env.id) {
          onSelectEnvironment(data.environment)
        }
      }
    } catch (error) {
      console.error('Failed to update environment:', error)
    }
  }

  const handleDeleteEnvironment = async (id: string) => {
    if (!confirm('Delete this environment?')) return

    try {
      const res = await fetch(`/api/api-client/environments/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        onEnvironmentsChange(environments.filter((e) => e.id !== id))
        if (activeEnvironment?.id === id) {
          onSelectEnvironment(environments.find((e) => e.id !== id) || null)
        }
      }
    } catch (error) {
      console.error('Failed to delete environment:', error)
    }
  }


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {activeEnvironment?.name || 'No Environment'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {environments.map((env) => (
            <DropdownMenuItem
              key={env.id}
              onClick={() => onSelectEnvironment(env)}
              className={activeEnvironment?.id === env.id ? 'bg-accent' : ''}
            >
              {env.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            setEditingEnv({
              id: undefined,
              workspaceId: workspaceId || '',
              name: '',
              variables: [],
              isGlobal: false,
            })
            setDialogOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Environment
          </DropdownMenuItem>
          {activeEnvironment && (
            <DropdownMenuItem onClick={() => {
              setEditingEnv(activeEnvironment)
              setDialogOpen(true)
            }}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Environment
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen || editingEnv !== null} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) setEditingEnv(null)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEnv ? 'Edit Environment' : 'New Environment'}
            </DialogTitle>
          </DialogHeader>
          {editingEnv && (
            <div className="space-y-4">
              <Input
                value={editingEnv.name}
                onChange={(e) => setEditingEnv({ ...editingEnv, name: e.target.value })}
                placeholder="Environment name"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Variables</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updated = {
                        ...editingEnv,
                        variables: [...(editingEnv.variables || []), { key: '', value: '', enabled: true }],
                      }
                      setEditingEnv(updated)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variable
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {(editingEnv.variables || []).map((variable, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={variable.key}
                        onChange={(e) => {
                          const variables = [...(editingEnv.variables || [])]
                          variables[index] = { ...variables[index], key: e.target.value }
                          setEditingEnv({ ...editingEnv, variables })
                        }}
                        placeholder="Key"
                        className="flex-1"
                      />
                      <Input
                        value={variable.value}
                        onChange={(e) => {
                          const variables = [...(editingEnv.variables || [])]
                          variables[index] = { ...variables[index], value: e.target.value }
                          setEditingEnv({ ...editingEnv, variables })
                        }}
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const variables = [...(editingEnv.variables || [])]
                          variables[index] = { ...variables[index], enabled: !variable.enabled }
                          setEditingEnv({ ...editingEnv, variables })
                        }}
                        className={variable.enabled ? '' : 'opacity-50'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const variables = (editingEnv.variables || []).filter((_, i) => i !== index)
                          setEditingEnv({ ...editingEnv, variables })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingEnv(null)
                    setDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (editingEnv.id) {
                      await handleUpdateEnvironment(editingEnv)
                    } else {
                      // Create new environment
                      if (workspaceId) {
                        try {
                          const res = await fetch('/api/api-client/environments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              workspaceId,
                              name: editingEnv.name,
                              variables: editingEnv.variables,
                            }),
                          })
                          if (res.ok) {
                            const data = await res.json()
                            onEnvironmentsChange([...environments, data.environment])
                            onSelectEnvironment(data.environment)
                          }
                        } catch (error) {
                          console.error('Failed to create environment:', error)
                        }
                      }
                    }
                    setEditingEnv(null)
                    setDialogOpen(false)
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

