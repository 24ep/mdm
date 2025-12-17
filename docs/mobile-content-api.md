# Mobile Content API Documentation

This document describes the AEM-like content delivery API for mobile applications.

## Overview

The Mobile Content API allows mobile applications (iOS, Android, React Native, Flutter, etc.) to fetch UI component schemas and data bindings from the Page Builder Studio. This follows Adobe Experience Manager (AEM) concepts for headless content delivery.

## Base URL

```
/api/mobile/content
```

## Endpoints

### 1. Get Complete App Schema

Fetch the complete mobile app configuration including all pages, navigation, theme, and data bindings.

```http
GET /api/mobile/content/:spaceId
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `platform` | string | Target platform: `ios`, `android`, `web` |
| `includeAssets` | boolean | Include asset URLs in response |
| `version` | string | Specific version to fetch |

**Response:**
```json
{
  "success": true,
  "schemaVersion": "1.0.0",
  "generatedAt": "2024-12-16T10:00:00Z",
  "spaceId": "space-123",
  "platform": "ios",
  "app": {
    "schemaVersion": "1.0.0",
    "appId": "app-space-123",
    "name": "My Mobile App",
    "version": "1.0.0",
    "theme": {
      "light": { /* ThemeConfig */ },
      "dark": { /* ThemeConfig */ }
    },
    "navigation": {
      "initialPage": "page-home",
      "bottomTabs": [/* NavigationItem[] */],
      "drawer": [/* NavigationItem[] */]
    },
    "pages": [/* Page[] */],
    "api": {
      "baseUrl": "https://example.com",
      "timeout": 30000
    },
    "auth": {
      "type": "jwt",
      "loginEndpoint": "/api/auth/signin"
    }
  }
}
```

### 2. Get App Manifest

Fetch a lightweight manifest for cache validation and change detection.

```http
GET /api/mobile/content/:spaceId/manifest
```

**Response:**
```json
{
  "schemaVersion": "1.0.0",
  "spaceId": "space-123",
  "appVersion": "1.0.0",
  "updatedAt": "2024-12-16T10:00:00Z",
  "contentHashes": {
    "pages": "abc123",
    "sidebar": "def456",
    "combined": "xyz789"
  },
  "pages": {
    "total": 5,
    "active": 4,
    "items": [
      {
        "id": "page-home",
        "name": "home",
        "displayName": "Home",
        "updatedAt": "2024-12-16T10:00:00Z",
        "componentCount": 12
      }
    ]
  }
}
```

### 3. Get All Pages

Fetch all pages with pagination support.

```http
GET /api/mobile/content/:spaceId/pages
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |
| `active` | boolean | Filter by active status |
| `search` | string | Search by name/description |
| `ids` | string | Comma-separated page IDs |

**Response:**
```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  },
  "pages": [/* Page[] */]
}
```

### 4. Get Single Page

Fetch a specific page by ID.

```http
GET /api/mobile/content/:spaceId/pages/:pageId
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `includeChildren` | boolean | Include child components (default: true) |
| `expandBindings` | boolean | Expand data binding URLs |

### 5. Get Assets Manifest

Fetch all assets (images, icons, fonts) for preloading.

```http
GET /api/mobile/content/:spaceId/assets
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by asset type: `image`, `icon`, `font` |
| `preloadOnly` | boolean | Only return preload assets |
| `priority` | string | Filter by priority: `high`, `medium`, `low` |

## Component Schema

Components follow an AEM-like structure:

```typescript
interface Component {
  id: string
  type: ComponentType
  name?: string
  platforms?: Platform[]
  condition?: string
  style?: Style
  responsiveStyle?: ResponsiveStyle
  dataBindings?: DataBinding[]
  events?: {
    onPress?: Action
    onChange?: Action
    onLoad?: Action
    // ...
  }
  accessibility?: {
    label?: string
    hint?: string
    role?: string
  }
  children?: Component[]
  props?: Record<string, any>
}
```

### Supported Component Types

**Layout:**
- `container`, `row`, `column`, `stack`, `grid`, `scrollView`, `safeArea`

**Basic:**
- `text`, `image`, `icon`, `button`, `link`, `divider`, `spacer`

