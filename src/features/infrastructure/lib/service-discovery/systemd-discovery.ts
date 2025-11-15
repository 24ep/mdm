import { SSHConnector } from '../instance-connectors/ssh-connector'
import { InstanceService, ServiceType } from '../../types'

/**
 * Systemd Service Discovery - Discovers systemd services on Linux instances
 */
export class SystemdDiscovery {
  private connector: SSHConnector

  constructor(connector: SSHConnector) {
    this.connector = connector
  }

  /**
   * Discover systemd services
   */
  async discoverServices(): Promise<InstanceService[]> {
    try {
      await this.connector.connect()

      // List all systemd services
      const serviceListOutput = await this.connector.executeCommand(
        'systemctl list-units --type=service --no-pager --no-legend'
      )

      const services: InstanceService[] = []
      const lines = serviceListOutput.split('\n').filter(line => line.trim())

      for (const line of lines) {
        const parts = line.split(/\s+/)
        if (parts.length < 1) continue

        const serviceName = parts[0]
        const status = parts[3] || 'unknown'

        // Get service details
        const statusOutput = await this.connector.executeCommand(
          `systemctl show ${serviceName} --property=ActiveState,MainPID,ExecStart`
        ).catch(() => '')

        const service: InstanceService = {
          id: serviceName,
          instanceId: '', // Will be set by caller
          name: serviceName,
          type: 'systemd_service' as ServiceType,
          status: status === 'active' ? 'running' : 'stopped',
          serviceConfig: {
            statusOutput,
          },
          discoveredAt: new Date(),
          lastSeen: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        services.push(service)
      }

      await this.connector.disconnect()
      return services
    } catch (error) {
      console.error('Error discovering systemd services:', error)
      await this.connector.disconnect().catch(() => {})
      return []
    }
  }
}

