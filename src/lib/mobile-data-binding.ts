/**
 * Mobile Data Binding Helpers
 * 
 * Utilities for connecting mobile app components to data sources.
 * These helpers generate data binding configurations that mobile apps
 * can use to fetch and display dynamic content.
 */

import { DataBinding } from './mobile-content-schema'

/**
 * Common data binding templates for standard use cases
 */
export const DataBindingTemplates = {
  /**
   * Create a list data binding
   */
  list: (options: {
    endpoint: string
    responsePath?: string
    pageSize?: number
    refreshInterval?: number
  }): DataBinding => ({
    id: `list-${Date.now()}`,
    type: 'api',
    source: options.endpoint,
    method: 'GET',
    responsePath: options.responsePath || 'data',
    cache: true,
    cacheTTL: 60,
    refreshInterval: options.refreshInterval,
    pagination: options.pageSize ? {
      type: 'page',
      pageSize: options.pageSize,
      pageParam: 'page',
      limitParam: 'limit',
    } : undefined,
  }),

  /**
   * Create a detail view data binding
   */
  detail: (options: {
    endpoint: string
    idParam?: string
    responsePath?: string
  }): DataBinding => ({
    id: `detail-${Date.now()}`,
    type: 'api',
    source: options.endpoint,
    method: 'GET',
    responsePath: options.responsePath || 'data',
    cache: true,
    cacheTTL: 30,
  }),

  /**
   * Create a form submission data binding
   */
  form: (options: {
    endpoint: string
    method?: 'POST' | 'PUT' | 'PATCH'
  }): DataBinding => ({
    id: `form-${Date.now()}`,
    type: 'api',
    source: options.endpoint,
    method: options.method || 'POST',
    cache: false,
  }),

  /**
   * Create a search data binding
   */
  search: (options: {
    endpoint: string
    queryParam?: string
    responsePath?: string
    debounce?: number
  }): DataBinding => ({
    id: `search-${Date.now()}`,
    type: 'api',
    source: options.endpoint,
    method: 'GET',
    responsePath: options.responsePath || 'results',
    cache: true,
    cacheTTL: 10,
  }),

  /**
   * Create a static data binding
   */
  static: (data: any): DataBinding => ({
    id: `static-${Date.now()}`,
    type: 'static',
    source: JSON.stringify(data),
  }),

  /**
   * Create a context data binding (for app state)
   */
  context: (path: string): DataBinding => ({
    id: `context-${Date.now()}`,
    type: 'context',
    source: path,
  }),

  /**
   * Create a navigation parameter binding
   */
  parameter: (name: string): DataBinding => ({
    id: `param-${Date.now()}`,
    type: 'parameter',
    source: name,
  }),
}

/**
 * Data source builder for complex scenarios
 */
export class DataSourceBuilder {
  private binding: Partial<DataBinding> = {}

  constructor(id?: string) {
    this.binding.id = id || `binding-${Date.now()}`
  }

  /**
   * Set the data source type
   */
  type(type: DataBinding['type']): this {
    this.binding.type = type
    return this
  }

  /**
   * Set the source URL or path
   */
  source(source: string): this {
    this.binding.source = source
    return this
  }

  /**
   * Set the HTTP method
   */
  method(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'): this {
    this.binding.method = method
    return this
  }

  /**
   * Add request headers
   */
  headers(headers: Record<string, string>): this {
    this.binding.headers = { ...this.binding.headers, ...headers }
    return this
  }

  /**
   * Set the response data path
   */
  responsePath(path: string): this {
    this.binding.responsePath = path
    return this
  }

  /**
   * Enable caching with optional TTL
   */
  cache(ttl: number = 60): this {
    this.binding.cache = true
    this.binding.cacheTTL = ttl
    return this
  }

  /**
   * Set auto-refresh interval
   */
  refreshEvery(ms: number): this {
    this.binding.refreshInterval = ms
    return this
  }

  /**
   * Enable offset-based pagination
   */
  paginateByOffset(pageSize: number, options?: {
    limitParam?: string
    offsetParam?: string
  }): this {
    this.binding.pagination = {
      type: 'offset',
      pageSize,
      limitParam: options?.limitParam || 'limit',
      offsetParam: options?.offsetParam || 'offset',
    }
    return this
  }

  /**
   * Enable page-based pagination
   */
  paginateByPage(pageSize: number, options?: {
    pageParam?: string
    limitParam?: string
  }): this {
    this.binding.pagination = {
      type: 'page',
      pageSize,
      pageParam: options?.pageParam || 'page',
      limitParam: options?.limitParam || 'limit',
    }
    return this
  }

  /**
   * Enable cursor-based pagination
   */
  paginateByCursor(pageSize: number, cursorParam: string = 'cursor'): this {
    this.binding.pagination = {
      type: 'cursor',
      pageSize,
      cursorParam,
    }
    return this
  }

