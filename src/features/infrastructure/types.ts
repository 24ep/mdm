export interface InfrastructureInstance {
  id: string
  name: string
  type: InstanceType
  host: string
  port?: number
  protocol?: string
  connectionType: ConnectionType
  connectionConfig?: Record<string, any>
  status: InstanceStatus
  lastHealthCheck?: Date
  healthStatus?: Record<string, any>
  osType?: string
  osVersion?: string
  resources?: {
    cpu?: number
    memory?: number
    disk?: number
  }
  tags?: string[]
  spaceId?: string
  space?: {
    id: string
    name: string
    slug: string
  }
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export type InstanceType = 'vm' | 'docker_host' | 'kubernetes' | 'cloud_instance'
export type ConnectionType = 'ssh' | 'docker_api' | 'kubernetes' | 'http'
export type InstanceStatus = 'online' | 'offline' | 'error' | 'unknown'

export interface InstanceService {
  id: string
  instanceId: string
  name: string
  type: ServiceType
  status: ServiceStatus
  serviceConfig?: Record<string, any>
  endpoints?: Array<{
    url: string
    port?: number
    protocol?: string
  }>
  healthCheckUrl?: string
  managementPluginId?: string
  managementConfig?: Record<string, any>
  discoveredAt: Date
  lastSeen: Date
  createdAt: Date
  updatedAt: Date
}

export type ServiceType = 'docker_container' | 'systemd_service' | 'application'
export type ServiceStatus = 'running' | 'stopped' | 'error' | 'unknown'

export interface InfrastructureFilters {
  type?: InstanceType
  status?: InstanceStatus
  spaceId?: string | null
}

export interface InfrastructureOverviewProps {
  spaceId?: string | null
  showSpaceSelector?: boolean
}

