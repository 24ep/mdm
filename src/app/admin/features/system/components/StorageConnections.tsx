'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  HardDrive,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Cloud,
  Server,
  Folder,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { StorageProviderType } from '@/lib/storage-config'

interface StorageConnection {
  id: string
  name: string
  type: StorageProviderType
  config: any
  isActive: boolean
  status: 'connected' | 'disconnected' | 'error'
  lastTested: string | null
  lastError: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

const STORAGE_TYPES: { value: StorageProviderType; label: string; icon: any }[] = [
  { value: 'minio', label: 'MinIO', icon: Server },
  { value: 's3', label: 'AWS S3', icon: Cloud },
  { value: 'sftp', label: 'SFTP', icon: Server },
  { value: 'onedrive', label: 'OneDrive', icon: Cloud },
  { value: 'google_drive', label: 'Google Drive', icon: Cloud },
]

export function StorageConnections() {
  const [connections, setConnections] = useState<StorageConnection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingConnection, setEditingConnection] = useState<StorageConnection | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'minio' as StorageProviderType,
    description: '',
    isActive: true,
    config: {} as any,
  })

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/storage/connections')
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Error loading connections:', error)
      toast.error('Failed to load storage connections')
    } finally {
      setIsLoading(false)
    }
  }

  const getDefaultConfig = (type: StorageProviderType) => {
    switch (type) {
      case 'minio':
        return {
          endpoint: '',
          access_key: '',
          secret_key: '',
          bucket: '',
          region: 'us-east-1',
          use_ssl: false,
        }
      case 's3':
        return {
          access_key_id: '',
          secret_access_key: '',
          bucket: '',
          region: 'us-east-1',
        }
      case 'sftp':
        return {
          host: '',
          port: 22,
          username: '',
          password: '',
          path: '/uploads',
        }
      case 'onedrive':
        return {
          client_id: '',
          client_secret: '',
          tenant_id: 'common',
          redirect_uri: '',
          access_token: '',
          refresh_token: '',
          folder_path: '',
        }
      case 'google_drive':
        return {
          client_id: '',
          client_secret: '',
          redirect_uri: '',
          access_token: '',
          refresh_token: '',
          folder_id: '',
        }
      default:
        return {}
    }
  }

  const handleTypeChange = (type: string) => {
    const storageType = type as StorageProviderType
    setFormData({
      ...formData,
      type: storageType,
      config: getDefaultConfig(storageType),
    })
  }

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        isActive: formData.isActive,
        config: formData.config,
      }

      if (editingConnection) {
        const response = await fetch(`/api/admin/storage/connections/${editingConnection.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Failed to update')
        toast.success('Storage connection updated successfully')
      } else {
        const response = await fetch('/api/admin/storage/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Failed to create')
        toast.success('Storage connection created successfully')
      }

      setShowDialog(false)
      resetForm()
      loadConnections()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save storage connection')
    }
  }

  const handleDelete = async (connection: StorageConnection) => {
    if (!confirm(`Are you sure you want to delete ${connection.name}?`)) return

    try {
      const response = await fetch(`/api/admin/storage/connections/${connection.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Storage connection deleted successfully')
      loadConnections()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete storage connection')
    }
  }

  const handleTest = async (connection: StorageConnection) => {
    setTestingId(connection.id)
    try {
      const response = await fetch(`/api/admin/storage/connections/${connection.id}/test`, {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Connection test successful')
      } else {
        toast.error(data.error || 'Connection test failed')
      }
      loadConnections()
    } catch (error: any) {
      toast.error('Failed to test connection')
    } finally {
      setTestingId(null)
    }
  }

  const openEdit = (connection: StorageConnection) => {
    setEditingConnection(connection)
    setFormData({
      name: connection.name,
      type: connection.type,
      description: connection.description || '',
      isActive: connection.isActive,
      config: connection.config || getDefaultConfig(connection.type),
    })
    setShowDialog(true)
  }

  const resetForm = () => {
    setEditingConnection(null)
    setFormData({
      name: '',
      type: 'minio',
      description: '',
      isActive: true,
      config: getDefaultConfig('minio'),
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const renderConfigFields = () => {
    const config = formData.config || {}
    const type = formData.type

    switch (type) {
      case 'minio':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Endpoint</Label>
                <Input
                  value={config.endpoint || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, endpoint: e.target.value },
                    })
                  }
                  placeholder="http://localhost:9000"
                />
              </div>
              <div>
                <Label>Bucket</Label>
                <Input
                  value={config.bucket || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, bucket: e.target.value },
                    })
                  }
                  placeholder="attachments"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Access Key</Label>
                <Input
                  type="password"
                  value={config.access_key || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, access_key: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Secret Key</Label>
                <Input
                  type="password"
                  value={config.secret_key || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, secret_key: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Region</Label>
                <Input
                  value={config.region || 'us-east-1'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, region: e.target.value },
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  checked={config.use_ssl || false}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      config: { ...config, use_ssl: checked },
                    })
                  }
                />
                <Label>Use SSL</Label>
              </div>
            </div>
          </div>
        )
      case 's3':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Access Key ID</Label>
                <Input
                  type="password"
                  value={config.access_key_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, access_key_id: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Secret Access Key</Label>
                <Input
                  type="password"
                  value={config.secret_access_key || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, secret_access_key: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bucket</Label>
                <Input
                  value={config.bucket || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, bucket: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Region</Label>
                <Input
                  value={config.region || 'us-east-1'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, region: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        )
      case 'sftp':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Host</Label>
                <Input
                  value={config.host || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, host: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Port</Label>
                <Input
                  type="number"
                  value={config.port || 22}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, port: parseInt(e.target.value) || 22 },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Username</Label>
                <Input
                  value={config.username || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, username: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={config.password || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, password: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Path</Label>
              <Input
                value={config.path || '/uploads'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, path: e.target.value },
                  })
                }
              />
            </div>
          </div>
        )
      case 'onedrive':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client ID</Label>
                <Input
                  value={config.client_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, client_id: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  value={config.client_secret || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, client_secret: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Tenant ID</Label>
              <Input
                value={config.tenant_id || 'common'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, tenant_id: e.target.value },
                  })
                }
                placeholder="common"
              />
            </div>
            <div>
              <Label>Redirect URI</Label>
              <Input
                value={config.redirect_uri || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, redirect_uri: e.target.value },
                  })
                }
                placeholder="https://yourapp.com/auth/onedrive/callback"
              />
            </div>
            <div>
              <Label>Folder Path (optional)</Label>
              <Input
                value={config.folder_path || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, folder_path: e.target.value },
                  })
                }
                placeholder="/Documents"
              />
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> After saving, you'll need to authenticate with OneDrive to
                get access and refresh tokens. Use the "Test Connection" button to initiate OAuth
                flow.
              </p>
            </div>
          </div>
        )
      case 'google_drive':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client ID</Label>
                <Input
                  value={config.client_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, client_id: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  value={config.client_secret || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, client_secret: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Redirect URI</Label>
              <Input
                value={config.redirect_uri || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, redirect_uri: e.target.value },
                  })
                }
                placeholder="https://yourapp.com/auth/google/callback"
              />
            </div>
            <div>
              <Label>Folder ID (optional)</Label>
              <Input
                value={config.folder_id || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, folder_id: e.target.value },
                  })
                }
                placeholder="1abc123def456..."
              />
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> After saving, you'll need to authenticate with Google Drive
                to get access and refresh tokens. Use the "Test Connection" button to initiate OAuth
                flow.
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6" />
            Storage Connections
          </h2>
          <p className="text-muted-foreground">
            Manage storage connections for MinIO, S3, SFTP, OneDrive, and Google Drive
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowDialog(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Storage Connections</CardTitle>
          <CardDescription>
            Configure and manage your storage provider connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No storage connections found. Click "Add Connection" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Tested</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((connection) => {
                  const typeInfo = STORAGE_TYPES.find((t) => t.value === connection.type)
                  const TypeIcon = typeInfo?.icon || HardDrive
                  return (
                    <TableRow key={connection.id}>
                      <TableCell className="font-medium">{connection.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4" />
                          {typeInfo?.label || connection.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(connection.status)}
                          <Badge
                            variant={
                              connection.status === 'connected'
                                ? 'default'
                                : connection.status === 'error'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {connection.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {connection.lastTested
                          ? new Date(connection.lastTested).toLocaleString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {connection.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTest(connection)}
                            disabled={testingId === connection.id}
                          >
                            {testingId === connection.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(connection)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(connection)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConnection ? 'Edit Storage Connection' : 'Create Storage Connection'}
            </DialogTitle>
            <DialogDescription>
              {editingConnection
                ? 'Update storage connection settings'
                : 'Configure a new storage connection'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Storage Connection"
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORAGE_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )}
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Active</Label>
            </div>
            <div className="border-t border-border pt-4">
              <Label className="text-base font-semibold mb-4 block">
                {STORAGE_TYPES.find((t) => t.value === formData.type)?.label} Configuration
              </Label>
              {renderConfigFields()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

