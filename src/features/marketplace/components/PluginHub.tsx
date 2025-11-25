'use client'

/**
 * Plugin Hub UI Component
 * Manages plugins in the hub repository
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader, Search, Package, Download, RefreshCw, Plus } from 'lucide-react'
import { PluginDefinition, PluginCategory } from '../types'
import { showSuccess, showError } from '@/lib/toast-utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AddPluginDialog } from './AddPluginDialog'

export function PluginHub() {
  const [plugins, setPlugins] = useState<PluginDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [addPluginOpen, setAddPluginOpen] = useState(false)

  const categories: Array<{ value: PluginCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All Categories' },
    { value: 'business-intelligence', label: 'Business Intelligence' },
    { value: 'monitoring-observability', label: 'Monitoring & Observability' },
    { value: 'database-management', label: 'Database Management' },
    { value: 'storage-management', label: 'Storage Management' },
    { value: 'api-gateway', label: 'API Gateway' },
    { value: 'service-management', label: 'Service Management' },
    { value: 'data-integration', label: 'Data Integration' },
    { value: 'automation', label: 'Automation' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'security', label: 'Security' },
    { value: 'development-tools', label: 'Development Tools' },
    { value: 'other', label: 'Other' },
  ]

  const fetchPlugins = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/plugin-hub/plugins?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch plugins')
      }

      const data = await response.json()
      setPlugins(data.plugins || [])
    } catch (error) {
      console.error('Error fetching plugins:', error)
      showError('Failed to load plugins from hub')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlugins()
  }, [categoryFilter, statusFilter])

  const filteredPlugins = plugins.filter(plugin => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        plugin.name.toLowerCase().includes(query) ||
        plugin.description?.toLowerCase().includes(query) ||
        plugin.slug.toLowerCase().includes(query)
      )
    }
    return true
  })

  const handleInstall = async (plugin: PluginDefinition) => {
    try {
      const response = await fetch(`/api/plugin-hub/plugins/${plugin.slug}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Installation failed')
      }

      showSuccess(`Plugin "${plugin.name}" installed successfully!`)
      fetchPlugins() // Refresh list
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to install plugin')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plugin Hub</h1>
          <p className="text-muted-foreground mt-1">
            Manage and install plugins from the hub repository
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPlugins}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={addPluginOpen} onOpenChange={setAddPluginOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Plugin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <AddPluginDialog
                open={addPluginOpen}
                onOpenChange={setAddPluginOpen}
                onSuccess={() => {
                  setAddPluginOpen(false)
                  fetchPlugins()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plugins Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPlugins.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No plugins found matching your search' : 'No plugins in hub'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map((plugin) => (
            <Card key={plugin.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{plugin.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {plugin.description || 'No description'}
                    </CardDescription>
                  </div>
                  {plugin.verified && (
                    <Badge variant="default" className="ml-2">Verified</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>v{plugin.version}</span>
                    <span>•</span>
                    <span>{plugin.provider}</span>
                    <span>•</span>
                    <Badge variant="outline">{plugin.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleInstall(plugin)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Install
                    </Button>
                    {plugin.documentationUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(plugin.documentationUrl, '_blank')}
                      >
                        Docs
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

