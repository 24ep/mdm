import { DockerConnector } from '../instance-connectors/docker-connector'
import { InstanceService, ServiceType } from '../../types'

/**
 * Docker Service Discovery - Discovers services running in Docker containers
 */
export class DockerDiscovery {
  private connector: DockerConnector

  constructor(connector: DockerConnector) {
    this.connector = connector
  }

  /**
   * Discover services on Docker host
   */
  async discoverServices(): Promise<InstanceService[]> {
    try {
      const containers = await this.connector.listContainers()
      
      const services: InstanceService[] = []

      for (const container of containers) {
        const details = await this.connector.getContainerDetails(container.Id)
        
        // Extract service information
        const service: InstanceService = {
          id: container.Id,
          instanceId: '', // Will be set by caller
          name: container.Names?.[0]?.replace('/', '') || container.Id.substring(0, 12),
          type: 'docker_container' as ServiceType,
          status: container.Status?.includes('Up') ? 'running' : 'stopped',
          serviceConfig: {
            image: container.Image,
            command: details.Config?.Cmd,
            env: details.Config?.Env,
            ports: details.NetworkSettings?.Ports,
          },
          endpoints: this.extractEndpoints(details),
          discoveredAt: new Date(),
          lastSeen: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        services.push(service)
      }

      return services
    } catch (error) {
      console.error('Error discovering Docker services:', error)
      return []
    }
  }

  /**
   * Extract endpoints from container details
   */
  private extractEndpoints(containerDetails: any): Array<{
    url: string
    port?: number
    protocol?: string
  }> {
    const endpoints: Array<{ url: string; port?: number; protocol?: string }> = []
    const ports = containerDetails.NetworkSettings?.Ports || {}

    for (const [containerPort, hostMappings] of Object.entries(ports)) {
      const [port, protocol] = containerPort.split('/')
      const mappings = hostMappings as any[]

      if (mappings && mappings.length > 0) {
        for (const mapping of mappings) {
          endpoints.push({
            url: mapping.HostIp || 'localhost',
            port: parseInt(mapping.HostPort) || parseInt(port),
            protocol: protocol || 'tcp',
          })
        }
      } else {
        endpoints.push({
          url: 'localhost',
          port: parseInt(port),
          protocol: protocol || 'tcp',
        })
      }
    }

    return endpoints
  }
}

