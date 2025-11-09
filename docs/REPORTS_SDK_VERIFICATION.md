# Reports Module - SDK Features Verification

## 🔍 SDK Implementation Status

### ✅ SDK Configuration (100% Complete)

#### Power BI SDK
- ✅ **SDK Configuration UI**: `PowerBIIntegration.tsx`
  - SDK tab in configuration form
  - JSON configuration textarea for SDK config
  - Placeholder: `{"accessToken": "...", "embedUrl": "..."}`
- ✅ **SDK Access Type Support**: `access_type: 'SDK'`
- ✅ **SDK Config Storage**: Stored in `report_integrations.config.sdk_config` (JSON)
- ✅ **API Route Support**: `POST /api/reports/integrations/power-bi` accepts `sdk_config`
- ✅ **Test Connection**: `POST /api/reports/integrations/power-bi/test` validates SDK config
- ✅ **Display in Reports**: Access type badge shows "SDK" in Power BI reports listing

#### Grafana SDK
- ✅ **SDK Configuration UI**: `GrafanaIntegration.tsx`
  - SDK tab in configuration form
  - API URL input field
  - API Key input field (password type)
- ✅ **SDK Access Type Support**: `access_type: 'SDK'`
- ✅ **SDK Config Storage**: Stored in `report_integrations.config` (api_url, api_key)
- ✅ **API Route Support**: `POST /api/reports/integrations/grafana` accepts SDK config
- ✅ **Test Connection**: `POST /api/reports/integrations/grafana/test` validates SDK config
- ✅ **Display in Reports**: Access type badge shows "SDK" in Grafana dashboards listing

### ⚠️ SDK Embedding Components (Missing - Needs Implementation)

#### Power BI SDK Embedding
- ❌ **Power BI JavaScript SDK Package**: Not installed (`powerbi-client` or `@microsoft/powerbi-client`)
- ❌ **Power BI SDK Embed Component**: No component to use Power BI SDK for embedding
- ❌ **SDK-based Embedding**: `ReportEmbedPreview` only uses iframe, doesn't detect SDK access type
- ⚠️ **Current Behavior**: SDK reports fall back to iframe embedding (if embed_url exists)

