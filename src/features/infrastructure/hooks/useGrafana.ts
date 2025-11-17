'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

export interface GrafanaDashboard {
  uid?: string
  id?: number
  title?: string
  name?: string
  folderTitle?: string
  folder?: string
  tags?: string[]
}

export interface GrafanaDataSource {
  id: number
  name: string
  type: string
  url?: string
  access?: string
}

export interface GrafanaAlert {
  id?: string
  name?: string
  title?: string
  state?: string
  dashboardName?: string
  newStateDate?: string
}

export interface GrafanaUser {
  id: number
  name?: string
  email?: string
  login: string
  isAdmin?: boolean
  role?: string
  lastSeenAt?: string
}

export interface UseGrafanaResult {
  dashboards: GrafanaDashboard[]
  dataSources: GrafanaDataSource[]
  alerts: GrafanaAlert[]
  users: GrafanaUser[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useGrafana(instanceId: string | null | undefined): UseGrafanaResult {
  const queryClient = useQueryClient()

  const { data: dashboardsData, isLoading: dashboardsLoading, error: dashboardsError } = useQuery({
    queryKey: ['grafana', instanceId, 'dashboards'],
    queryFn: async () => {
      if (!instanceId) return { dashboards: [] }
      const response = await fetch(`/api/grafana/${instanceId}/dashboards`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch dashboards')
      }
      return response.json()
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000,
  })

  const { data: dataSourcesData, isLoading: dataSourcesLoading } = useQuery({
    queryKey: ['grafana', instanceId, 'datasources'],
    queryFn: async () => {
      if (!instanceId) return { dataSources: [] }
      const response = await fetch(`/api/grafana/${instanceId}/datasources`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch data sources')
      }
      return response.json()
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000,
  })

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['grafana', instanceId, 'alerts'],
    queryFn: async () => {
      if (!instanceId) return { alerts: [] }
      const response = await fetch(`/api/grafana/${instanceId}/alerts`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch alerts')
      }
      return response.json()
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000,
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['grafana', instanceId, 'users'],
    queryFn: async () => {
      if (!instanceId) return { users: [] }
      const response = await fetch(`/api/grafana/${instanceId}/users`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch users')
      }
      return response.json()
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000,
  })

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['grafana', instanceId] })
  }

  return {
    dashboards: dashboardsData?.dashboards || [],
    dataSources: dataSourcesData?.dataSources || [],
    alerts: alertsData?.alerts || [],
    users: usersData?.users || [],
    loading: dashboardsLoading || dataSourcesLoading || alertsLoading || usersLoading,
    error: dashboardsError instanceof Error ? dashboardsError.message : null,
    refetch,
  }
}

