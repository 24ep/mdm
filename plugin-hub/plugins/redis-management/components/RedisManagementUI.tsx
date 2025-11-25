'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Search, Trash2, Key, Database, Activity } from 'lucide-react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { InstanceService, InfrastructureInstance } from '@/features/infrastructure/types'

interface RedisManagementUIProps {
  service: InstanceService
  instance: InfrastructureInstance
  config: any
  onConfigUpdate: (newConfig: any) => void
}

interface RedisKey {
  key: string
  type: string
  ttl: number | null
  size: number
}

interface RedisStats {
  connectedClients: number
  usedMemory: string
  totalKeys: number
  hitRate: number
  commandsProcessed: number
}

export function RedisManagementUI({
  service,
  instance,
  config,
  onConfigUpdate,
}: RedisManagementUIProps) {
  const [keys, setKeys] = useState<RedisKey[]>([])
  const [stats, setStats] = useState<RedisStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [keyValue, setKeyValue] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [service, config])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadKeys(), loadStats()])
    } catch (err: any) {
      setError(err.message || 'Failed to load Redis data')
    } finally {
      setLoading(false)
    }
  }

  const loadKeys = async () => {
    try {
      // In a real implementation, this would call the Redis API through the service
      // For now, we'll simulate with the service endpoints
      const endpoint = service.endpoints?.find((e: any) => e.type === 'redis')
      if (!endpoint) {
        throw new Error('Redis endpoint not found')
      }

      // Simulated keys - in production, this would fetch from Redis
      const mockKeys: RedisKey[] = [
        { key: 'user:123', type: 'string', ttl: 3600, size: 128 },
        { key: 'session:abc', type: 'string', ttl: 1800, size: 256 },
        { key: 'cache:data', type: 'hash', ttl: null, size: 1024 },
      ]
      setKeys(mockKeys)
    } catch (err: any) {
      console.error('Error loading keys:', err)
      setError(err.message)
    }
  }

  const loadStats = async () => {
    try {
      // Simulated stats - in production, this would fetch from Redis INFO command
      const mockStats: RedisStats = {
        connectedClients: 5,
        usedMemory: '2.5 MB',
        totalKeys: 150,
        hitRate: 0.95,
        commandsProcessed: 1250,
      }
      setStats(mockStats)
    } catch (err: any) {
      console.error('Error loading stats:', err)
    }
  }

  const loadKeyValue = async (key: string) => {
    try {
      setSelectedKey(key)
      // In production, this would fetch the actual key value from Redis
      setKeyValue('Sample value for key: ' + key)
    } catch (err: any) {
      console.error('Error loading key value:', err)
    }
  }

  const deleteKey = async (key: string) => {
    if (!confirm(`Are you sure you want to delete key "${key}"?`)) {
      return
    }

    try {
      // In production, this would delete the key from Redis
      setKeys(keys.filter((k) => k.key !== key))
      if (selectedKey === key) {
        setSelectedKey(null)
        setKeyValue(null)
      }
    } catch (err: any) {
      console.error('Error deleting key:', err)
      alert('Failed to delete key')
    }
  }

  const filteredKeys = keys.filter((key) =>
    key.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="p-4 border border-destructive rounded-lg">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={loadData} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="w-full">
        <Tabs defaultValue="keys">
          <TabsList>
          <TabsTrigger value="keys">Keys</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={loadKeys} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="border rounded-lg">
            <div className="divide-y">
              {filteredKeys.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No keys found
                </div>
              ) : (
                filteredKeys.map((key) => (
                  <div
                    key={key.key}
                    className="p-4 hover:bg-accent cursor-pointer"
                    onClick={() => loadKeyValue(key.key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{key.key}</span>
                        <Badge variant="outline">{key.type}</Badge>
                        {key.ttl && (
                          <Badge variant="secondary">
                            TTL: {key.ttl}s
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {key.size} bytes
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteKey(key.key)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedKey && (
            <Card>
              <CardHeader>
                <CardTitle>Key: {selectedKey}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {typeof keyValue === 'string'
                    ? keyValue
                    : JSON.stringify(keyValue, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Connected Clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.connectedClients}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Used Memory</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.usedMemory}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Keys</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalKeys}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Hit Rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats.hitRate * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Button onClick={loadStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Statistics
          </Button>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

