'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Copy, 
  RefreshCw,
  FileText,
  Database,
  Users,
  Settings,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react'
import { useSpacePermissions } from '@/hooks/use-space-permissions'
import toast from 'react-hot-toast'

interface BulkOperation {
  id: string
  type: 'import' | 'export' | 'edit' | 'delete' | 'duplicate'
  name: string
  description: string
  icon: React.ReactNode
  color: string
  requiresConfirmation: boolean
  permissions: string[]
}

interface BulkOperationsPanelProps {
  spaceId: string
  dataModelId?: string
  onOperationComplete?: (operation: string, result: any) => void
}

const BULK_OPERATIONS: BulkOperation[] = [
  {
    id: 'import_csv',
    type: 'import',
    name: 'Import CSV',
    description: 'Import data from CSV file with field mapping',
    icon: <FileText className="h-5 w-5" />,
    color: 'bg-blue-500',
    requiresConfirmation: false,
    permissions: ['bulk:import']
  },
  {
    id: 'import_excel',
    type: 'import',
    name: 'Import Excel',
    description: 'Import data from Excel file with multiple sheets',
    icon: <FileText className="h-5 w-5" />,
    color: 'bg-green-500',
    requiresConfirmation: false,
    permissions: ['bulk:import']
  },
  {
    id: 'export_csv',
    type: 'export',
    name: 'Export CSV',
    description: 'Export selected records to CSV format',
    icon: <Download className="h-5 w-5" />,
    color: 'bg-purple-500',
    requiresConfirmation: false,
    permissions: ['bulk:export']
  },
  {
    id: 'export_excel',
    type: 'export',
    name: 'Export Excel',
    description: 'Export data to Excel with formatting',
    icon: <Download className="h-5 w-5" />,
    color: 'bg-indigo-500',
    requiresConfirmation: false,
    permissions: ['bulk:export']
  },
  {
    id: 'bulk_edit',
    type: 'edit',
    name: 'Bulk Edit',
    description: 'Edit multiple records at once',
    icon: <Edit className="h-5 w-5" />,
    color: 'bg-orange-500',
    requiresConfirmation: true,
    permissions: ['bulk:edit']
  },
  {
    id: 'bulk_delete',
    type: 'delete',
    name: 'Bulk Delete',
    description: 'Delete multiple records permanently',
    icon: <Trash2 className="h-5 w-5" />,
    color: 'bg-red-500',
    requiresConfirmation: true,
    permissions: ['bulk:delete']
  },
  {
    id: 'duplicate_records',
    type: 'duplicate',
    name: 'Duplicate Records',
    description: 'Create copies of selected records',
    icon: <Copy className="h-5 w-5" />,
    color: 'bg-teal-500',
    requiresConfirmation: false,
    permissions: ['record:create']
  }
]

