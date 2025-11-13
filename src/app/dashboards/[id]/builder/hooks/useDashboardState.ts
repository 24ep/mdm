import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export interface Dashboard {
  id: string
  name: string
  description?: string
  folder_id?: string | null
  background_color: string
  font_family: string
  font_size: number
  refresh_interval_ms?: number
  grid_size: number
  layout_config: any
  style_config: any
  page_nav_placement?: 'top' | 'left' | 'right' | 'button' | 'icon'
  fullpage_background?: boolean
  pages?: Array<{ id: string; name: string; order: number }>
  elements: DashboardElement[]
  datasources: DataSource[]
  filters: any[]
  visibility: 'PRIVATE' | 'RESTRICTED' | 'PUBLIC'
  public_link?: string
  allowed_users?: string[]
  embed_enabled: boolean
  theme?: any
  created_by: string
  created_at: string
  updated_at: string
}

export interface DashboardElement {
  id: string
  name: string
  type: string
  chart_type?: string
  page_id?: string
  position_x: number
  position_y: number
  width: number
  height: number
  z_index: number
  config: any
  style: any
  data_config: {
    data_model_id: string | null
    query: string
    dimensions: string[]
    measures: string[]
    filters: Array<{
      field: string
      operator: string
      value: any
    }>
    refresh_interval?: number
    cache_enabled?: boolean
  }
  is_visible: boolean
}

export interface DataSource {
  id: string
  name: string
  type: 'DATABASE' | 'API' | 'FILE' | 'MANUAL' | 'DATA_MODEL'
  connection_string?: string
  api_endpoint?: string
  file_path?: string
  data_model_id?: string
  query?: string
  headers?: Record<string, string>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  name: string
  parent_id?: string | null
  created_by?: string
  created_at?: string
  updated_at?: string
}

export function useDashboardState(spaceId?: string) {
  const params = useParams()
  const router = useRouter()
  const dashboardId = params.id as string

  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedElement, setSelectedElement] = useState<DashboardElement | null>(null)
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [gridSize, setGridSize] = useState(12)
  const [zoom, setZoom] = useState(100)
  const [showPixelMode, setShowPixelMode] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [canvasWidth, setCanvasWidth] = useState(1200)
  const [canvasHeight, setCanvasHeight] = useState(800)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboards/${dashboardId}`)
      if (!response.ok) {
        throw new Error('Failed to load dashboard')
      }

      const data = await response.json()
      setDashboard(data.dashboard)
      setGridSize(data.dashboard.grid_size || 12)
      
      // Load data models
      await loadDataSources(spaceId)
      // Load folders
      await loadFolders()
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadDataSources = async (spaceId?: string) => {
    try {
      const collected: any[] = []
      // 1) Try entities space models
      try {
        const spaceParam = spaceId ? `?space_id=${spaceId}` : ''
        const res = await fetch(`/api/data/entities/models${spaceParam}`)
        if (res.ok) {
          const payload = await res.json()
          const models = Array.isArray(payload?.models) ? payload.models : (Array.isArray(payload) ? payload : [])
          collected.push(...models.map((m: any) => ({
            id: m.id || m.uuid || m.name,
            name: m.name || m.title || 'Model',
            type: 'DATA_MODEL',
            data_model_id: m.id || m.uuid || m.name,
            is_active: true,
            created_at: m.created_at || new Date().toISOString(),
            updated_at: m.updated_at || new Date().toISOString()
          })))
        }
      } catch {}
      // 2) Fallback to settings data-models with space filtering
      if (collected.length === 0) {
        try {
          const spaceParam = spaceId ? `&space_id=${spaceId}` : ''
          const res = await fetch(`/api/data-models?page=1&limit=100${spaceParam}`)
          if (res.ok) {
            const payload = await res.json()
            const models = Array.isArray(payload?.dataModels) ? payload.dataModels : (Array.isArray(payload) ? payload : [])
            collected.push(...models.map((m: any) => ({
              id: m.id || m.uuid || m.name,
              name: m.name || m.title || 'Model',
              type: 'DATA_MODEL',
              data_model_id: m.id || m.uuid || m.name,
              is_active: true,
              created_at: m.created_at || new Date().toISOString(),
              updated_at: m.updated_at || new Date().toISOString()
            })))
          }
        } catch {}
      }
      // 3) Fallback to generic data-sources filtered to models
      if (collected.length === 0) {
        try {
          const res = await fetch('/api/data-sources')
          if (res.ok) {
            const payload = await res.json()
            const sources = Array.isArray(payload?.dataSources) ? payload.dataSources : (Array.isArray(payload) ? payload : [])
            collected.push(...sources.filter((s: any) => (s?.type === 'DATA_MODEL')).map((s: any) => ({
              id: s.id,
              name: s.name,
              type: 'DATA_MODEL',
              data_model_id: s.data_model_id || s.id,
              is_active: !!s.is_active,
              created_at: s.created_at || new Date().toISOString(),
              updated_at: s.updated_at || new Date().toISOString()
            })))
          }
        } catch {}
      }

      setDataSources(collected)
    } catch (error) {
      console.error('Error loading data sources:', error)
      setDataSources([])
    }
  }

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/folders')
      if (response.ok) {
        const data = await response.json()
        setFolders(Array.isArray(data.folders) ? data.folders : [])
      }
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  const saveDashboard = async () => {
    if (!dashboard) return

    try {
      setSaving(true)
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dashboard,
          grid_size: gridSize
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save dashboard')
      }

      toast.success('Dashboard saved successfully')
    } catch (error) {
      console.error('Error saving dashboard:', error)
      toast.error('Failed to save dashboard')
    } finally {
      setSaving(false)
    }
  }

  const updateElement = useCallback((elementId: string, updates: Partial<DashboardElement>) => {
    if (!dashboard) return

    setDashboard({
      ...dashboard,
      elements: dashboard.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    })
  }, [dashboard])

  const deleteElement = useCallback((elementId: string) => {
    if (!dashboard) return

    setDashboard({
      ...dashboard,
      elements: dashboard.elements.filter(el => el.id !== elementId)
    })
    setSelectedElement(null)
  }, [dashboard])

  useEffect(() => {
    if (dashboardId) {
      loadDashboard()
    }
  }, [dashboardId])

  return {
    dashboard,
    setDashboard,
    loading,
    saving,
    selectedElement,
    setSelectedElement,
    dataSources,
    folders,
    setDataSources,
    gridSize,
    setGridSize,
    zoom,
    setZoom,
    showPixelMode,
    setShowPixelMode,
    snapToGrid,
    setSnapToGrid,
    canvasWidth,
    setCanvasWidth,
    canvasHeight,
    setCanvasHeight,
    saveDashboard,
    updateElement,
    deleteElement,
    loadDataSources
  }
}


