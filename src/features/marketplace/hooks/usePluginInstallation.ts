'use client'

import { useState } from 'react'
import { PluginInstallation } from '../types'

export interface UsePluginInstallationResult {
  install: (serviceId: string, spaceId: string | null, config?: Record<string, any>) => Promise<PluginInstallation | null>
  uninstall: (installationId: string) => Promise<boolean>
  update: (installationId: string, config: Record<string, any>) => Promise<PluginInstallation | null>
  loading: boolean
  error: string | null
}

/**
 * Hook for plugin installation actions
 */
export function usePluginInstallation(): UsePluginInstallationResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const install = async (
    serviceId: string,
    spaceId: string | null,
    config?: Record<string, any>
  ): Promise<PluginInstallation | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/marketplace/installations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          ...(spaceId && { spaceId }),
          config: config || {},
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to install plugin')
      }

      const data = await response.json()
      return data.installation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to install plugin'
      setError(errorMessage)
      console.error('Error installing plugin:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const uninstall = async (installationId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/marketplace/installations/${installationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to uninstall plugin')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to uninstall plugin'
      setError(errorMessage)
      console.error('Error uninstalling plugin:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const update = async (
    installationId: string,
    config: Record<string, any>
  ): Promise<PluginInstallation | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/marketplace/installations/${installationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })

      if (!response.ok) {
        throw new Error('Failed to update plugin installation')
      }

      const data = await response.json()
      return data.installation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update plugin installation'
      setError(errorMessage)
      console.error('Error updating plugin installation:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    install,
    uninstall,
    update,
    loading,
    error,
  }
}

