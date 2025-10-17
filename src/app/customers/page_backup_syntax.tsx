'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react'

type ApiCustomer = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  companies?: { name?: string | null } | null
  positions?: { name?: string | null } | null
  sources?: { name?: string | null } | null
  industries?: { name?: string | null } | null
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  const [companiesMulti, setCompaniesMulti] = useState<string[]>([])
  const [industriesMulti, setIndustriesMulti] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [companiesOptions, setCompaniesOptions] = useState<{ id: string, name: string }[]>([])
  const [industriesOptions, setIndustriesOptions] = useState<{ id: string, name: string }[]>([])
  const [sourcesOptions, setSourcesOptions] = useState<{ id: string, name: string }[]>([])
  const [eventsOptions, setEventsOptions] = useState<{ id: string, name: string }[]>([])
  const [positionsOptions, setPositionsOptions] = useState<{ id: string, name: string }[]>([])
  const [businessProfilesOptions, setBusinessProfilesOptions] = useState<{ id: string, name: string }[]>([])
  const [titlesOptions, setTitlesOptions] = useState<{ id: string, name: string }[]>([])
  const [callStatusesOptions, setCallStatusesOptions] = useState<{ id: string, name: string }[]>([])
  
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDataModelId, setCustomerDataModelId] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  const [sourcesMulti, setSourcesMulti] = useState<string[]>([])
  const [eventsMulti, setEventsMulti] = useState<string[]>([])
  const [positionsMulti, setPositionsMulti] = useState<string[]>([])
  const [businessProfilesMulti, setBusinessProfilesMulti] = useState<string[]>([])
  const [titlesMulti, setTitlesMulti] = useState<string[]>([])
  const [callStatusesMulti, setCallStatusesMulti] = useState<string[]>([])

  // Sorting and column filtering state
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({})
  const [showColumnFilters, setShowColumnFilters] = useState<Record<string, boolean>>({})

  const handleCustomerClick = (customer: any) => {
    setSelectedCustomer(customer)
    setShowCustomerDetail(true)
  }

  const handleBulkEdit = () => {
    console.log('Bulk edit selected customers:', selectedCustomers)
  }

  // Helper functions for sorting and filtering
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const handleColumnFilter = (field: string, value: any) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }))
    setPage(1)
  }

  const clearColumnFilter = (field: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[field]
      return newFilters
    })
    setPage(1)
  }

  const toggleColumnFilter = (field: string) => {
    setShowColumnFilters(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const getSelectOptions = (field: string) => {
    switch (field) {
      case 'company':
        return companiesOptions.map(c => ({ value: c.name, label: c.name }))
      case 'industry':
        return industriesOptions.map(i => ({ value: i.name, label: i.name }))
      case 'source':
        return sourcesOptions.map(s => ({ value: s.name, label: s.name }))
      case 'position':
        return positionsOptions.map(p => ({ value: p.name, label: p.name }))
      case 'status':
        return [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      default:
        return []
    }
  }

  const getColumnFilterComponent = (field: string, type: 'text' | 'select' | 'number' | 'date') => {
    const value = columnFilters[field] || ''
    const isOpen = showColumnFilters[field] || false

    if (!isOpen) {
      return (
        <button
          onClick={() => toggleColumnFilter(field)}
          className="ml-2 p-1 hover:bg-gray-100 rounded"
        >
          <Filter className="h-3 w-3" />
        </button>
      )
    }

    const renderFilterContent = () => {
      switch (type) {
        case 'text':
          return (
            <Input
              placeholder={`Filter ${field}...`}
              value={value}
              onChange={(e) => handleColumnFilter(field, e.target.value)}
              className="pr-6"
              onBlur={() => setTimeout(() => toggleColumnFilter(field), 200)}
            />
          )
        case 'select':
          const options = getSelectOptions(field)
          return (
            <select
              value={value}
              onChange={(e) => handleColumnFilter(field, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              onBlur={() => setTimeout(() => toggleColumnFilter(field), 200)}
            >
              <option value="">All {field}</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        case 'number':
          return (
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min"
                value={value?.min || ''}
                onChange={(e) => handleColumnFilter(field, { ...value, min: e.target.value })}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max"
                value={value?.max || ''}
                onChange={(e) => handleColumnFilter(field, { ...value, max: e.target.value })}
                className="w-full"
                onBlur={() => setTimeout(() => toggleColumnFilter(field), 200)}
              />
            </div>
          )
        case 'date':
          return (
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="From"
                value={value?.from || ''}
                onChange={(e) => handleColumnFilter(field, { ...value, from: e.target.value })}
                className="w-full"
              />
              <Input
                type="date"
                placeholder="To"
                value={value?.to || ''}
                onChange={(e) => handleColumnFilter(field, { ...value, to: e.target.value })}
                className="w-full"
                onBlur={() => setTimeout(() => toggleColumnFilter(field), 200)}
              />
            </div>
          )
        default:
          return null
      }
    }

    return (
      <div className="relative">
        <div className="absolute top-full left-0 z-10 bg-white border border-gray-300 rounded-md shadow-lg p-2 min-w-[200px]">
          {value && (
            <button
              onClick={() => clearColumnFilter(field)}
              className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {renderFilterContent()}
        </div>
      </div>
    )
  }

  async function loadCustomers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (companiesMulti.length) params.set('companies', companiesMulti.join(','))
      if (industriesMulti.length) params.set('industries', industriesMulti.join(','))
      if (sourcesMulti.length) params.set('sources', sourcesMulti.join(','))
      if (eventsMulti.length) params.set('events', eventsMulti.join(','))
      if (positionsMulti.length) params.set('positions', positionsMulti.join(','))
      if (businessProfilesMulti.length) params.set('business_profiles', businessProfilesMulti.join(','))
      if (titlesMulti.length) params.set('titles', titlesMulti.join(','))
      if (callStatusesMulti.length) params.set('call_statuses', callStatusesMulti.join(','))
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      
      // Add sorting parameters
      if (sortField) {
        params.set('sort', sortField)
        params.set('order', sortDirection)
      }
      
      // Add column filters
      Object.entries(columnFilters).forEach(([field, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (typeof value === 'object' && (value.min || value.max || value.from || value.to)) {
            if (value.min) params.set(`${field}_min`, value.min)
            if (value.max) params.set(`${field}_max`, value.max)
            if (value.from) params.set(`${field}_from`, value.from)
            if (value.to) params.set(`${field}_to`, value.to)
          } else {
            params.set(field, value)
          }
        }
      })
      
      params.set('limit', String(limit))
      params.set('page', String(page))

      const res = await fetch(`/api/customers?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load customers')
      const json = await res.json()
      setCustomers(json.customers || [])
      setTotalCount(json.pagination?.total || (json.customers?.length ?? 0))
    } finally {
      setLoading(false)
    }
  }

  async function loadCompaniesOptions() {
    try {
      const res = await fetch(`/api/companies?limit=200&page=1`)
      if (!res.ok) return
      const json = await res.json()
      const opts = (json.companies || []).map((c: any) => ({ id: c.id, name: c.name }))
      setCompaniesOptions(opts)
    } catch {}
  }

  async function loadIndustriesOptions() {
    try {
      const res = await fetch(`/api/industries?limit=200&page=1`)
      if (!res.ok) return
      const json = await res.json()
      const opts = (json.industries || []).map((i: any) => ({ id: i.id, name: i.name }))
      setIndustriesOptions(opts)
    } catch {}
  }

  async function loadSourcesOptions() {
    try {
      const res = await fetch(`/api/sources?limit=200&page=1`)
      if (!res.ok) return
      const json = await res.json()
      const opts = (json.sources || []).map((s: any) => ({ id: s.id, name: s.name }))
      setSourcesOptions(opts)
    } catch {}
  }

  async function loadEventsOptions() {
    try {
      const res = await fetch(`/api/events?limit=200&page=1`)
      if (!res.ok) return
      const json = await res.json()
      const opts = (json.events || []).map((e: any) => ({ id: e.id, name: e.name }))
      setEventsOptions(opts)
    } catch {}
  }

  async function loadPositionsOptions() {
    try {
      const res = await fetch(`/api/positions?limit=200&page=1`)
      if (!res.ok) return
      const json = await res.json()
      const opts = (json.positions || []).map((p: any) => ({ id: p.id, name: p.name }))
      setPositionsOptions(opts)
    } catch {}
  }

  async function loadBusinessProfilesOptions() {
    try {
      const res = await fetch(`/api/business-profiles?limit=200&page=1`)
      if (!res.ok) return
      const json = await res.json()
      const opts = (json.businessProfiles || []).map((b: any) => ({ id: b.id, name: b.name }))
      setBusinessProfilesOptions(opts)
    } catch {}
  }

  async function loadTitlesOptions() {
    try {
      const res = await fetch(`/api/titles?limit=200&page=1`)
      if (!res.ok) return
      const json = await res.json()
      const opts = (json.titles || []).map((t: any) => ({ id: t.id, name: t.name }))
      setTitlesOptions(opts)
    } catch {}
  }

  async function loadCallStatusesOptions() {
    try {
      const res = await fetch(`/api/call-workflow-statuses?limit=200&page=1`)
      if (!res.ok) return
      const json = await res.json()
      const opts = (json.statuses || []).map((s: any) => ({ id: s.id, name: s.name }))
      setCallStatusesOptions(opts)
    } catch {}
  }

  useEffect(() => {
    loadCustomers()
    loadCompaniesOptions()
    loadIndustriesOptions()
    loadSourcesOptions()
    loadEventsOptions()
    loadPositionsOptions()
    loadBusinessProfilesOptions()
    loadTitlesOptions()
    loadCallStatusesOptions()
  }, [])

  // Fetch Customer data model id for import/export
  useEffect(() => {
    async function fetchCustomerModelId() {
      try {
        const res = await fetch('/api/data-models?limit=100&search=Customer')
        if (!res.ok) return
        const json = await res.json()
        const models: any[] = json.dataModels || []
        const customerModel = models.find(m =>
          (m.name && m.name.toLowerCase() === 'customer') ||
          (m.display_name && m.display_name.toLowerCase() === 'customer')
        ) || models.find(m =>
          (m.name && m.name.toLowerCase().includes('customer')) ||
          (m.display_name && m.display_name.toLowerCase().includes('customer'))
        )
        if (customerModel?.id) setCustomerDataModelId(customerModel.id)
      } catch {}
    }
    fetchCustomerModelId()
  }, [])

  async function handleImportFileSelected(file: File) {
    if (!file || !customerDataModelId) return
    setImporting(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('dataModelId', customerDataModelId)
      form.append('mapping', JSON.stringify({}))
      const res = await fetch('/api/import-export/import', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Import failed')
        return
      }
      alert('Import started')
      setTimeout(() => { loadCustomers() }, 1000)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleExport(allSelectedOnly = false) {
    if (!customerDataModelId) return
    setExporting(true)
    try {
      const filters: any = {
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        companies: companiesMulti.length ? companiesMulti : undefined,
        industries: industriesMulti.length ? industriesMulti : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }
      if (allSelectedOnly && selectedCustomers.length > 0) {
        filters.ids = selectedCustomers
      }
      const res = await fetch('/api/import-export/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataModelId: customerDataModelId,
          format: 'xlsx',
          filters,
          columns: [],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Export failed')
        return
      }
      alert('Export job created')
    } finally {
      setExporting(false)
    }
  }

  // Refetch when filters change (debounced for search)
  useEffect(() => {
    const id = setTimeout(() => {
      loadCustomers()
    }, 300)
    return () => clearTimeout(id)
  }, [searchQuery, statusFilter, companiesMulti, industriesMulti, sourcesMulti, eventsMulti, positionsMulti, businessProfilesMulti, titlesMulti, callStatusesMulti, dateFrom, dateTo, page, limit, sortField, sortDirection, columnFilters])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customer data and relationships
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImportFileSelected(file)
              }}
            />
            <Button variant="outline" size="sm" disabled={!customerDataModelId || importing} onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {importing ? 'Importing…' : 'Import'}
            </Button>
            <Button variant="outline" size="sm" disabled={!customerDataModelId || exporting} onClick={() => handleExport(false)}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export'}
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="space-y-6">
        {/* Bulk Actions */}
        {selectedCustomers.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedCustomers.length} customer(s) selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleBulkEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Bulk Edit
                  </Button>
                      <Button variant="outline" size="sm" disabled={!customerDataModelId || exporting} onClick={() => handleExport(true)}>
                    <Download className="mr-2 h-4 w-4" />
                        {exporting ? 'Exporting…' : 'Export Selected'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customers Table */}
        <Card>
          <CardHeader>
                <CardTitle>Customers ({totalCount})</CardTitle>
            <CardDescription>
              Click on a customer to view details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                              setSelectedCustomers(customers.map(c => c.id))
                        } else {
                          setSelectedCustomers([])
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="relative">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('first_name')}
                        className="flex items-center space-x-1 hover:text-gray-600"
                      >
                        <span>Name</span>
                        {sortField === 'first_name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      {getColumnFilterComponent('name', 'text')}
                    </div>
                  </TableHead>
                  <TableHead className="relative">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center space-x-1 hover:text-gray-600"
                      >
                        <span>Email</span>
                        {sortField === 'email' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      {getColumnFilterComponent('email', 'text')}
                    </div>
                  </TableHead>
                  <TableHead className="relative">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('phone')}
                        className="flex items-center space-x-1 hover:text-gray-600"
                      >
                        <span>Phone</span>
                        {sortField === 'phone' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      {getColumnFilterComponent('phone', 'text')}
                    </div>
                  </TableHead>
                  <TableHead className="relative">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('company')}
                        className="flex items-center space-x-1 hover:text-gray-600"
                      >
                        <span>Company</span>
                        {sortField === 'company' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      {getColumnFilterComponent('company', 'select')}
                    </div>
                  </TableHead>
                  <TableHead className="relative">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('position')}
                        className="flex items-center space-x-1 hover:text-gray-600"
                      >
                        <span>Position</span>
                        {sortField === 'position' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      {getColumnFilterComponent('position', 'select')}
                    </div>
                  </TableHead>
                  <TableHead className="relative">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('source')}
                        className="flex items-center space-x-1 hover:text-gray-600"
                      >
                        <span>Source</span>
                        {sortField === 'source' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      {getColumnFilterComponent('source', 'select')}
                    </div>
                  </TableHead>
                  <TableHead className="relative">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('industry')}
                        className="flex items-center space-x-1 hover:text-gray-600"
                      >
                        <span>Industry</span>
                        {sortField === 'industry' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      {getColumnFilterComponent('industry', 'select')}
                    </div>
                  </TableHead>
                  <TableHead className="relative">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('is_active')}
                        className="flex items-center space-x-1 hover:text-gray-600"
                      >
                        <span>Status</span>
                        {sortField === 'is_active' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      {getColumnFilterComponent('status', 'select')}
                    </div>
                  </TableHead>
                  <TableHead className="relative">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('updated_at')}
                        className="flex items-center space-x-1 hover:text-gray-600"
                      >
                        <span>Last Contact</span>
                        {sortField === 'updated_at' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                      {getColumnFilterComponent('last_contact', 'date')}
                    </div>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {customers.map((customer) => (
                  <TableRow 
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          if (e.target.checked) {
                            setSelectedCustomers([...selectedCustomers, customer.id])
                          } else {
                            setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                          {customer.first_name} {customer.last_name}
                    </TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>{customer.companies?.name || '-'}</TableCell>
                        <TableCell>{customer.positions?.name || '-'}</TableCell>
                        <TableCell>{customer.sources?.name || '-'}</TableCell>
                        <TableCell>{customer.industries?.name || '-'}</TableCell>
                    <TableCell>
                          <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                            {customer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                        <TableCell>{customer.updated_at?.slice(0, 10) || customer.created_at?.slice(0, 10) || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleCustomerClick(customer)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                {loading && (
                  <div className="text-sm text-muted-foreground mt-4">Loading...</div>
                )}
                {/* Pagination Controls */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {Math.max(1, Math.ceil(totalCount / limit))}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={String(limit)}
                      onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value)) }}
                    >
                      <option value="10">10 / page</option>
                      <option value="25">25 / page</option>
                      <option value="50">50 / page</option>
                      <option value="100">100 / page</option>
                    </select>
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                    <Button variant="outline" size="sm" disabled={page >= Math.ceil(totalCount / limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
          </CardContent>
        </Card>
          </div>
        </div>

        {/* Customer Detail Modal */}
        <Dialog open={showCustomerDetail} onOpenChange={setShowCustomerDetail}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {selectedCustomer?.firstName} {selectedCustomer?.lastName}
              </DialogTitle>
              <DialogDescription>
                {selectedCustomer?.email} • {selectedCustomer?.phone}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Left Column - Customer Information */}
              <div className="col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">First Name</label>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.firstName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Name</label>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Company</label>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.company}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Position</label>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.position}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Source</label>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.source}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Industry</label>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.industry}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Contact</label>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.lastContact}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Show</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">No events associated</p>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Comments and Activity */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        No comments yet
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        Add Comment
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <div className="font-medium">Customer created</div>
                        <div className="text-muted-foreground">2 days ago by Admin User</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Email updated</div>
                        <div className="text-muted-foreground">1 day ago by Manager User</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