  /**
   * Set a data transform function name
   */
  transform(transformName: string): this {
    this.binding.transform = transformName
    return this
  }

  /**
   * Build the data binding configuration
   */
  build(): DataBinding {
    if (!this.binding.type) {
      throw new Error('Data binding type is required')
    }
    if (!this.binding.source) {
      throw new Error('Data binding source is required')
    }
    return this.binding as DataBinding
  }
}

/**
 * Create a new data source builder
 */
export function createDataSource(id?: string): DataSourceBuilder {
  return new DataSourceBuilder(id)
}

/**
 * Common API endpoint patterns for data management
 */
export const ApiEndpoints = {
  /**
   * Generate endpoints for a data model
   */
  forModel: (modelName: string, baseUrl: string = '/api') => ({
    list: `${baseUrl}/data-records?model=${modelName}`,
    detail: (id: string) => `${baseUrl}/data-records/${id}`,
    create: `${baseUrl}/data-records`,
    update: (id: string) => `${baseUrl}/data-records/${id}`,
    delete: (id: string) => `${baseUrl}/data-records/${id}`,
    search: `${baseUrl}/data-records/search?model=${modelName}`,
  }),

  /**
   * Generate endpoints for entities (EAV)
   */
  forEntity: (entityType: string, baseUrl: string = '/api') => ({
    list: `${baseUrl}/eav/entities?type=${entityType}`,
    detail: (id: string) => `${baseUrl}/eav/entities/${id}`,
    create: `${baseUrl}/eav/entities`,
    update: (id: string) => `${baseUrl}/eav/entities/${id}`,
    delete: (id: string) => `${baseUrl}/eav/entities/${id}`,
  }),

  /**
   * Generate endpoints for assets
   */
  assets: (baseUrl: string = '/api') => ({
    list: `${baseUrl}/admin/assets`,
    detail: (id: string) => `${baseUrl}/admin/assets/${id}`,
    upload: `${baseUrl}/upload`,
  }),

  /**
   * Generate endpoints for users
   */
  users: (baseUrl: string = '/api') => ({
    current: `${baseUrl}/auth/session`,
    list: `${baseUrl}/users`,
    detail: (id: string) => `${baseUrl}/users/${id}`,
  }),
}

/**
 * Generate mobile-friendly data bindings for a list view
 */
export function createListBindings(options: {
  modelName: string
  pageSize?: number
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  baseUrl?: string
}): {
  list: DataBinding
  search?: DataBinding
  filter?: DataBinding
} {
  const endpoints = ApiEndpoints.forModel(options.modelName, options.baseUrl)
  
  const result: {
    list: DataBinding
    search?: DataBinding
    filter?: DataBinding
  } = {
    list: DataBindingTemplates.list({
      endpoint: endpoints.list,
      pageSize: options.pageSize || 20,
      responsePath: 'records',
    }),
  }

  if (options.searchable) {
    result.search = DataBindingTemplates.search({
      endpoint: endpoints.search,
      responsePath: 'results',
    })
  }

  return result
}

/**
 * Generate mobile-friendly data bindings for a detail view
 */
export function createDetailBindings(options: {
  modelName: string
  baseUrl?: string
}): {
  detail: DataBinding
  update: DataBinding
  delete: DataBinding
} {
  const endpoints = ApiEndpoints.forModel(options.modelName, options.baseUrl)
  
  return {
    detail: createDataSource('detail')
      .type('api')
      .source(endpoints.detail(':id'))
      .method('GET')
      .responsePath('record')
      .cache(30)
      .build(),
    update: createDataSource('update')
      .type('api')
      .source(endpoints.update(':id'))
      .method('PUT')
      .build(),
    delete: createDataSource('delete')
      .type('api')
      .source(endpoints.delete(':id'))
      .method('DELETE')
      .build(),
  }
}

/**
 * Generate mobile-friendly data bindings for a form
 */
export function createFormBindings(options: {
  modelName: string
  mode: 'create' | 'edit'
  baseUrl?: string
}): {
  submit: DataBinding
  load?: DataBinding
} {
  const endpoints = ApiEndpoints.forModel(options.modelName, options.baseUrl)
  
  const result: {
    submit: DataBinding
    load?: DataBinding
  } = {
    submit: createDataSource('submit')
      .type('api')
      .source(options.mode === 'create' ? endpoints.create : endpoints.update(':id'))
      .method(options.mode === 'create' ? 'POST' : 'PUT')
      .build(),
  }

  if (options.mode === 'edit') {
    result.load = createDataSource('load')
      .type('api')
      .source(endpoints.detail(':id'))
      .method('GET')
      .responsePath('record')
      .build()
  }

  return result
}
