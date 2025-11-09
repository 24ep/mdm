'use client'

import { useState, lazy, Suspense } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2, ExternalLink } from 'lucide-react'

// Lazy load embed components for better performance
const PowerBIEmbed = lazy(() => import('./PowerBIEmbed').then(m => ({ default: m.PowerBIEmbed })))
const GrafanaEmbed = lazy(() => import('./GrafanaEmbed').then(m => ({ default: m.GrafanaEmbed })))

interface ReportEmbedPreviewProps {
  report: {
    id: string
    name: string
    embed_url?: string
    link?: string
    source: string
    access_type?: string
    metadata?: {
      sdk_config?: string
      api_url?: string
      api_key?: string
      dashboard_uid?: string
      report_id?: string
      embed_token?: string
      [key: string]: any
    }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportEmbedPreview({ report, open, onOpenChange }: ReportEmbedPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const embedUrl = report.embed_url || report.link
  const accessType = report.access_type?.toUpperCase()
  const metadata = report.metadata || {}

  // Determine if we should use SDK embedding
  const useSDK = accessType === 'SDK'
  const isPowerBI = report.source === 'POWER_BI' || report.source === 'power-bi'
  const isGrafana = report.source === 'GRAFANA' || report.source === 'grafana'

  // Parse SDK config for Power BI
  let powerBIConfig: { embedUrl?: string; accessToken?: string; reportId?: string } = {}
  if (useSDK && isPowerBI && metadata.sdk_config) {
    try {
      const sdkConfig = typeof metadata.sdk_config === 'string' 
        ? JSON.parse(metadata.sdk_config) 
        : metadata.sdk_config
      powerBIConfig = {
        embedUrl: sdkConfig.embedUrl || sdkConfig.embed_url || embedUrl,
        accessToken: sdkConfig.accessToken || sdkConfig.access_token || metadata.embed_token,
        reportId: sdkConfig.reportId || sdkConfig.report_id || metadata.report_id
      }
    } catch (err) {
      console.error('Error parsing Power BI SDK config:', err)
    }
  }

  // Get Grafana config
  const grafanaConfig = useSDK && isGrafana ? {
    apiUrl: metadata.api_url || '',
    apiKey: metadata.api_key || '',
    dashboardUid: metadata.dashboard_uid || metadata.dashboardUid || '',
    orgId: metadata.org_id || metadata.orgId || 1
  } : null

  // Fallback to iframe if no SDK config or not SDK type
  const useIframe = !useSDK || 
    (isPowerBI && (!powerBIConfig.embedUrl || !powerBIConfig.accessToken)) ||
    (isGrafana && (!grafanaConfig?.apiUrl || !grafanaConfig?.apiKey || !grafanaConfig?.dashboardUid))

  if (!embedUrl && useIframe) {
    if (useSDK && isPowerBI && !powerBIConfig.embedUrl) {
      return null // SDK config missing
    }
    if (useSDK && isGrafana && !grafanaConfig?.dashboardUid) {
      return null // SDK config missing
    }
  }

  const height = isFullscreen ? 'calc(95vh - 120px)' : '600px'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isFullscreen ? 'max-w-[95vw] h-[95vh] p-0' : 'max-w-4xl'}>
        <DialogHeader className={isFullscreen ? 'p-6 pb-0' : ''}>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{report.name}</DialogTitle>
              <DialogDescription>
                {report.source} Report Preview {useSDK && '(SDK)'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fullscreen
                  </>
                )}
              </Button>
              {embedUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(embedUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className={isFullscreen ? 'flex-1 p-6' : 'p-6'}>
          <Suspense fallback={
            <div className="flex items-center justify-center" style={{ height, minHeight: '400px' }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading embed...</p>
              </div>
            </div>
          }>
            {useSDK && isPowerBI && powerBIConfig.embedUrl && powerBIConfig.accessToken ? (
              <PowerBIEmbed
                embedUrl={powerBIConfig.embedUrl}
                accessToken={powerBIConfig.accessToken}
                reportId={powerBIConfig.reportId}
                height={height}
                className="w-full"
              />
            ) : useSDK && isGrafana && grafanaConfig?.apiUrl && grafanaConfig?.apiKey && grafanaConfig?.dashboardUid ? (
              <GrafanaEmbed
                apiUrl={grafanaConfig.apiUrl}
                apiKey={grafanaConfig.apiKey}
                dashboardUid={grafanaConfig.dashboardUid}
                orgId={grafanaConfig.orgId}
                height={height}
                className="w-full"
              />
            ) : useIframe && embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full border rounded-lg"
                style={{ 
                  height,
                  minHeight: '400px'
                }}
                allowFullScreen
                title={report.name}
              />
            ) : (
              <div className="flex items-center justify-center" style={{ height, minHeight: '400px' }}>
                <p className="text-muted-foreground">No embed configuration available</p>
              </div>
            )}
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  )
}

