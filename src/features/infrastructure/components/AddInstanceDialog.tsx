'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InfrastructureInstance } from '../types'
import { showSuccess, showError } from '@/lib/toast-utils'

interface AddInstanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId?: string | null
  onSuccess: () => void
}

export function AddInstanceDialog({
  open,
  onOpenChange,
  spaceId,
  onSuccess,
}: AddInstanceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'vm',
    host: '',
    port: '',
    protocol: 'ssh',
    connectionType: 'ssh',
    description: '',
    spaceId: spaceId || '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        name: '',
        type: 'vm',
        host: '',
        port: '',
        protocol: 'ssh',
        connectionType: 'ssh',
        description: '',
        spaceId: spaceId || '',
      })
    }
  }, [open, spaceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const connectionConfig: any = {}
      
      if (form.connectionType === 'ssh') {
        connectionConfig.username = ''
        connectionConfig.password = ''
        connectionConfig.privateKey = ''
      } else if (form.connectionType === 'docker') {
        connectionConfig.socketPath = ''
      } else if (form.connectionType === 'kubernetes') {
        connectionConfig.kubeconfig = ''
      }

      const response = await fetch('/api/infrastructure/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          host: form.host,
          port: form.port ? parseInt(form.port) : null,
          protocol: form.protocol,
          connection_type: form.connectionType,
          connection_config: connectionConfig,
          description: form.description || null,
          space_id: form.spaceId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to create instance')
      }

      showSuccess('Infrastructure instance created successfully')
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      showError(error.message || 'Failed to create instance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Infrastructure Instance</DialogTitle>
          <DialogDescription>
            Add a new infrastructure instance to manage and monitor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter instance name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vm">Virtual Machine</SelectItem>
                    <SelectItem value="docker">Docker Host</SelectItem>
                    <SelectItem value="kubernetes">Kubernetes Cluster</SelectItem>
                    <SelectItem value="cloud">Cloud Instance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="connectionType">Connection Type *</Label>
                <Select
                  value={form.connectionType}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, connectionType: value }))}
                >
                  <SelectTrigger id="connectionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ssh">SSH</SelectItem>
                    <SelectItem value="docker">Docker API</SelectItem>
                    <SelectItem value="kubernetes">Kubernetes API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host *</Label>
                <Input
                  id="host"
                  value={form.host}
                  onChange={(e) => setForm((prev) => ({ ...prev, host: e.target.value }))}
                  placeholder="e.g., 192.168.1.100 or hostname"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm((prev) => ({ ...prev, port: e.target.value }))}
                  placeholder="Default port"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select
                value={form.protocol}
                onValueChange={(value) => setForm((prev) => ({ ...prev, protocol: value }))}
              >
                <SelectTrigger id="protocol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ssh">SSH</SelectItem>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="https">HTTPS</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.name || !form.host}>
              {loading ? 'Creating...' : 'Create Instance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

