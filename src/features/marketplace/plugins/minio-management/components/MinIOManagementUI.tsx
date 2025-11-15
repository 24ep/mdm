'use client'

import { useState, useEffect } from 'react'
import { InstanceService, InfrastructureInstance } from '@/features/infrastructure/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Database, File } from 'lucide-react'
import { Loader } from 'lucide-react'

export interface MinIOManagementUIProps {
  service: InstanceService
  instance: InfrastructureInstance
  config: Record<string, any>
}

export default function MinIOManagementUI({
  service,
  instance,
  config,
}: MinIOManagementUIProps) {
  const [buckets, setBuckets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBuckets()
  }, [])

  const loadBuckets = async () => {
    try {
      setLoading(true)
      // TODO: Implement actual MinIO API call
      // For now, return mock data
      setBuckets([
        { name: 'default-bucket', creationDate: new Date() },
        { name: 'backup-bucket', creationDate: new Date() },
      ])
    } catch (error) {
      console.error('Error loading buckets:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">MinIO Buckets</h3>
        <Button variant="outline" size="sm" onClick={loadBuckets}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No buckets found
            </div>
          ) : (
            buckets.map((bucket) => (
              <Card key={bucket.name}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{bucket.name}</CardTitle>
                  </div>
                  <CardDescription>
                    Created: {new Date(bucket.creationDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">
                    <File className="h-4 w-4 mr-2" />
                    View Objects
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

