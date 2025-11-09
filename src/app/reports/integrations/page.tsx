'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Power,
  Activity,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Key,
  Link as LinkIcon
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { toast } from 'sonner'
import { PowerBIIntegration } from '@/components/reports/integrations/PowerBIIntegration'
import { GrafanaIntegration } from '@/components/reports/integrations/GrafanaIntegration'
import { LookerStudioIntegration } from '@/components/reports/integrations/LookerStudioIntegration'

export default function ReportsIntegrationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentSpace } = useSpace()
  const [activeTab, setActiveTab] = useState<string>('power-bi')
  const [integrations, setIntegrations] = useState<any[]>([])

  useEffect(() => {
    const source = searchParams.get('source')
    if (source) {
      setActiveTab(source)
    }
  }, [searchParams])

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/reports/integrations')
      if (!response.ok) {
        throw new Error('Failed to load integrations')
      }
      const data = await response.json()
      setIntegrations(data.integrations || [])
    } catch (error) {
      console.error('Error loading integrations:', error)
    }
  }

  useEffect(() => {
    loadIntegrations()
  }, [])

  const getIntegrationStatus = (source: string) => {
    const integration = integrations.find(i => i.source === source)
    return integration?.is_configured ? 'configured' : 'not-configured'
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Report Integrations</h1>
            <p className="text-muted-foreground">
              Configure and manage integrations with external reporting services
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/reports')}
          >
            Back to Reports
          </Button>
        </div>

        {/* Integration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="power-bi">
              <Power className="h-4 w-4 mr-2" />
              Power BI
              {getIntegrationStatus('power-bi') === 'configured' && (
                <CheckCircle className="h-3 w-3 ml-2 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="grafana">
              <Activity className="h-4 w-4 mr-2" />
              Grafana
              {getIntegrationStatus('grafana') === 'configured' && (
                <CheckCircle className="h-3 w-3 ml-2 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="looker-studio">
              <Eye className="h-4 w-4 mr-2" />
              Looker Studio
              {getIntegrationStatus('looker-studio') === 'configured' && (
                <CheckCircle className="h-3 w-3 ml-2 text-green-500" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="power-bi" className="mt-6">
            <PowerBIIntegration
              spaceId={currentSpace?.id}
              onSuccess={loadIntegrations}
            />
          </TabsContent>

          <TabsContent value="grafana" className="mt-6">
            <GrafanaIntegration
              spaceId={currentSpace?.id}
              onSuccess={loadIntegrations}
            />
          </TabsContent>

          <TabsContent value="looker-studio" className="mt-6">
            <LookerStudioIntegration
              spaceId={currentSpace?.id}
              onSuccess={loadIntegrations}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

