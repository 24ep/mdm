import { Client } from 'ssh2-sftp-client'
import { InfrastructureInstance } from '../../types'

export interface SSHConnectorConfig {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
}

/**
 * SSH Connector for VM instances
 */
export class SSHConnector {
  private client: Client

  constructor(config: SSHConnectorConfig) {
    this.client = new Client()
    this.config = config
  }

  private config: SSHConnectorConfig

  /**
   * Connect to the instance
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect({
        host: this.config.host,
        port: this.config.port || 22,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
        passphrase: this.config.passphrase,
      })
    } catch (error) {
      console.error('SSH connection error:', error)
      throw new Error(`Failed to connect via SSH: ${error}`)
    }
  }

  /**
   * Execute command on the instance
   */
  async executeCommand(command: string): Promise<string> {
    try {
      const result = await this.client.exec(command)
      return result
    } catch (error) {
      console.error('SSH command execution error:', error)
      throw new Error(`Failed to execute command: ${error}`)
    }
  }

  /**
   * Check if instance is online
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.connect()
      await this.executeCommand('echo "health check"')
      return true
    } catch {
      return false
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<{
    osType?: string
    osVersion?: string
    resources?: {
      cpu?: number
      memory?: number
      disk?: number
    }
  }> {
    try {
      await this.connect()
      
      const osInfo = await this.executeCommand('uname -a')
      const cpuInfo = await this.executeCommand('nproc')
      const memInfo = await this.executeCommand('free -m | grep Mem')
      const diskInfo = await this.executeCommand('df -h / | tail -1')

      return {
        osType: osInfo.split(' ')[0],
        osVersion: osInfo.split(' ')[2],
        resources: {
          cpu: parseInt(cpuInfo.trim()) || undefined,
          memory: this.parseMemory(memInfo),
          disk: this.parseDisk(diskInfo),
        },
      }
    } catch (error) {
      console.error('Error getting system info:', error)
      return {}
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Disconnect from the instance
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.end()
    } catch (error) {
      console.error('SSH disconnect error:', error)
    }
  }

  private parseMemory(memInfo: string): number | undefined {
    // Parse memory from "Mem: 8192 1024 7168 0 0 0" format
    const parts = memInfo.split(/\s+/)
    if (parts.length > 1) {
      return parseInt(parts[1]) || undefined
    }
    return undefined
  }

  private parseDisk(diskInfo: string): number | undefined {
    // Parse disk from df output
    const parts = diskInfo.split(/\s+/)
    if (parts.length > 1) {
      const size = parts[1]
      // Convert to MB (assuming format like "100G" or "100M")
      if (size.endsWith('G')) {
        return parseInt(size) * 1024
      } else if (size.endsWith('M')) {
        return parseInt(size)
      }
    }
    return undefined
  }
}

