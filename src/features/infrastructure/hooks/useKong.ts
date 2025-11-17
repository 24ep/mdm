'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface KongRoute {
  id: string
  name?: string
  paths?: string[]
  methods?: string[]
  service?: { id: string; name?: string }
  service_id?: string
}

export interface KongService {
  id: string
  name?: string
  url?: string
  protocol?: string
  port?: number
}

export interface KongPlugin {
  id: string
  name?: string
  type?: string
  enabled?: boolean
  service?: { id: string; name?: string }
  route?: { id: string; name?: string }
}

export interface UseKongResult {
  routes: KongRoute[]
  services: KongService[]
  plugins: KongPlugin[]
  loading: boolean
  error: string | null
  refetch: () => void
  createRoute: (route: Partial<KongRoute>) => Promise<void>
  updateRoute: (id: string, route: Partial<KongRoute>) => Promise<void>
  deleteRoute: (id: string) => Promise<void>
  createService: (service: Partial<KongService>) => Promise<void>
  updateService: (id: string, service: Partial<KongService>) => Promise<void>
  deleteService: (id: string) => Promise<void>
  createPlugin: (plugin: Partial<KongPlugin>) => Promise<void>
  updatePlugin: (id: string, plugin: Partial<KongPlugin>) => Promise<void>
  deletePlugin: (id: string) => Promise<void>
}

export function useKong(instanceId: string | null | undefined): UseKongResult {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch: refetchRoutes } = useQuery({
    queryKey: ['kong', instanceId, 'routes'],
    queryFn: async () => {
      if (!instanceId) {
        return { routes: [] }
      }

      const response = await fetch(`/api/kong/${instanceId}/routes`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch routes')
      }
      const data = await response.json()
      return data
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000,
  })

  const { data: servicesData, refetch: refetchServices } = useQuery({
    queryKey: ['kong', instanceId, 'services'],
    queryFn: async () => {
      if (!instanceId) {
        return { services: [] }
      }

      const response = await fetch(`/api/kong/${instanceId}/services`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch services')
      }
      const data = await response.json()
      return data
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000,
  })

  const { data: pluginsData, refetch: refetchPlugins } = useQuery({
    queryKey: ['kong', instanceId, 'plugins'],
    queryFn: async () => {
      if (!instanceId) {
        return { plugins: [] }
      }

      const response = await fetch(`/api/kong/${instanceId}/plugins`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch plugins')
      }
      const data = await response.json()
      return data
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000,
  })

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['kong', instanceId] })
  }

  const createRouteMutation = useMutation({
    mutationFn: async (route: Partial<KongRoute>) => {
      if (!instanceId) throw new Error('Instance ID is required')
      const response = await fetch(`/api/kong/${instanceId}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(route),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create route')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kong', instanceId, 'routes'] })
    },
  })

  const updateRouteMutation = useMutation({
    mutationFn: async ({ id, route }: { id: string; route: Partial<KongRoute> }) => {
      if (!instanceId) throw new Error('Instance ID is required')
      const response = await fetch(`/api/kong/${instanceId}/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(route),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update route')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kong', instanceId, 'routes'] })
    },
  })

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!instanceId) throw new Error('Instance ID is required')
      const response = await fetch(`/api/kong/${instanceId}/routes/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete route')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kong', instanceId, 'routes'] })
    },
  })

  const createServiceMutation = useMutation({
    mutationFn: async (service: Partial<KongService>) => {
      if (!instanceId) throw new Error('Instance ID is required')
      const response = await fetch(`/api/kong/${instanceId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create service')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kong', instanceId, 'services'] })
    },
  })

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, service }: { id: string; service: Partial<KongService> }) => {
      if (!instanceId) throw new Error('Instance ID is required')
      const response = await fetch(`/api/kong/${instanceId}/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update service')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kong', instanceId, 'services'] })
    },
  })

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!instanceId) throw new Error('Instance ID is required')
      const response = await fetch(`/api/kong/${instanceId}/services/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete service')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kong', instanceId, 'services'] })
    },
  })

  const createPluginMutation = useMutation({
    mutationFn: async (plugin: Partial<KongPlugin>) => {
      if (!instanceId) throw new Error('Instance ID is required')
      const response = await fetch(`/api/kong/${instanceId}/plugins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plugin),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create plugin')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kong', instanceId, 'plugins'] })
    },
  })

  const updatePluginMutation = useMutation({
    mutationFn: async ({ id, plugin }: { id: string; plugin: Partial<KongPlugin> }) => {
      if (!instanceId) throw new Error('Instance ID is required')
      const response = await fetch(`/api/kong/${instanceId}/plugins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plugin),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update plugin')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kong', instanceId, 'plugins'] })
    },
  })

  const deletePluginMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!instanceId) throw new Error('Instance ID is required')
      const response = await fetch(`/api/kong/${instanceId}/plugins/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete plugin')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kong', instanceId, 'plugins'] })
    },
  })

  return {
    routes: data?.routes || [],
    services: servicesData?.services || [],
    plugins: pluginsData?.plugins || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createRoute: async (route: Partial<KongRoute>) => {
      await createRouteMutation.mutateAsync(route)
    },
    updateRoute: async (id: string, route: Partial<KongRoute>) => {
      await updateRouteMutation.mutateAsync({ id, route })
    },
    deleteRoute: async (id: string) => {
      await deleteRouteMutation.mutateAsync(id)
    },
    createService: async (service: Partial<KongService>) => {
      await createServiceMutation.mutateAsync(service)
    },
    updateService: async (id: string, service: Partial<KongService>) => {
      await updateServiceMutation.mutateAsync({ id, service })
    },
    deleteService: async (id: string) => {
      await deleteServiceMutation.mutateAsync(id)
    },
    createPlugin: async (plugin: Partial<KongPlugin>) => {
      await createPluginMutation.mutateAsync(plugin)
    },
    updatePlugin: async (id: string, plugin: Partial<KongPlugin>) => {
      await updatePluginMutation.mutateAsync({ id, plugin })
    },
    deletePlugin: async (id: string) => {
      await deletePluginMutation.mutateAsync(id)
    },
  }
}

