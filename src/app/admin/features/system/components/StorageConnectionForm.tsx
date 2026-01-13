'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Cloud,
    Server,
} from 'lucide-react'
import { StorageProviderType } from '@/lib/storage-config'

export const STORAGE_TYPES: { value: StorageProviderType; label: string; icon: any }[] = [
    { value: 'minio', label: 'MinIO', icon: Server },
    { value: 's3', label: 'AWS S3', icon: Cloud },
    { value: 'sftp', label: 'SFTP', icon: Server },
    { value: 'onedrive', label: 'OneDrive', icon: Cloud },
    { value: 'google_drive', label: 'Google Drive', icon: Cloud },
]

export interface StorageConnectionFormData {
    name: string
    type: StorageProviderType
    description: string
    isActive: boolean
    config: any
}

interface StorageConnectionFormProps {
    initialData?: Partial<StorageConnectionFormData>
    onSubmit: (data: StorageConnectionFormData) => void
    onCancel: () => void
    isLoading?: boolean
}

export function StorageConnectionForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}: StorageConnectionFormProps) {
    const [formData, setFormData] = useState<StorageConnectionFormData>({
        name: '',
        type: 'minio',
        description: '',
        isActive: true,
        config: getDefaultConfig('minio'),
        ...initialData,
    })

    // Update default config when type changes if not editing an existing connection with that type
    // effectively we just want to reset config if type changes manually
    const handleTypeChange = (type: string) => {
        const storageType = type as StorageProviderType
        setFormData({
            ...formData,
            type: storageType,
            config: getDefaultConfig(storageType),
        })
    }

    function getDefaultConfig(type: StorageProviderType) {
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
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <Label>Description</Label>
                <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                />
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label>Active</Label>
            </div>

            <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-4">Configuration</h3>
                {renderConfigFields()}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button onClick={() => onSubmit(formData)} disabled={isLoading || !formData.name}>
                    {isLoading ? 'Saving...' : 'Save Connection'}
                </Button>
            </div>
        </div>
    )
}