**Input:**
- `textInput`, `textArea`, `select`, `checkbox`, `radio`, `switch`, `slider`, `datePicker`, `timePicker`, `filePicker`

**Data Display:**
- `list`, `table`, `card`, `badge`, `avatar`, `chip`, `progress`, `skeleton`

**Navigation:**
- `tabs`, `bottomNav`, `drawer`, `appBar`, `breadcrumb`

**Charts:**
- `lineChart`, `barChart`, `pieChart`, `areaChart`

**Media:**
- `video`, `audio`, `webView`, `map`

## Data Bindings

Data bindings connect components to data sources:

```typescript
interface DataBinding {
  id: string
  type: 'api' | 'graphql' | 'static' | 'context' | 'parameter'
  source: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  responsePath?: string
  cache?: boolean
  cacheTTL?: number
  refreshInterval?: number
  pagination?: {
    type: 'offset' | 'cursor' | 'page'
    pageSize: number
    // ...
  }
}
```

## Integration Examples

### React Native

```typescript
import { useEffect, useState } from 'react'

function useMobileContent(spaceId: string) {
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Check manifest first
      const manifest = await fetch(`/api/mobile/content/${spaceId}/manifest`)
      const { contentHashes } = await manifest.json()
      
      // Compare with cached hash
      const cachedHash = await AsyncStorage.getItem('contentHash')
      
      if (contentHashes.combined !== cachedHash) {
        // Fetch full content
        const res = await fetch(`/api/mobile/content/${spaceId}?platform=ios`)
        const data = await res.json()
        setApp(data.app)
        await AsyncStorage.setItem('contentHash', contentHashes.combined)
        await AsyncStorage.setItem('appContent', JSON.stringify(data.app))
      } else {
        // Use cached content
        const cached = await AsyncStorage.getItem('appContent')
        setApp(JSON.parse(cached))
      }
      
      setLoading(false)
    }
    load()
  }, [spaceId])

  return { app, loading }
}
```

### Flutter

```dart
class MobileContentService {
  final String baseUrl;
  final String spaceId;
  
  Future<MobileApp> fetchAppContent() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/mobile/content/$spaceId?platform=android'),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return MobileApp.fromJson(data['app']);
    }
    
    throw Exception('Failed to load content');
  }
  
  Future<bool> hasContentChanged(String cachedHash) async {
    final response = await http.head(
      Uri.parse('$baseUrl/api/mobile/content/$spaceId/manifest'),
    );
    
    final contentHash = response.headers['x-content-hash'];
    return contentHash != cachedHash;
  }
}
```

### Swift (iOS)

```swift
class MobileContentManager {
    let baseURL: URL
    let spaceId: String
    
    func fetchAppContent() async throws -> MobileApp {
        let url = baseURL.appendingPathComponent("/api/mobile/content/\(spaceId)")
        var request = URLRequest(url: url)
        request.setValue("ios", forHTTPHeaderField: "X-Platform")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(ContentResponse.self, from: data)
        
        return response.app
    }
    
    func checkForUpdates(cachedHash: String) async throws -> Bool {
        let url = baseURL.appendingPathComponent("/api/mobile/content/\(spaceId)/manifest")
        var request = URLRequest(url: url)
        request.httpMethod = "HEAD"
        
        let (_, response) = try await URLSession.shared.data(for: request)
        let httpResponse = response as! HTTPURLResponse
        let contentHash = httpResponse.value(forHTTPHeaderField: "X-Content-Hash")
        
        return contentHash != cachedHash
    }
}
```

## Caching Strategy

1. **First Load**: Fetch full app schema and cache it
2. **Subsequent Loads**: 
   - HEAD request to `/manifest` endpoint
   - Compare `X-Content-Hash` header with cached hash
   - If different, fetch new content
3. **Cache Headers**: All endpoints include `Cache-Control` headers
4. **ETag Support**: Use `ETag` headers for conditional requests

## Best Practices

1. **Prefetch Assets**: Use the `/assets` endpoint to preload images and fonts
2. **Lazy Load Pages**: Fetch individual pages on demand using `/pages/:pageId`
3. **Handle Offline**: Cache content for offline use
4. **Platform Optimization**: Pass `platform` parameter for platform-specific configs
5. **Version Checks**: Respect `minimumClientVersion` in manifest
