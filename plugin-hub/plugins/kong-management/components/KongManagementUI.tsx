'use client'

import { useState, useEffect } from 'react'
import { InstanceService, InfrastructureInstance } from '@/features/infrastructure/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Globe, Plus } from 'lucide-react'
import { Loader } from 'lucide-react'

export interface KongManagementUIProps {
  service: InstanceService
  instance: InfrastructureInstance
  config: Record<string, any>
}

export default function KongManagementUI({
  service,
  instance,
  config,
}: KongManagementUIProps) {
  const [routes, setRoutes] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // TODO: Implement actual Kong API calls
      // For now, return mock data
      setRoutes([
        { id: '1', name: 'api-route-1', paths: ['/api/v1'], service: 'service-1' },
        { id: '2', name: 'api-route-2', paths: ['/api/v2'], service: 'service-2' },
      ])
      setServices([
        { id: '1', name: 'service-1', url: 'http://backend:8000' },
        { id: '2', name: 'service-2', url: 'http://backend2:8000' },
      ])
    } catch (error) {
      console.error('Error loading Kong data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kong API Gateway</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Routes</CardTitle>
              <CardDescription>API routes configured in Kong</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Paths</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No routes configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    routes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">{route.name}</TableCell>
                        <TableCell>
                          {route.paths.map((path: string) => (
                            <Badge key={path} variant="outline" className="mr-1">
                              {path}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell>{route.service}</TableCell>
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

          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Backend services registered in Kong</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No services registered
                      </TableCell>
                    </TableRow>
                  ) : (
                    services.map((svc) => (
                      <TableRow key={svc.id}>
                        <TableCell className="font-medium">{svc.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            {svc.url}
                          </div>
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
        </>
      )}
    </div>
  )
}

