'use client'

import React, { useMemo, useState } from 'react'
import { useSpace } from '@/contexts/space-context'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  Edit,
  Trash2,
  FileDown,
  Play
} from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'

// Mock data for demonstration
const mockImportJobs = [
  {
    id: '1',
    fileName: 'customers_import_2024.xlsx',
    dataModel: 'Customer',
    status: 'COMPLETED',
    progress: 100,
    totalRows: 500,
    processedRows: 500,
    errorRows: 0,
    createdBy: 'Admin User',
    createdAt: '2024-01-15 10:30:00',
    completedAt: '2024-01-15 10:35:00',
    errors: null
  },
  {
    id: '2',
    fileName: 'companies_import_2024.csv',
    dataModel: 'Company',
    status: 'PROCESSING',
    progress: 75,
    totalRows: 200,
    processedRows: 150,
    errorRows: 5,
    createdBy: 'Manager User',
    createdAt: '2024-01-15 11:00:00',
    completedAt: null,
    errors: [
      { row: 45, field: 'email', message: 'Invalid email format' },
      { row: 67, field: 'name', message: 'Name is required' },
      { row: 89, field: 'phone', message: 'Invalid phone number format' },
      { row: 123, field: 'website', message: 'Invalid URL format' },
      { row: 156, field: 'industry', message: 'Invalid industry category' }
    ]
  },
  {
    id: '3',
    fileName: 'events_import_2024.xlsx',
    dataModel: 'Event',
    status: 'FAILED',
    progress: 0,
    totalRows: 50,
    processedRows: 0,
    errorRows: 50,
    createdBy: 'User',
    createdAt: '2024-01-15 09:15:00',
    completedAt: '2024-01-15 09:16:00',
    errors: [
      { row: 1, field: 'start_date', message: 'Invalid date format' },
      { row: 2, field: 'end_date', message: 'End date must be after start date' }
    ]
  }
]

const mockExportJobs = [
  {
    id: '1',
    fileName: 'customers_export_2024.xlsx',
    dataModel: 'Customer',
    status: 'COMPLETED',
    progress: 100,
    format: 'xlsx',
    filters: { status: 'active', industry: 'technology' },
    columns: ['firstName', 'lastName', 'email', 'phone', 'company'],
    createdBy: 'Admin User',
    createdAt: '2024-01-15 14:30:00',
    completedAt: '2024-01-15 14:32:00'
  },
  {
    id: '2',
    fileName: 'assignments_export_2024.csv',
    dataModel: 'Assignment',
    status: 'PROCESSING',
    progress: 60,
    format: 'csv',
    filters: { status: 'in_progress' },
    columns: ['title', 'description', 'status', 'assignedTo', 'dueDate'],
    createdBy: 'Manager User',
    createdAt: '2024-01-15 15:00:00',
    completedAt: null
  }
]

const statusColors = {
  PENDING: 'bg-yellow-500',
  PROCESSING: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500',
  CANCELLED: 'bg-gray-500'
}

const statusIcons = {
  PENDING: Clock,
  PROCESSING: RefreshCw,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
  CANCELLED: X
}

