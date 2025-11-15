// Import/Export utilities for API collections

import { ApiCollection, ApiRequest, ApiEnvironment } from '../types'

/**
 * Export collection to JSON format
 */
export function exportCollection(collection: ApiCollection): string {
  const exportData = {
    version: '1.0',
    name: collection.name,
    description: collection.description,
    requests: collection.requests || [],
    children: collection.children?.map((child) => exportCollection(child)) || [],
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Import collection from JSON
 */
export function importCollection(json: string): ApiCollection {
  try {
    const data = JSON.parse(json)
    return {
      name: data.name || 'Imported Collection',
      description: data.description,
      requests: data.requests || [],
      children: data.children?.map((child: any) => importCollection(JSON.stringify(child))) || [],
    }
  } catch (error) {
    throw new Error('Invalid collection JSON format')
  }
}

/**
 * Convert request to cURL command
 */
export function requestToCurl(request: ApiRequest, environmentVariables: Array<{ key: string; value: string }> = []): string {
  const resolveVariable = (text: string): string => {
    let resolved = text
    environmentVariables.forEach((variable) => {
      const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g')
      resolved = resolved.replace(regex, variable.value)
    })
    return resolved
  }

  let url = resolveVariable(request.url)

  // Add query parameters
  const enabledParams = (request.params || []).filter((p) => p.enabled && p.key)
  if (enabledParams.length > 0) {
    const queryString = enabledParams
      .map((param) => {
        const key = encodeURIComponent(resolveVariable(param.key))
        const value = encodeURIComponent(resolveVariable(param.value))
        return `${key}=${value}`
      })
      .join('&')
    url += (url.includes('?') ? '&' : '?') + queryString
  }

  let curl = `curl -X ${request.method} "${url}"`

  // Add headers
  const enabledHeaders = (request.headers || []).filter((h) => h.enabled && h.key)
  enabledHeaders.forEach((header) => {
    const key = resolveVariable(header.key)
    const value = resolveVariable(header.value)
    curl += ` \\\n  -H "${key}: ${value}"`
  })

  // Add auth headers
  if (request.authType === 'bearer' && request.authConfig?.bearerToken) {
    const token = resolveVariable(request.authConfig.bearerToken)
    curl += ` \\\n  -H "Authorization: Bearer ${token}"`
  } else if (request.authType === 'basic' && request.authConfig?.username && request.authConfig?.password) {
    const username = resolveVariable(request.authConfig.username)
    const password = resolveVariable(request.authConfig.password)
    curl += ` \\\n  -u "${username}:${password}"`
  } else if (request.authType === 'apikey' && request.authConfig?.apiKeyName && request.authConfig?.apiKeyValue) {
    const keyName = resolveVariable(request.authConfig.apiKeyName)
    const keyValue = resolveVariable(request.authConfig.apiKeyValue)
    if (request.authConfig.apiKeyLocation === 'header') {
      curl += ` \\\n  -H "${keyName}: ${keyValue}"`
    } else {
      url += (url.includes('?') ? '&' : '?') + `${keyName}=${keyValue}`
    }
  }

  // Add body
  if (request.body && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const body = resolveVariable(request.body)
    if (request.bodyType === 'json') {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`
    } else if (request.bodyType === 'form-data') {
      curl += ` \\\n  -F "${body}"`
    } else if (request.bodyType === 'x-www-form-urlencoded') {
      curl += ` \\\n  -H "Content-Type: application/x-www-form-urlencoded" \\\n  -d "${body}"`
    } else {
      curl += ` \\\n  -d '${body}'`
    }
  }

  return curl
}

/**
 * Parse cURL command to request
 */
export function curlToRequest(curl: string): Partial<ApiRequest> {
  // Simple cURL parser (basic implementation)
  const methodMatch = curl.match(/-X\s+(\w+)/i)
  const urlMatch = curl.match(/curl.*?"([^"]+)"/i) || curl.match(/curl.*?'([^']+)'/i)
  const headerMatches = curl.matchAll(/-H\s+["']([^"']+):\s*([^"']+)["']/gi)
  const bodyMatch = curl.match(/-d\s+["']([^"']+["'])/i) || curl.match(/-d\s+['"]([^'"]+)['"]/i)

  const method = (methodMatch?.[1] || 'GET').toUpperCase() as any
  const url = urlMatch?.[1] || ''

  const headers: Array<{ key: string; value: string; enabled: boolean }> = []
  for (const match of headerMatches) {
    const [key, value] = match[1].split(':').map((s) => s.trim())
    if (key && value) {
      headers.push({ key, value, enabled: true })
    }
  }

  const body = bodyMatch?.[1] || ''

  return {
    method,
    url,
    headers,
    body,
    bodyType: headers.some((h) => h.key.toLowerCase() === 'content-type' && h.value.includes('json'))
      ? 'json'
      : 'raw',
    authType: 'none',
    requestType: 'REST',
  }
}

/**
 * Export environment to JSON
 */
export function exportEnvironment(environment: ApiEnvironment): string {
  return JSON.stringify(environment, null, 2)
}

/**
 * Import environment from JSON
 */
export function importEnvironment(json: string): ApiEnvironment {
  try {
    return JSON.parse(json)
  } catch (error) {
    throw new Error('Invalid environment JSON format')
  }
}