#### Grafana SDK Embedding
- ❌ **Grafana SDK Package**: Not installed (Grafana doesn't have official JS SDK, uses API)
- ❌ **Grafana API-based Embedding**: No component to use Grafana API for embedding
- ⚠️ **Current Behavior**: SDK reports fall back to iframe embedding (if embed_url exists)

### 📋 What's Implemented vs What's Missing

#### ✅ Fully Implemented
1. **SDK Configuration UI** - Users can configure SDK settings
2. **SDK Config Storage** - SDK configurations are saved to database
3. **SDK Access Type Tracking** - Reports can be marked as SDK type
4. **SDK Display** - SDK access type is shown in listings
5. **SDK Test Connection** - Basic validation of SDK config exists

#### ⚠️ Partially Implemented
1. **SDK Embedding** - Configuration exists but actual SDK embedding not implemented
2. **SDK Report Rendering** - Reports with SDK access type don't use SDK for embedding

#### ❌ Not Implemented
1. **Power BI JavaScript SDK Integration**
   - Need to install: `powerbi-client` or `@microsoft/powerbi-client`
   - Need component: `PowerBIEmbed.tsx` that uses Power BI SDK
   - Need to update: `ReportEmbedPreview` to detect SDK and use SDK component
2. **Grafana API-based Embedding**
   - Grafana doesn't have JS SDK, uses REST API
   - Need component: `GrafanaEmbed.tsx` that uses Grafana API to get embed URLs
   - Need to update: `ReportEmbedPreview` to detect SDK and use API-based embedding

### 🔧 Required Implementation Steps

#### 1. Power BI SDK Embedding
```bash
# Install Power BI JavaScript SDK
npm install powerbi-client
# or
npm install @microsoft/powerbi-client
```

**Create**: `src/components/reports/PowerBIEmbed.tsx`
```typescript
'use client'
import { useEffect, useRef } from 'react'
import * as pbi from 'powerbi-client'

interface PowerBIEmbedProps {
  embedUrl: string
  accessToken: string
  reportId?: string
  pageName?: string
  filters?: any[]
}

export function PowerBIEmbed({ embedUrl, accessToken, reportId, pageName, filters }: PowerBIEmbedProps) {
  const embedContainer = useRef<HTMLDivElement>(null)
  const powerbi = useRef<pbi.service.Service | null>(null)

  useEffect(() => {
    if (!embedContainer.current || !embedUrl || !accessToken) return

    const config: pbi.models.IEmbedConfiguration = {
      type: 'report',
      id: reportId,
      embedUrl,
      accessToken,
      tokenType: pbi.models.TokenType.Aad,
      settings: {
        panes: {
          filters: { expanded: false, visible: true },
          pageNavigation: { visible: true }
        }
      }
    }

    if (pageName) {
      config.settings = {
        ...config.settings,
        initialPageName: pageName
      }
    }

    if (filters) {
      config.filters = filters
    }

    powerbi.current = pbi.embed(embedContainer.current, config)

    return () => {
      if (powerbi.current) {
        powerbi.current.reset()
      }
    }
  }, [embedUrl, accessToken, reportId, pageName, filters])

  return <div ref={embedContainer} style={{ width: '100%', height: '100%', minHeight: '600px' }} />
}
```

#### 2. Grafana API-based Embedding
**Create**: `src/components/reports/GrafanaEmbed.tsx`
```typescript
'use client'
import { useEffect, useState } from 'react'

interface GrafanaEmbedProps {
  apiUrl: string
  apiKey: string
  dashboardUid: string
  orgId?: number
  timeRange?: { from: string; to: string }
}

export function GrafanaEmbed({ apiUrl, apiKey, dashboardUid, orgId, timeRange }: GrafanaEmbedProps) {
  const [embedUrl, setEmbedUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmbedUrl = async () => {
      try {
        // Use Grafana API to get dashboard and generate embed URL
        const response = await fetch(`${apiUrl}/dashboards/uid/${dashboardUid}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch dashboard')
        
        const dashboard = await response.json()
        // Generate embed URL with time range and other params
        const params = new URLSearchParams({
          orgId: orgId?.toString() || '1',
          ...(timeRange && { from: timeRange.from, to: timeRange.to })
        })
        
        setEmbedUrl(`${apiUrl}/d/${dashboardUid}?${params}`)
      } catch (error) {
        console.error('Error fetching Grafana embed URL:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmbedUrl()
  }, [apiUrl, apiKey, dashboardUid, orgId, timeRange])

  if (loading) {
    return <div>Loading Grafana dashboard...</div>
  }

  if (!embedUrl) {
    return <div>Failed to load Grafana dashboard</div>
  }

  return (
    <iframe
      src={embedUrl}
      style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
      allowFullScreen
    />
  )
}
```

#### 3. Update ReportEmbedPreview
**Update**: `src/components/reports/ReportEmbedPreview.tsx`
- Detect `access_type` from report metadata
- If `access_type === 'SDK'`:
  - For Power BI: Use `PowerBIEmbed` component with SDK config
  - For Grafana: Use `GrafanaEmbed` component with API config
- If `access_type === 'EMBED'`: Use iframe (current behavior)
- If `access_type === 'PUBLIC'`: Use iframe (current behavior)

### 📊 Current SDK Support Summary

| Feature | Power BI | Grafana | Status |
|---------|----------|---------|--------|
| SDK Configuration UI | ✅ | ✅ | Complete |
| SDK Config Storage | ✅ | ✅ | Complete |
| SDK Access Type | ✅ | ✅ | Complete |
| SDK Test Connection | ✅ | ✅ | Complete |
| SDK Embedding Component | ❌ | ❌ | Missing |
| SDK Package Installed | ❌ | N/A | Missing |
| SDK Report Rendering | ❌ | ❌ | Missing |

### 🎯 Recommendations

1. **Immediate**: The current implementation supports SDK configuration and storage, which is the foundation. Users can configure SDK settings even if embedding isn't fully implemented.

2. **Short-term**: Implement SDK embedding components for Power BI and Grafana to complete the SDK feature set.

3. **Alternative**: For now, SDK-configured reports can use embed URLs (which are often generated from SDK configs), so the iframe fallback works for basic use cases.

### ✅ Conclusion

**SDK Configuration**: 100% Complete ✅
**SDK Embedding**: 0% Complete ❌ (Needs implementation)

The SDK feature is **partially implemented**. All configuration and storage is complete, but the actual SDK embedding components need to be created to fully support SDK-based report embedding.

