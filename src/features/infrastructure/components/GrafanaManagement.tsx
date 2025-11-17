'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Database, Bell, Users, Settings, RefreshCw, Loader, Plus } from 'lucide-react'
import { useGrafana } from '../hooks/useGrafana'

export interface GrafanaManagementProps {
  instanceId: string
}

export function GrafanaManagement({ instanceId }: GrafanaManagementProps) {
  const { dashboards, dataSources, alerts, users, loading, error, refetch } = useGrafana(instanceId)

  return (
    <div className="space-y-6">
      <div className="w-full">
        <Tabs defaultValue="dashboards">
        <TabsList>
          <TabsTrigger value="dashboards">
            <BarChart className="h-4 w-4 mr-2" />
            Dashboards
          </TabsTrigger>
          <TabsTrigger value="datasources">
            <Database className="h-4 w-4 mr-2" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboards" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Grafana Dashboards</h3>
              <p className="text-sm text-muted-foreground">
                Manage your Grafana dashboards
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
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
                      <TableHead>Title</TableHead>
                      <TableHead>UID</TableHead>
                      <TableHead>Folder</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No dashboards found
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboards.map((dashboard: any) => (
                        <TableRow key={dashboard.uid || dashboard.id}>
                          <TableCell className="font-medium">{dashboard.title || dashboard.name}</TableCell>
                          <TableCell>
                            <code className="text-xs">{dashboard.uid || dashboard.id}</code>
                          </TableCell>
                          <TableCell>{dashboard.folderTitle || dashboard.folder || 'General'}</TableCell>
                          <TableCell>
                            {dashboard.tags && dashboard.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {dashboard.tags.map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
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

        <TabsContent value="datasources" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Data Sources</h3>
              <p className="text-sm text-muted-foreground">
                Configured data sources in Grafana
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Data Source
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
                      <TableHead>URL</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataSources.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No data sources configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      dataSources.map((ds: any) => (
                        <TableRow key={ds.id}>
                          <TableCell className="font-medium">{ds.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ds.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{ds.url || '-'}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ds.access === 'proxy' ? 'default' : 'secondary'}>
                              {ds.access || 'direct'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
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
              <h3 className="text-lg font-semibold">Alert Rules</h3>
              <p className="text-sm text-muted-foreground">
                Configured alert rules in Grafana
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
                      <TableHead>State</TableHead>
                      <TableHead>Dashboard</TableHead>
                      <TableHead>Last Evaluation</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No alerts configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      alerts.map((alert: any) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.name || alert.title}</TableCell>
                          <TableCell>
                            <Badge variant={alert.state === 'ok' ? 'default' : 'destructive'}>
                              {alert.state || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{alert.dashboardName || '-'}</TableCell>
                          <TableCell>
                            {alert.newStateDate 
                              ? new Date(alert.newStateDate).toLocaleString()
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
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

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Users</h3>
              <p className="text-sm text-muted-foreground">
                Grafana users and permissions
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
                      <TableHead>Email</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Seen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name || user.login}</TableCell>
                          <TableCell>{user.email || '-'}</TableCell>
                          <TableCell>{user.login}</TableCell>
                          <TableCell>
                            <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                              {user.isAdmin ? 'Admin' : user.role || 'Viewer'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.lastSeenAt 
                              ? new Date(user.lastSeenAt).toLocaleString()
                              : 'Never'}
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

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
              <CardDescription>
                Grafana API configuration for this instance
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

