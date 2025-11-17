'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Target, FileText, Bell, Settings, RefreshCw, Loader, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { usePrometheus } from '../hooks/usePrometheus'

export interface PrometheusManagementProps {
  instanceId: string
}

export function PrometheusManagement({ instanceId }: PrometheusManagementProps) {
  const { targets, rules, alerts, loading, error, refetch, queryPromQL } = usePrometheus(instanceId)
  const [query, setQuery] = useState('up')
  const [queryResult, setQueryResult] = useState<any>(null)
  const [queryLoading, setQueryLoading] = useState(false)

  const handleQuery = async () => {
    setQueryLoading(true)
    try {
      const result = await queryPromQL(query)
      setQueryResult(result)
    } catch (err) {
      setQueryResult({ error: err instanceof Error ? err.message : 'Query failed' })
    } finally {
      setQueryLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="w-full">
        <Tabs defaultValue="targets">
        <TabsList>
          <TabsTrigger value="targets">
            <Target className="h-4 w-4 mr-2" />
            Targets
          </TabsTrigger>
          <TabsTrigger value="rules">
            <FileText className="h-4 w-4 mr-2" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="query">
            <Search className="h-4 w-4 mr-2" />
            Query
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="targets" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Scrape Targets</h3>
              <p className="text-sm text-muted-foreground">
                Prometheus scrape targets and their status
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  {error}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Instance</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Last Scrape</TableHead>
                      <TableHead>Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No targets configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      targets.map((target: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{target.job || '-'}</TableCell>
                          <TableCell>
                            <code className="text-xs">{target.instance || target.scrapeUrl || '-'}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={target.health === 'up' ? 'default' : 'destructive'}>
                              {target.health || target.state || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {target.lastScrape 
                              ? new Date(target.lastScrape * 1000).toLocaleString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {target.lastError ? (
                              <span className="text-xs text-destructive">{target.lastError}</span>
                            ) : (
                              <Badge variant="outline">Healthy</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recording & Alerting Rules</h3>
              <p className="text-sm text-muted-foreground">
                Prometheus recording and alerting rules
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  {error}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Last Evaluation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No rules configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      rules.map((rule: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{rule.name || rule.alert || rule.record}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {rule.type || (rule.alert ? 'alerting' : 'recording')}
                            </Badge>
                          </TableCell>
                          <TableCell>{rule.group || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={rule.health === 'ok' ? 'default' : 'destructive'}>
                              {rule.health || rule.state || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {rule.lastEvaluation 
                              ? new Date(rule.lastEvaluation * 1000).toLocaleString()
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Currently firing alerts in Prometheus
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  {error}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert Name</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Active Since</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No active alerts
                        </TableCell>
                      </TableRow>
                    ) : (
                      alerts.map((alert: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{alert.alertname || alert.name}</TableCell>
                          <TableCell>
                            <Badge variant={alert.state === 'firing' ? 'destructive' : 'default'}>
                              {alert.state || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{alert.severity || 'warning'}</Badge>
                          </TableCell>
                          <TableCell>
                            {alert.activeAt 
                              ? new Date(alert.activeAt * 1000).toLocaleString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{alert.value || '-'}</code>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">PromQL Query</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Execute PromQL queries against this Prometheus instance
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="up"
                    className="flex-1"
                  />
                  <Button onClick={handleQuery} disabled={queryLoading}>
                    {queryLoading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Execute
                  </Button>
                </div>

                {queryResult && (
                  <div className="mt-4">
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-96">
                      {JSON.stringify(queryResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
              <CardDescription>
                Prometheus API configuration for this instance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Instance ID</label>
                  <div className="mt-1 text-sm text-muted-foreground">{instanceId}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Connection details are managed through the infrastructure service configuration.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}

