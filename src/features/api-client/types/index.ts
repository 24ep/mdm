// API Client Types (Hoppscotch-like)

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE'

export type RequestType = 'REST' | 'GraphQL' | 'WebSocket' | 'SSE' | 'SocketIO' | 'MQTT'

export type AuthType = 'none' | 'bearer' | 'basic' | 'oauth2' | 'apikey' | 'oidc'

export type BodyType = 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql'

export interface KeyValuePair {
  key: string
  value: string
  enabled: boolean
}

export interface AuthConfig {
  bearerToken?: string
  username?: string
  password?: string
  apiKeyName?: string
  apiKeyValue?: string
  apiKeyLocation?: 'header' | 'query'
  oauth2Config?: OAuth2Config
  oidcConfig?: OIDCConfig
}

export interface OAuth2Config {
  grantType: 'authorization_code' | 'client_credentials' | 'password' | 'implicit'
  authorizationUrl?: string
  accessTokenUrl?: string
  clientId?: string
  clientSecret?: string
  scope?: string
  callbackUrl?: string
}

export interface OIDCConfig {
  issuerUrl?: string
  clientId?: string
  clientSecret?: string
  scope?: string
  callbackUrl?: string
}

export interface ApiRequest {
  id?: string
  collectionId?: string
  name: string
  method: HttpMethod
  url: string
  headers: KeyValuePair[]
  params: KeyValuePair[]
  body?: string
  bodyType?: BodyType
  authType: AuthType
  authConfig?: AuthConfig
  preRequestScript?: string
  testScript?: string
  requestType: RequestType
  graphqlQuery?: string
  graphqlVariables?: string
  order?: number
}

export interface ApiResponse {
  statusCode: number
  statusText: string
  headers: Record<string, string>
  body: string
  responseTime: number
  error?: string
}

export interface ApiCollection {
  id?: string
  workspaceId: string
  parentId?: string
  name: string
  description?: string
  order?: number
  children?: ApiCollection[]
  requests?: ApiRequest[]
}

export interface ApiEnvironment {
  id?: string
  workspaceId: string
  name: string
  variables: KeyValuePair[]
  isGlobal?: boolean
}

export interface ApiWorkspace {
  id?: string
  name: string
  description?: string
  isPersonal: boolean
  spaceId?: string
}

export interface ApiRequestHistory {
  id?: string
  requestId?: string
  method: HttpMethod
  url: string
  headers: Record<string, string>
  body?: string
  statusCode?: number
  statusText?: string
  responseHeaders?: Record<string, string>
  responseBody?: string
  responseTime?: number
  error?: string
  createdAt?: Date
}

export interface GraphQLSchema {
  queryType?: {
    name: string
  }
  mutationType?: {
    name: string
  }
  types: Array<{
    name: string
    kind: string
    fields?: Array<{
      name: string
      type: {
        name?: string
        kind: string
      }
    }>
  }>
}

