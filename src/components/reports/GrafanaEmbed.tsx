'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

interface GrafanaEmbedProps {
  apiUrl: string
  apiKey: string
  dashboardUid: string
  orgId?: number
  timeRange?: { from: string; to: string }
  height?: string
  className?: string
  panelId?: number
}

export function GrafanaEmbed({ 
  apiUrl, 
  apiKey, 
  dashboardUid, 
  orgId = 1, 
  timeRange,
  height = '600px',
  className = '',
  panelId
}: GrafanaEmbedProps) {
  const [embedUrl, setEmbedUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmbedUrl = async () => {
      try {
        setLoading(true)
        setError(null)

        // First, verify the dashboard exists and get its details
        const dashboardResponse = await fetch(`${apiUrl}/dashboards/uid/${dashboardUid}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!dashboardResponse.ok) {
          if (dashboardResponse.status === 404) {
            throw new Error('Dashboard not found')
          } else if (dashboardResponse.status === 401 || dashboardResponse.status === 403) {
            throw new Error('Unauthorized: Check your API key')
          }
          throw new Error(`Failed to fetch dashboard: ${dashboardResponse.statusText}`)
        }
        
        const dashboardData = await dashboardResponse.json()
        const dashboard = dashboardData.dashboard

        // Build embed URL with parameters
        const params = new URLSearchParams({
          orgId: orgId.toString(),
          from: timeRange?.from || 'now-6h',
          to: timeRange?.to || 'now',
          theme: 'dark',
          kiosk: 'tv' // TV mode for cleaner embedding
        })

        if (panelId) {
          params.append('viewPanel', panelId.toString())
        }

        // Construct the embed URL
        const baseUrl = apiUrl.replace('/api', '')
        const embedPath = `/d/${dashboardUid}?${params.toString()}`
        const fullEmbedUrl = `${baseUrl}${embedPath}`

        setEmbedUrl(fullEmbedUrl)
        setLoading(false)

      } catch (err: any) {
        console.error('Error fetching Grafana embed URL:', err)
        setError(err.message || 'Failed to load Grafana dashboard')
        setLoading(false)
      }
    }

    if (apiUrl && apiKey && dashboardUid) {
      fetchEmbedUrl()
    } else {
      setError('Missing required parameters: apiUrl, apiKey, or dashboardUid')
      setLoading(false)
    }
  }, [apiUrl, apiKey, dashboardUid, orgId, timeRange, panelId])

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height, minHeight: '400px' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading Grafana dashboard...</p>
        </div>
      </div>
    )
  }

  if (!embedUrl) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to generate embed URL</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={className} style={{ width: '100%', height, minHeight: '400px' }}>
      <iframe
        src={embedUrl}
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '400px', 
          border: 'none',
          borderRadius: '0.5rem'
        }}
        allowFullScreen
        title={`Grafana Dashboard ${dashboardUid}`}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  )
}