export function BulkOperationsPanel({ spaceId, dataModelId, onOperationComplete }: BulkOperationsPanelProps) {
  const permissions = useSpacePermissions()
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [operationConfig, setOperationConfig] = useState<any>({})
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportFormat, setExportFormat] = useState('csv')
  const [bulkEditFields, setBulkEditFields] = useState<Record<string, any>>({})

  const canPerformOperation = useCallback((operation: BulkOperation) => {
    return operation.permissions.every(permission => 
      permissions.canEdit || permissions.canDelete || permissions.canCreate
    )
  }, [permissions])

  const handleOperationSelect = (operation: BulkOperation) => {
    if (!canPerformOperation(operation)) {
      toast.error('Insufficient permissions for this operation')
      return
    }
    setSelectedOperation(operation)
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('spaceId', spaceId)
      if (dataModelId) formData.append('dataModelId', dataModelId)

      const response = await fetch('/api/bulk/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = await response.json()
      setProgress(100)
      toast.success(`Successfully imported ${result.importedCount} records`)
      onOperationComplete?.('import', result)
    } catch (error) {
      toast.error('Import failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = async () => {
    setIsProcessing(true)
    setProgress(0)

    try {
      const params = new URLSearchParams({
        spaceId,
        format: exportFormat,
        ...(dataModelId && { dataModelId })
      })

      const response = await fetch(`/api/bulk/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${Date.now()}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setProgress(100)
      toast.success('Export completed successfully')
      onOperationComplete?.('export', { format: exportFormat })
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkEdit = async () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select records to edit')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const response = await fetch('/api/bulk/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordIds: selectedRecords,
          updates: bulkEditFields,
          spaceId,
          dataModelId
        })
      })

      if (!response.ok) {
        throw new Error('Bulk edit failed')
      }

      const result = await response.json()
      setProgress(100)
      toast.success(`Successfully updated ${result.updatedCount} records`)
      onOperationComplete?.('bulk_edit', result)
    } catch (error) {
      toast.error('Bulk edit failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select records to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedRecords.length} records? This action cannot be undone.`)) {
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const response = await fetch('/api/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordIds: selectedRecords,
          spaceId,
          dataModelId
        })
      })

      if (!response.ok) {
        throw new Error('Bulk delete failed')
      }

      const result = await response.json()
      setProgress(100)
      toast.success(`Successfully deleted ${result.deletedCount} records`)
      onOperationComplete?.('bulk_delete', result)
    } catch (error) {
      toast.error('Bulk delete failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderOperationContent = () => {
    if (!selectedOperation) return null

    switch (selectedOperation.type) {
      case 'import':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-file">Select File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="has-headers" />
              <Label htmlFor="has-headers">File has headers</Label>
            </div>
            <Button onClick={handleImport} disabled={!importFile || isProcessing}>
              {isProcessing ? 'Importing...' : 'Start Import'}
            </Button>
          </div>
        )

      case 'export':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="export-format">Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport} disabled={isProcessing}>
              {isProcessing ? 'Exporting...' : 'Start Export'}
            </Button>
          </div>
        )

      case 'edit':
        return (
          <div className="space-y-4">
            <div>
              <Label>Selected Records: {selectedRecords.length}</Label>
              <p className="text-sm text-muted-foreground">Configure the changes to apply to all selected records</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-edit-field">Field to Update</Label>
              <Input
                id="bulk-edit-field"
                placeholder="Field name"
                onChange={(e) => setBulkEditFields({ ...bulkEditFields, field: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-edit-value">New Value</Label>
              <Input
                id="bulk-edit-value"
                placeholder="New value"
                onChange={(e) => setBulkEditFields({ ...bulkEditFields, value: e.target.value })}
              />
            </div>
            <Button onClick={handleBulkEdit} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Update Records'}
            </Button>
          </div>
        )

      case 'delete':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Danger Zone</span>
              </div>
              <p className="text-sm text-red-700 mt-2">
                This will permanently delete {selectedRecords.length} records. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete Records'}
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bulk Operations</h2>
        <p className="text-muted-foreground">Perform bulk operations on your data</p>
      </div>

      <Tabs defaultValue="operations" className="w-full">
        <TabsList>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BULK_OPERATIONS.map((operation) => (
              <Card 
                key={operation.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedOperation?.id === operation.id ? 'ring-2 ring-primary' : ''
                } ${!canPerformOperation(operation) ? 'opacity-50' : ''}`}
                onClick={() => canPerformOperation(operation) && handleOperationSelect(operation)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${operation.color} text-white`}>
                      {operation.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{operation.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {operation.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {operation.requiresConfirmation && (
                      <Badge variant="outline" className="text-xs">Requires Confirmation</Badge>
                    )}
                    {!canPerformOperation(operation) && (
                      <Badge variant="secondary" className="text-xs">No Permission</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedOperation && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedOperation.color} text-white`}>
                      {selectedOperation.icon}
                    </div>
                    <div>
                      <CardTitle>{selectedOperation.name}</CardTitle>
                      <CardDescription>{selectedOperation.description}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOperation(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderOperationContent()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {isProcessing ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Processing...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  {progress}% complete
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No operations in progress</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Operation history will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
