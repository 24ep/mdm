// OAuth 2.0 and OIDC helpers

export interface OAuth2TokenResponse {
  access_token: string
  token_type?: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  id_token?: string
}

/**
 * Get OAuth 2.0 authorization URL
 */
export function getOAuth2AuthUrl(config: {
  authorizationUrl: string
  clientId: string
  redirectUri: string
  scope?: string
  state?: string
  responseType?: string
}): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: config.responseType || 'code',
    ...(config.scope && { scope: config.scope }),
    ...(config.state && { state: config.state }),
  })

  return `${config.authorizationUrl}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  tokenUrl: string,
  code: string,
  config: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }
): Promise<OAuth2TokenResponse> {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get access token using client credentials
 */
export async function getClientCredentialsToken(
  tokenUrl: string,
  config: {
    clientId: string
    clientSecret: string
    scope?: string
  }
): Promise<OAuth2TokenResponse> {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      ...(config.scope && { scope: config.scope }),
    }),
  })

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  tokenUrl: string,
  refreshToken: string,
  config: {
    clientId: string
    clientSecret: string
  }
): Promise<OAuth2TokenResponse> {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`)
  }

  return await response.json()
}

