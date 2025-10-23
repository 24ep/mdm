'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  Database, 
  Activity, 
  Settings,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Eye,
  Edit,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Key,
  HardDrive,
  Cpu,
  MemoryStick,
  Server,
  Globe
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface CacheInstance {
  id: string
  name: string
  type: 'redis' | 'memcached' | 'memory' | 'file'
  host: string
  port: number
  isActive: boolean
  status: 'connected' | 'disconnected' | 'error'
  lastConnected?: Date
  memory: {
    used: number
    total: number
    peak: number
  }
  stats: {
    hits: number
    misses: number
    evictions: number
    expired: number
    keys: number
  }
}

interface CacheKey {
  key: string
  type: string
  size: number
  ttl?: number
  lastAccessed?: Date
  hitCount: number
  isExpired: boolean
}

interface CacheStats {
  totalKeys: number
  memoryUsage: number
  hitRate: number
  missRate: number
  evictionRate: number
  avgResponseTime: number
  connections: number
  commandsPerSecond: number
}

interface CacheConfig {
  maxMemory: string
  evictionPolicy: string
  ttl: number
  compression: boolean
  persistence: boolean
  clustering: boolean
}

export function CacheManagement() {
  const [instances, setInstances] = useState<CacheInstance[]>([])
  const [keys, setKeys] = useState<CacheKey[]>([])
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [config, setConfig] = useState<CacheConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateInstance, setShowCreateInstance] = useState(false)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<CacheInstance | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [newInstance, setNewInstance] = useState({
    name: '',
    type: 'redis' as const,
    host: '',
    port: 6379,
    password: ''
  })

  const [newKey, setNewKey] = useState({
    key: '',
    value: '',
    ttl: 3600
  })

  useEffect(() => {
    loadInstances()
    loadStats()
    loadConfig()
  }, [])

  useEffect(() => {
    if (selectedInstance) {
      loadKeys(selectedInstance.id)
    }
  }, [selectedInstance])

  const loadInstances = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/cache-instances')
      if (response.ok) {
        const data = await response.json()
        setInstances(data.instances.map((instance: any) => ({
          ...instance,
          lastConnected: instance.lastConnected ? new Date(instance.lastConnected) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading cache instances:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadKeys = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/admin/cache-instances/${instanceId}/keys`)
      if (response.ok) {
        const data = await response.json()
        setKeys(data.keys.map((key: any) => ({
          ...key,
          lastAccessed: key.lastAccessed ? new Date(key.lastAccessed) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading cache keys:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/cache-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading cache stats:', error)
    }
  }

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/cache-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Error loading cache config:', error)
    }
  }

  const createInstance = async () => {
    try {
      const response = await fetch('/api/admin/cache-instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInstance)
      })

      if (response.ok) {
        setShowCreateInstance(false)
        setNewInstance({
          name: '',
          type: 'redis',
          host: '',
          port: 6379,
          password: ''
        })
        loadInstances()
      }
    } catch (error) {
      console.error('Error creating cache instance:', error)
    }
  }

  const testConnection = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/admin/cache-instances/${instanceId}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        loadInstances()
      }
    } catch (error) {
      console.error('Error testing connection:', error)
    }
  }

  const createKey = async () => {
    if (!selectedInstance || !newKey.key || !newKey.value) return

    try {
      const response = await fetch(`/api/admin/cache-instances/${selectedInstance.id}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey)
      })

      if (response.ok) {
        setShowKeyDialog(false)
        setNewKey({
          key: '',
          value: '',
          ttl: 3600
        })
        loadKeys(selectedInstance.id)
      }
    } catch (error) {
      console.error('Error creating cache key:', error)
    }
  }

  const deleteKey = async (key: string) => {
    if (!selectedInstance) return

    try {
      const response = await fetch(`/api/admin/cache-instances/${selectedInstance.id}/keys/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadKeys(selectedInstance.id)
      }
    } catch (error) {
      console.error('Error deleting cache key:', error)
    }
  }

  const clearCache = async (instanceId: string) => {
    if (!confirm('Are you sure you want to clear all cache keys?')) return

    try {
      const response = await fetch(`/api/admin/cache-instances/${instanceId}/clear`, {
        method: 'POST'
      })

      if (response.ok) {
        loadKeys(instanceId)
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCacheIcon = (type: string) => {
    switch (type) {
      case 'redis':
        return <Database className="h-4 w-4 text-red-500" />
      case 'memcached':
        return <Database className="h-4 w-4 text-blue-500" />
      case 'memory':
        return <MemoryStick className="h-4 w-4 text-green-500" />
      case 'file':
        return <HardDrive className="h-4 w-4 text-yellow-500" />
      default:
        return <Zap className="h-4 w-4 text-gray-500" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const filteredKeys = keys.filter(key => 
    key.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Cache Management
          </h2>
          <p className="text-muted-foreground">
            Cache instances, keys, performance monitoring, and optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadInstances} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Cache Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalKeys.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                Active cache keys
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hitRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">
                Cache efficiency
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.memoryUsage)}</div>
              <div className="text-xs text-muted-foreground">
                Cache memory
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commands/sec</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.commandsPerSecond}</div>
              <div className="text-xs text-muted-foreground">
                Throughput
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="instances" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instances">Instances</TabsTrigger>
          <TabsTrigger value="keys">Keys</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Cache Instances</h3>
            <Dialog open={showCreateInstance} onOpenChange={setShowCreateInstance}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Instance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Cache Instance</DialogTitle>
                  <DialogDescription>
                    Configure a new cache instance
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="instance-name">Instance Name</Label>
                      <Input
                        id="instance-name"
                        value={newInstance.name}
                        onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                        placeholder="Redis Cache"
                      />
                    </div>
                    <div>
                      <Label htmlFor="instance-type">Cache Type</Label>
                      <Select value={newInstance.type} onValueChange={(value: any) => setNewInstance({ ...newInstance, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="redis">Redis</SelectItem>
                          <SelectItem value="memcached">Memcached</SelectItem>
                          <SelectItem value="memory">In-Memory</SelectItem>
                          <SelectItem value="file">File Cache</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="instance-host">Host</Label>
                      <Input
                        id="instance-host"
                        value={newInstance.host}
                        onChange={(e) => setNewInstance({ ...newInstance, host: e.target.value })}
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <Label htmlFor="instance-port">Port</Label>
                      <Input
                        id="instance-port"
                        type="number"
                        value={newInstance.port}
                        onChange={(e) => setNewInstance({ ...newInstance, port: parseInt(e.target.value) })}
                        placeholder="6379"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="instance-password">Password (Optional)</Label>
                    <Input
                      id="instance-password"
                      type="password"
                      value={newInstance.password}
                      onChange={(e) => setNewInstance({ ...newInstance, password: e.target.value })}
                      placeholder="password"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateInstance(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createInstance} disabled={!newInstance.name || !newInstance.host}>
                    Create Instance
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map(instance => (
              <Card key={instance.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getCacheIcon(instance.type)}
                      {instance.name}
                    </CardTitle>
                    {getStatusIcon(instance.status)}
                  </div>
                  <CardDescription>
                    {instance.host}:{instance.port} • {instance.type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(instance.status)}>
                      {instance.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>{formatBytes(instance.memory.used)} / {formatBytes(instance.memory.total)}</span>
                    </div>
                    <Progress value={(instance.memory.used / instance.memory.total) * 100} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Keys:</span>
                      <div className="font-medium">{instance.stats.keys.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hit Rate:</span>
                      <div className="font-medium">
                        {((instance.stats.hits / (instance.stats.hits + instance.stats.misses)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedInstance(instance)
                        loadKeys(instance.id)
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Keys
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnection(instance.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => clearCache(instance.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keys" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Cache Keys</h3>
            {selectedInstance && (
              <div className="flex items-center gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search keys..."
                  className="w-64"
                />
                <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Cache Key</DialogTitle>
                      <DialogDescription>
                        Add a new key-value pair to the cache
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="key-name">Key</Label>
                        <Input
                          id="key-name"
                          value={newKey.key}
                          onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                          placeholder="user:123"
                        />
                      </div>
                      <div>
                        <Label htmlFor="key-value">Value</Label>
                        <Textarea
                          id="key-value"
                          value={newKey.value}
                          onChange={(e) => setNewKey({ ...newKey, value: e.target.value })}
                          placeholder="Cache value"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="key-ttl">TTL (seconds)</Label>
                        <Input
                          id="key-ttl"
                          type="number"
                          value={newKey.ttl}
                          onChange={(e) => setNewKey({ ...newKey, ttl: parseInt(e.target.value) })}
                          placeholder="3600"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowKeyDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createKey} disabled={!newKey.key || !newKey.value}>
                        Add Key
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {selectedInstance ? (
            <div className="space-y-4">
              {filteredKeys.map(key => (
                <Card key={key.key}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{key.key}</div>
                        <div className="text-sm text-muted-foreground">
                          {key.type} • {formatBytes(key.size)} • {key.hitCount} hits
                        </div>
                        {key.ttl && (
                          <div className="text-xs text-muted-foreground">
                            TTL: {key.ttl}s
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {key.isExpired && (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteKey(key.key)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Cache Instance</h3>
              <p className="text-muted-foreground">
                Choose a cache instance to view and manage keys
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h3 className="text-lg font-semibold">Cache Analytics</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hit/Miss Ratio</CardTitle>
                <CardDescription>Cache performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Hits', value: stats?.hitRate || 0, fill: '#00C49F' },
                        { name: 'Misses', value: stats?.missRate || 0, fill: '#FF8042' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Cache memory utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instances.map(instance => (
                    <div key={instance.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{instance.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatBytes(instance.memory.used)} / {formatBytes(instance.memory.total)}
                        </span>
                      </div>
                      <Progress value={(instance.memory.used / instance.memory.total) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <h3 className="text-lg font-semibold">Cache Configuration</h3>
          {config && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Memory Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="max-memory">Max Memory</Label>
                    <Input
                      id="max-memory"
                      value={config.maxMemory}
                      placeholder="1gb"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eviction-policy">Eviction Policy</Label>
                    <Select value={config.evictionPolicy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allkeys-lru">All Keys LRU</SelectItem>
                        <SelectItem value="allkeys-lfu">All Keys LFU</SelectItem>
                        <SelectItem value="volatile-lru">Volatile LRU</SelectItem>
                        <SelectItem value="volatile-lfu">Volatile LFU</SelectItem>
                        <SelectItem value="noeviction">No Eviction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="default-ttl">Default TTL (seconds)</Label>
                    <Input
                      id="default-ttl"
                      type="number"
                      value={config.ttl}
                      placeholder="3600"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch checked={config.compression} />
                      <Label>Enable Compression</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={config.persistence} />
                      <Label>Enable Persistence</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={config.clustering} />
                      <Label>Enable Clustering</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
