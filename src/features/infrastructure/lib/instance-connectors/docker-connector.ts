import { InfrastructureInstance } from '../../types'

export interface DockerConnectorConfig {
  host: string
  port?: number
  protocol?: 'http' | 'https'
  socketPath?: string
  certPath?: string
}

/**
 * Docker API Connector for Docker host instances
 */
export class DockerConnector {
  private config: DockerConnectorConfig
  private baseUrl: string

  constructor(config: DockerConnectorConfig) {
    this.config = config
    this.baseUrl = config.socketPath
      ? `unix://${config.socketPath}`
      : `${config.protocol || 'http'}://${config.host}:${config.port || 2375}`
  }

  /**
   * Check if instance is online
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/_ping`)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * List containers
   */
  async listContainers(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/containers/json?all=true`)
      if (!response.ok) {
        throw new Error('Failed to list containers')
      }
      return await response.json()
    } catch (error) {
      console.error('Error listing containers:', error)
      throw error
    }
  }

  /**
   * Get container details
   */
  async getContainerDetails(containerId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/containers/${containerId}/json`)
      if (!response.ok) {
        throw new Error('Failed to get container details')
      }
      return await response.json()
    } catch (error) {
      console.error('Error getting container details:', error)
      throw error
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<{
    resources?: {
      cpu?: number
      memory?: number
      disk?: number
    }
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/info`)
      if (!response.ok) {
        throw new Error('Failed to get system info')
      }
      const info = await response.json()
      
      return {
        resources: {
          cpu: info.NCPU || undefined,
          memory: info.MemTotal ? Math.round(info.MemTotal / 1024 / 1024) : undefined,
        },
      }
    } catch (error) {
      console.error('Error getting system info:', error)
      return {}
    }
  }
}

