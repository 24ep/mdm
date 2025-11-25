'use client'

import { useState, useEffect } from 'react'
import { PluginInstallation } from '@/features/marketplace/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Database,
  File,
  Settings,
  RefreshCw,
  Loader,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Folder,
  HardDrive,
} from 'lucide-react'
import { useMinIO } from '@/features/infrastructure/hooks/useMinIO'
import { showSuccess, showError } from '@/lib/toast-utils'
import { formatFileSize } from '@/lib/formatters'

export interface MinIOManagementUIProps {
  installation: PluginInstallation
  config?: Record<string, any>
}

interface MinIOObject {
  name: string
  size: number
  lastModified: Date
  etag?: string
}

export default function MinIOManagementUI({
  installation,
  config = {},
}: MinIOManagementUIProps) {
  // Get instanceId from config or installation
  const instanceId = config?.instanceId || installation.config?.instanceId

  const { buckets, loading, error, refetch, createBucket, deleteBucket } = useMinIO(instanceId)
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [objects, setObjects] = useState<MinIOObject[]>([])
  const [loadingObjects, setLoadingObjects] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateBucket, setShowCreateBucket] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [creatingBucket, setCreatingBucket] = useState(false)
  const [bucketToDelete, setBucketToDelete] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (selectedBucket && instanceId) {
      loadObjects()
    }
  }, [selectedBucket, instanceId])

  const loadObjects = async () => {
    if (!selectedBucket || !instanceId) return

    setLoadingObjects(true)
    try {
      const response = await fetch(`/api/minio/${instanceId}/buckets/${selectedBucket}`)
      if (!response.ok) {
        throw new Error('Failed to load objects')
      }
      const data = await response.json()
      setObjects(
        (data.objects || []).map((obj: any) => ({
          name: obj.name,
          size: obj.size || 0,
          lastModified: new Date(obj.lastModified),
          etag: obj.etag,
        }))
      )
    } catch (err) {
      console.error('Error loading objects:', err)
      showError('Failed to load objects')
    } finally {
      setLoadingObjects(false)
    }
  }

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      showError('Bucket name is required')
      return
    }

    setCreatingBucket(true)
    try {
      await createBucket(newBucketName.trim())
      showSuccess('Bucket created successfully!')
      setShowCreateBucket(false)
      setNewBucketName('')
      refetch()
    } catch (err: any) {
      showError(err.message || 'Failed to create bucket')
    } finally {
      setCreatingBucket(false)
    }
  }

  const handleDeleteBucket = async () => {
    if (!bucketToDelete) return

    try {
      await deleteBucket(bucketToDelete)
      showSuccess('Bucket deleted successfully!')
      if (selectedBucket === bucketToDelete) {
        setSelectedBucket(null)
        setObjects([])
      }
      setBucketToDelete(null)
      refetch()
    } catch (err: any) {
      showError(err.message || 'Failed to delete bucket')
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !selectedBucket || !instanceId) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('bucket', selectedBucket)

      const response = await fetch(`/api/minio/${instanceId}/objects`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload file')
      }

      showSuccess('File uploaded successfully!')
      setShowUploadDialog(false)
      setUploadFile(null)
      loadObjects()
    } catch (err: any) {
      showError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (objectName: string) => {
    if (!selectedBucket || !instanceId) return

    try {
      const response = await fetch(
        `/api/minio/${instanceId}/buckets/${selectedBucket}/objects/${encodeURIComponent(objectName)}`
      )
      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = objectName.split('/').pop() || objectName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showSuccess('File downloaded successfully!')
    } catch (err: any) {
      showError(err.message || 'Failed to download file')
    }
  }

  const handleDeleteObject = async (objectName: string) => {
    if (!selectedBucket || !instanceId) return
    if (!confirm(`Are you sure you want to delete "${objectName}"?`)) return

    try {
      const response = await fetch(
        `/api/minio/${instanceId}/buckets/${selectedBucket}/objects/${encodeURIComponent(objectName)}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete object')
      }

      showSuccess('Object deleted successfully!')
      loadObjects()
    } catch (err: any) {
      showError(err.message || 'Failed to delete object')
    }
  }

  const filteredObjects = objects.filter((obj) =>
    obj.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalSize = objects.reduce((sum, obj) => sum + obj.size, 0)

  if (!instanceId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>MinIO instance ID not configured.</p>
            <p className="text-sm mt-2">
              Please configure the instanceId in the plugin installation settings.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="w-full">
        <Tabs defaultValue="buckets">
          <TabsList>
            <TabsTrigger value="buckets">
              <Database className="h-4 w-4 mr-2" />
              Buckets
            </TabsTrigger>
            <TabsTrigger value="objects" disabled={!selectedBucket}>
              <File className="h-4 w-4 mr-2" />
              Objects {selectedBucket && `(${selectedBucket})`}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buckets" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">MinIO Buckets</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your object storage buckets using MinIO SDK
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button size="sm" onClick={() => setShowCreateBucket(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Bucket
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-destructive">
                    <p>{error}</p>
                    <Button onClick={() => refetch()} variant="outline" className="mt-4">
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : buckets.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No buckets found.</p>
                    <p className="text-sm mt-2">Create your first bucket to get started.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buckets.map((bucket: any) => (
                  <Card
                    key={bucket.name}
                    className={selectedBucket === bucket.name ? 'ring-2 ring-primary' : ''}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">{bucket.name}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBucketToDelete(bucket.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <CardDescription>
                        Created: {bucket.creationDate ? new Date(bucket.creationDate).toLocaleDateString() : 'Unknown'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {bucket.objectCount !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Objects:</span>
                            <Badge variant="secondary">{bucket.objectCount}</Badge>
                          </div>
                        )}
                        {bucket.size !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Size:</span>
                            <span className="font-medium">{formatFileSize(bucket.size)}</span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedBucket(bucket.name)
                            // Switch to objects tab
                            const tabsTrigger = document.querySelector('[value="objects"]') as HTMLElement
                            tabsTrigger?.click()
                          }}
                        >
                          <File className="h-4 w-4 mr-2" />
                          View Objects
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="objects" className="space-y-4">
            {selectedBucket ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Objects in {selectedBucket}</h3>
                    <p className="text-sm text-muted-foreground">
                      {objects.length} object(s) • {formatFileSize(totalSize)} total
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={loadObjects}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search objects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loadingObjects ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredObjects.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8 text-muted-foreground">
                        <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{searchQuery ? 'No objects match your search' : 'No objects in this bucket'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="border rounded-lg divide-y">
                    {filteredObjects.map((obj) => (
                      <div
                        key={obj.name}
                        className="p-4 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{obj.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(obj.size)}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {obj.lastModified.toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(obj.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteObject(obj.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Please select a bucket to view objects</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connection Settings</CardTitle>
                <CardDescription>
                  MinIO connection configuration (using MinIO SDK on backend)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Instance ID</label>
                    <div className="mt-1 text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                      {instanceId}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Installation ID</label>
                    <div className="mt-1 text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                      {installation.id}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      This plugin uses the MinIO SDK on the backend to manage buckets and objects.
                      All operations are performed through secure API endpoints.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Bucket Dialog */}
      <Dialog open={showCreateBucket} onOpenChange={setShowCreateBucket}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bucket</DialogTitle>
            <DialogDescription>
              Enter a name for the new bucket. Bucket names must be unique and follow S3 naming conventions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bucket Name</label>
              <Input
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                placeholder="my-bucket-name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateBucket()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBucket(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBucket} disabled={creatingBucket || !newBucketName.trim()}>
              {creatingBucket ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bucket Confirmation */}
      <AlertDialog open={!!bucketToDelete} onOpenChange={() => setBucketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bucket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the bucket "{bucketToDelete}"? This will delete all
              objects in the bucket and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBucket} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Object</DialogTitle>
            <DialogDescription>
              Upload a file to the bucket "{selectedBucket}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">File</label>
              <Input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadFile}>
              {uploading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
