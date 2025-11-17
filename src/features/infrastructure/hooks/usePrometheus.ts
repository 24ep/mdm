'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

export interface PrometheusTarget {
  job?: string
  instance?: string
  scrapeUrl?: string
  health?: string
  state?: string
  lastScrape?: number
  lastError?: string
}

export interface PrometheusRule {
  name?: string
  alert?: string
  record?: string
  type?: string
  group?: string
  health?: string
  state?: string
  lastEvaluation?: number
}

export interface PrometheusAlert {
  alertname?: string
  name?: string
  state?: string
  severity?: string
  activeAt?: number
  value?: string
}

export interface UsePrometheusResult {
  targets: PrometheusTarget[]
  rules: PrometheusRule[]
  alerts: PrometheusAlert[]
  loading: boolean
  error: string | null
  refetch: () => void
  queryPromQL: (query: string, time?: number) => Promise<any>
}

export function usePrometheus(instanceId: string | null | undefined): UsePrometheusResult {
  const queryClient = useQueryClient()

  const { data: targetsData, isLoading: targetsLoading, error: targetsError } = useQuery({
    queryKey: ['prometheus', instanceId, 'targets'],
    queryFn: async () => {
      if (!instanceId) return { targets: [] }
      const response = await fetch(`/api/prometheus/${instanceId}/targets`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch targets')
      }
      return response.json()
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000,
  })

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['prometheus', instanceId, 'rules'],
    queryFn: async () => {
      if (!instanceId) return { rules: [] }
      const response = await fetch(`/api/prometheus/${instanceId}/rules`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch rules')
      }
      return response.json()
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000,
  })

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['prometheus', instanceId, 'alerts'],
    queryFn: async () => {
      if (!instanceId) return { alerts: [] }
      const response = await fetch(`/api/prometheus/${instanceId}/alerts`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch alerts')
      }
      return response.json()
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000,
  })

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['prometheus', instanceId] })
  }

  const queryPromQL = async (promQL: string, time?: number) => {
    if (!instanceId) {
      throw new Error('Instance ID is required')
    }

    const response = await fetch(`/api/prometheus/${instanceId}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: promQL, time }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to execute query')
    }

    const data = await response.json()
    return data.data
  }

  return {
    targets: targetsData?.targets || [],
    rules: rulesData?.rules || [],
    alerts: alertsData?.alerts || [],
    loading: targetsLoading || rulesLoading || alertsLoading,
    error: targetsError instanceof Error ? targetsError.message : null,
    refetch,
    queryPromQL,
  }
}

