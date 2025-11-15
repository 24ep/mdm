'use client'

import { useState } from 'react'
import { useMarketplacePlugins } from '../hooks/useMarketplacePlugins'
import { usePluginInstallation } from '../hooks/usePluginInstallation'
import { PluginDefinition, PluginCategory } from '../types'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Download, Star, ExternalLink, Loader } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { PluginCard } from './PluginCard'
import { InstallationWizard } from './InstallationWizard'

export interface MarketplaceHomeProps {
  spaceId?: string | null
  showSpaceSelector?: boolean
}

/**
 * Single-source MarketplaceHome component
 * Can be used in both space-scoped and admin views
 */
export function MarketplaceHome({
  spaceId = null,
  showSpaceSelector = false,
}: MarketplaceHomeProps) {
  const { currentSpace } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    spaceId || currentSpace?.id || 'all'
  )
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDefinition | null>(null)
  const [showInstallWizard, setShowInstallWizard] = useState(false)

  const effectiveSpaceId = showSpaceSelector
    ? selectedSpaceId === 'all'
      ? null
      : selectedSpaceId
    : spaceId

  const { plugins, loading, refetch } = useMarketplacePlugins({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    spaceId: effectiveSpaceId,
  })

  const { install, loading: installing } = usePluginInstallation()

  const filteredPlugins = plugins.filter((plugin) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        plugin.name?.toLowerCase().includes(query) ||
        plugin.description?.toLowerCase().includes(query) ||
        plugin.provider?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const handleInstall = async (plugin: PluginDefinition) => {
    const effectiveSpace = effectiveSpaceId || currentSpace?.id
    if (!effectiveSpace) {
      alert('Please select a space to install the plugin')
      return
    }

    setSelectedPlugin(plugin)
    setShowInstallWizard(true)
  }

  const handleInstallationComplete = async (
    plugin: PluginDefinition,
    config: Record<string, any>,
    credentials?: Record<string, any>
  ) => {
    const effectiveSpace = effectiveSpaceId || currentSpace?.id
    if (!effectiveSpace) {
      return
    }

    await install(plugin.id, effectiveSpace, config)
    setShowInstallWizard(false)
    setSelectedPlugin(null)
    refetch()
  }

  const categories: Array<{ value: PluginCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All Categories' },
    { value: 'business-intelligence', label: 'Business Intelligence' },
    { value: 'service-management', label: 'Service Management' },
    { value: 'data-integration', label: 'Data Integration' },
    { value: 'automation', label: 'Automation' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
          <p className="text-muted-foreground">
            Discover and install plugins to extend functionality
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {showSpaceSelector && (
          <SpaceSelector
            value={selectedSpaceId}
            onValueChange={setSelectedSpaceId}
            className="w-[200px]"
            showAllOption={true}
          />
        )}

        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as PluginCategory | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No plugins found.
            </div>
          ) : (
            filteredPlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onInstall={() => handleInstall(plugin)}
                installing={installing}
              />
            ))
          )}
        </div>
      )}

      {/* Installation Wizard */}
      {showInstallWizard && selectedPlugin && (
        <InstallationWizard
          plugin={selectedPlugin}
          spaceId={effectiveSpaceId || currentSpace?.id || ''}
          open={showInstallWizard}
          onOpenChange={setShowInstallWizard}
          onComplete={handleInstallationComplete}
        />
      )}
    </div>
  )
}