export default function ImportExportPage() {
  const { currentSpace } = useSpace()
  const disabled = !!currentSpace && (currentSpace.features?.bulk_activity === false || (currentSpace as any).enable_bulk_activity === false)
  const [selectedDataModel, setSelectedDataModel] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('xlsx')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportMode, setExportMode] = useState<'profile' | 'custom'>('profile')
  const [selectedProfile, setSelectedProfile] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [filters, setFilters] = useState<Array<{ attribute: string; operator: string; value: string }>>([
    { attribute: '', operator: 'equals', value: '' }
  ])
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set())
  const [exportProfiles, setExportProfiles] = useState<any[]>([])
  const [exportingProfile, setExportingProfile] = useState<string | null>(null)

  const dataModels = [
    'Customer', 'Company', 'Source', 'Industry', 'Event', 
    'Position', 'Business Profile', 'Title', 'Call Workflow Status'
  ]

  // Fetch export profiles on component mount
  React.useEffect(() => {
    fetchExportProfiles()
  }, [])

  const fetchExportProfiles = async () => {
    try {
      const response = await fetch('/api/export-profiles')
      if (response.ok) {
        const data = await response.json()
        setExportProfiles(data.profiles || [])
      }
    } catch (error) {
      console.error('Error fetching export profiles:', error)
    }
  }

  const handleQuickExport = async (profileId: string) => {
    setExportingProfile(profileId)
    try {
      const response = await fetch(`/api/export-profiles/${profileId}/execute`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export_${new Date().toISOString().split('T')[0]}.xlsx`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Export error:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExportingProfile(null)
    }
  }

  const availableColumns = useMemo(() => {
    return [
      'firstName',
      'lastName',
      'email',
      'phone',
      'status',
      'createdAt',
      'updatedAt',
      'company.name',
      'company.industry',
      'industry.name',
      'source.name'
    ]
  }, [])

  const availableProfiles = [
    { id: 'customers_active_xlsx', name: 'Customers - Active (XLSX)', model: 'Customer' },
    { id: 'companies_all_csv', name: 'Companies - All (CSV)', model: 'Company' }
  ]

  const handleImport = () => {
    // Implement import functionality
    console.log('Import started for:', selectedDataModel, importFile)
    setImportDialogOpen(false)
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Export started for:', {
      model: selectedDataModel,
      format: selectedFormat,
      mode: exportMode,
      profile: selectedProfile,
      columns: selectedColumns,
      filters
    })
    setExportDialogOpen(false)
  }

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons]
    return <Icon className="h-4 w-4" />
  }

  const toggleErrorExpansion = (jobId: string) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Activity</h1>
          {disabled ? (
            <p className="text-muted-foreground">This feature is disabled for the current space.</p>
          ) : (
            <p className="text-muted-foreground">Import, export, and bulk update data with validation and progress tracking</p>
          )}
        </div>

        {!disabled && (
        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="flex justify-start w-full p-4 gap-0">
            <TabsTrigger value="import" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary">
              <Upload className="h-4 w-4" />
              Import Data
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary">
              <Download className="h-4 w-4" />
              Export Data
            </TabsTrigger>
            <TabsTrigger value="bulk-update" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-primary">
              <Edit className="h-4 w-4" />
              Bulk Update
            </TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="flex-1 overflow-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Monitor and manage your import queue</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.location.href = '/import-profiles'}>
                  <Settings className="mr-2 h-4 w-4" /> Manage Profiles
                </Button>
                <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" /> New Import
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import data</DialogTitle>
                    <DialogDescription>Select model and upload file to start import</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data Model</label>
                      <select
                        value={selectedDataModel}
                        onChange={(e) => setSelectedDataModel(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Choose a data model...</option>
                        {dataModels.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload File</label>
                      <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center block cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        />
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Drag and drop or click to browse</p>
                        <p className="text-xs text-gray-500">CSV or Excel up to 10MB</p>
                        {importFile && (
                          <div className="mt-2 text-sm">Selected: <span className="font-medium">{importFile.name}</span></div>
                        )}
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleImport} disabled={!selectedDataModel || !importFile}>
                      <Upload className="mr-2 h-4 w-4" /> Start Import
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            {/* Import Jobs */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Import Jobs</h3>
                <p className="text-sm text-muted-foreground">Track the progress of your import operations</p>
              </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockImportJobs.map((job) => (
                      <>
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.fileName}</TableCell>
                          <TableCell>{job.dataModel}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${statusColors[job.status as keyof typeof statusColors]} text-white flex items-center gap-1`}>
                              {getStatusIcon(job.status)}
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-56">
                            <div className="flex items-center gap-2">
                              <Progress value={job.progress} className="h-2 w-full" />
                              <span className="text-sm">{job.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{job.processedRows}/{job.totalRows}</TableCell>
                          <TableCell>
                            {job.errorRows > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                  <span className="text-red-600 font-medium">{job.errorRows}</span>
                                </div>
                                {job.errors && job.errors.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleErrorExpansion(job.id)}
                                    className="h-6 w-6 p-0 hover:bg-red-50"
                                    title="View error details"
                                  >
                                    {expandedErrors.has(job.id) ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>{job.createdBy}</TableCell>
                          <TableCell>{job.createdAt}</TableCell>
                          <TableCell>
                            {job.status === 'PROCESSING' && (
                              <Button variant="ghost" size="sm" title="Cancel">
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {/* Error details row */}
                        {job.errors && job.errors.length > 0 && expandedErrors.has(job.id) && (
                          <TableRow>
                            <TableCell colSpan={9} className="p-0">
                              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-sm font-medium text-red-700">
                                      Validation Errors ({job.errors.length} total)
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleErrorExpansion(job.id)}
                                    className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                                    title="Hide error details"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                {/* Error summary */}
                                <div className="mb-3 p-2 bg-red-100 rounded text-xs text-red-700">
                                  <strong>Summary:</strong> {job.errors.length} validation errors found. 
                                  Most common issues: {Array.from(new Set(job.errors.map(e => e.field))).slice(0, 3).join(', ')}
                                </div>
                                
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {job.errors.map((error, index) => (
                                    <div key={index} className="text-sm text-red-600 bg-white p-3 rounded border border-red-200 hover:bg-red-25 transition-colors">
                                      <div className="flex items-start gap-2">
                                        <span className="font-medium text-red-800">Row {error.row}:</span>
                                        <div className="flex-1">
                                          <span className="font-medium text-red-700">{error.field}:</span> {error.message}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="flex-1 overflow-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Export using a saved profile or custom filters</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.location.href = '/export-profiles'}>
                  <Settings className="mr-2 h-4 w-4" /> Manage Profiles
                </Button>
                <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Download className="mr-2 h-4 w-4" /> New Export
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export data</DialogTitle>
                    <DialogDescription>Choose a profile or define custom filters and columns</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data Model</label>
                        <select value={selectedDataModel} onChange={(e) => setSelectedDataModel(e.target.value)} className="w-full p-2 border rounded-md">
                          <option value="">Choose a data model...</option>
                          {dataModels.map((model) => (<option key={model} value={model}>{model}</option>))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Format</label>
                        <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="xlsx" id="xlsx" />
                            <label htmlFor="xlsx" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Excel (.xlsx)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="csv" id="csv" />
                            <label htmlFor="csv" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              CSV (.csv)
                            </label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Export Mode</label>
                        <RadioGroup value={exportMode} onValueChange={(value) => setExportMode(value as 'profile' | 'custom')} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="profile" id="profile" />
                            <label htmlFor="profile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Use existing profile
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="custom" />
                            <label htmlFor="custom" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Custom
                            </label>
                          </div>
                        </RadioGroup>
                      </div>

                      {exportMode === 'profile' ? (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Export Profile</label>
                          <select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} className="w-full p-2 border rounded-md">
                            <option value="">Choose a profile...</option>
                            {availableProfiles.filter((p) => !selectedDataModel || p.model === selectedDataModel).map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Columns</label>
                            <div className="border rounded-md p-3 max-h-36 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-2">
                                {availableColumns.map((column) => {
                                  const checked = selectedColumns.includes(column)
                                  return (
                                    <label key={column} className="flex items-center gap-2 text-sm">
                                      <input type="checkbox" checked={checked} onChange={(e) => {
                                        setSelectedColumns((prev) => {
                                          if (e.target.checked) return Array.from(new Set([...prev, column]))
                                          return prev.filter((c) => c !== column)
                                        })
                                      }} />
                                      <span>{column}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Filters</label>
                            <div className="space-y-2">
                              {filters.map((f, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2">
                                  <select className="col-span-5 p-2 border rounded-md text-sm" value={f.attribute} onChange={(e) => {
                                    const v = e.target.value
                                    setFilters((prev) => prev.map((it, i) => i === idx ? { ...it, attribute: v } : it))
                                  }}>
                                    <option value="">Select attribute...</option>
                                    {availableColumns.map((c) => (<option key={c} value={c}>{c}</option>))}
                                  </select>
                                  <select className="col-span-3 p-2 border rounded-md text-sm" value={f.operator} onChange={(e) => {
                                    const v = e.target.value
                                    setFilters((prev) => prev.map((it, i) => i === idx ? { ...it, operator: v } : it))
                                  }}>
                                    <option value="equals">equals</option>
                                    <option value="not_equals">not equals</option>
                                    <option value="contains">contains</option>
                                    <option value="starts_with">starts with</option>
                                    <option value="gt">greater than</option>
                                    <option value="lt">less than</option>
                                  </select>
                                  <input className="col-span-3 p-2 border rounded-md text-sm" placeholder="Value" value={f.value} onChange={(e) => {
                                    const v = e.target.value
                                    setFilters((prev) => prev.map((it, i) => i === idx ? { ...it, value: v } : it))
                                  }} />
                                  <div className="col-span-1 flex items-center justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setFilters((prev) => prev.filter((_, i) => i !== idx))}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <Button variant="outline" size="sm" onClick={() => setFilters((prev) => [...prev, { attribute: '', operator: 'equals', value: '' }])}>Add Filter</Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleExport} disabled={!selectedDataModel || (exportMode === 'profile' ? !selectedProfile : selectedColumns.length === 0)}>
                      <Download className="mr-2 h-4 w-4" /> Start Export
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            {/* Quick Export Profiles */}
            {exportProfiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Export</CardTitle>
                  <CardDescription>Export data using your saved profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exportProfiles.map((profile) => (
                      <div key={profile.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{profile.name}</h4>
                            {profile.description && (
                              <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>
                            )}
                          </div>
                          <Badge variant="outline">{profile.format.toUpperCase()}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Model: {profile.data_model}</div>
                          <div>Columns: {profile.columns?.length || 0}</div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleQuickExport(profile.id)}
                          disabled={exportingProfile === profile.id}
                        >
                          {exportingProfile === profile.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Export Now
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Jobs */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Export Jobs</h3>
                <p className="text-sm text-muted-foreground">Track the progress of your export operations</p>
              </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Columns</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockExportJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.fileName}</TableCell>
                        <TableCell>{job.dataModel}</TableCell>
                        <TableCell>{job.format.toUpperCase()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusColors[job.status as keyof typeof statusColors]} text-white flex items-center gap-1`}>
                            {getStatusIcon(job.status)}
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-56">
                          <div className="flex items-center gap-2">
                            <Progress value={job.progress} className="h-2 w-full" />
                            <span className="text-sm">{job.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{job.columns.length}</TableCell>
                        <TableCell>{job.createdBy}</TableCell>
                        <TableCell>{job.createdAt}</TableCell>
                        <TableCell className="space-x-2">
                          {job.status === 'COMPLETED' && (
                            <Button variant="outline" size="sm" title="Download">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {job.status === 'PROCESSING' && (
                            <Button variant="ghost" size="sm" title="Cancel">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
          </TabsContent>

          {/* Bulk Update Tab */}
          <TabsContent value="bulk-update" className="flex-1 overflow-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Monitor and manage bulk update operations</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                  <Settings className="mr-2 h-4 w-4" /> Configure Chunk Size
                </Button>
              </div>
            </div>

            {/* Bulk Update Jobs */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Bulk Update Jobs</h3>
                <p className="text-sm text-muted-foreground">Track the progress of your bulk update operations</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead>Data Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Chunk Size</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No bulk update operations yet. Select records from entity pages to start bulk operations.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </MainLayout>
  )
}
