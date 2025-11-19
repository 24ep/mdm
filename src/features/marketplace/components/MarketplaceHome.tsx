'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Download, Star, ExternalLink, Loader, AlertCircle, RefreshCw } from 'lucide-react'
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
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { currentSpace } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    spaceId || currentSpace?.id || 'all'
  )
  const categoryFromUrl = searchParams?.get('category') as PluginCategory | null
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>(
    categoryFromUrl || 'all'
  )

  // Update category when URL changes
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl)
    }
  }, [categoryFromUrl])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDefinition | null>(null)
  const [showInstallWizard, setShowInstallWizard] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

  const effectiveSpaceId = showSpaceSelector
    ? selectedSpaceId === 'all'
      ? null
      : selectedSpaceId
    : spaceId

  const { plugins, loading, error, refetch } = useMarketplacePlugins({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    spaceId: effectiveSpaceId,
  })

  const { install, loading: installing } = usePluginInstallation()

  const handleRegisterPlugins = async () => {
    setRegistering(true)
    setRegisterError(null)
    setRegisterSuccess(false)
    try {
      const response = await fetch('/api/marketplace/plugins/register', {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to register plugins' }))
        throw new Error(errorData.error || 'Failed to register plugins')
      }
      setRegisterSuccess(true)
      // Refetch plugins after registration
      await refetch()
      setTimeout(() => setRegisterSuccess(false), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register plugins'
      setRegisterError(errorMessage)
      console.error('Error registering plugins:', err)
    } finally {
      setRegistering(false)
    }
  }

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
          <p className="text-muted-foreground">
            Discover and install plugins to extend functionality
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            onClick={handleRegisterPlugins}
            disabled={registering}
          >
            {registering ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Register Plugins
              </>
            )}
          </Button>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes('does not exist') && isAdmin && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegisterPlugins}
                  disabled={registering}
                >
                  {registering ? 'Registering...' : 'Register Plugins'}
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {registerError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{registerError}</AlertDescription>
        </Alert>
      )}

      {registerSuccess && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Plugins registered successfully! They should appear below.</AlertDescription>
        </Alert>
      )}

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
            <div className="col-span-full text-center py-12 space-y-4">
              <div className="text-muted-foreground">
                <p className="text-lg font-medium mb-2">No plugins found.</p>
                <p className="text-sm">
                  {error 
                    ? 'There was an error loading plugins. Please check the error message above.'
                    : 'No approved plugins are available in the marketplace.'}
                </p>
                {isAdmin && !error && (
                  <div className="mt-4">
                    <p className="text-sm mb-2">As an admin, you can register plugins to make them available.</p>
                    <Button
                      variant="outline"
                      onClick={handleRegisterPlugins}
                      disabled={registering}
                    >
                      {registering ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Register Plugins
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
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

