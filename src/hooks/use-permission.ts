'use client'

import { useSession } from 'next-auth/react'
import { useSpace } from '@/contexts/space-context'
import { useState, useEffect, useMemo } from 'react'

export interface UsePermissionOptions {
  permissionId?: string
  resource?: string
  action?: string
  spaceId?: string
}

export interface PermissionResult {
  hasPermission: boolean
  loading: boolean
  source?: 'global' | 'space' | 'none'
  role?: string
}

/**
 * Hook to check if current user has a specific permission
 * @param permissionId - Permission ID in format "resource:action" (e.g., "space:edit")
 * @param options - Additional options for permission check
 */
export function usePermission(
  permissionId?: string,
  options?: UsePermissionOptions
): PermissionResult {
  const { data: session } = useSession()
  const { currentSpace } = useSpace()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<Omit<PermissionResult, 'loading'>>({
    hasPermission: false
  })

  const spaceId = options?.spaceId || currentSpace?.id

  useEffect(() => {
    if (!permissionId || !session?.user?.id) {
      setLoading(false)
      setResult({ hasPermission: false })
      return
    }

    const checkPermission = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/permissions/check?permissionId=${encodeURIComponent(permissionId)}${spaceId ? `&spaceId=${spaceId}` : ''}`
        )
        if (response.ok) {
          const data = await response.json()
          setResult({
            hasPermission: data.hasPermission || false,
            source: data.source,
            role: data.role
          })
        } else {
          setResult({ hasPermission: false })
        }
      } catch (error) {
        console.error('Error checking permission:', error)
        setResult({ hasPermission: false })
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [permissionId, session?.user?.id, spaceId])

  return { ...result, loading }
}

/**
 * Hook to check if current user has any of the specified permissions
 */
export function useAnyPermission(
  permissionIds: string[],
  options?: UsePermissionOptions
): PermissionResult {
  const { data: session } = useSession()
  const { currentSpace } = useSpace()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<Omit<PermissionResult, 'loading'>>({
    hasPermission: false
  })

  const spaceId = options?.spaceId || currentSpace?.id

  useEffect(() => {
    if (!permissionIds.length || !session?.user?.id) {
      setLoading(false)
      setResult({ hasPermission: false })
      return
    }

    const checkPermissions = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/permissions/check-any', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permissionIds,
            spaceId
          })
        })
        if (response.ok) {
          const data = await response.json()
          setResult({
            hasPermission: data.hasPermission || false,
            source: data.source,
            role: data.role
          })
        } else {
          setResult({ hasPermission: false })
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
        setResult({ hasPermission: false })
      } finally {
        setLoading(false)
      }
    }

    checkPermissions()
  }, [permissionIds.join(','), session?.user?.id, spaceId])

  return { ...result, loading }
}

/**
 * Hook to check if current user has all of the specified permissions
 */
export function useAllPermissions(
  permissionIds: string[],
  options?: UsePermissionOptions
): PermissionResult {
  const { data: session } = useSession()
  const { currentSpace } = useSpace()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<Omit<PermissionResult, 'loading'>>({
    hasPermission: false
  })

  const spaceId = options?.spaceId || currentSpace?.id

  useEffect(() => {
    if (!permissionIds.length || !session?.user?.id) {
      setLoading(false)
      setResult({ hasPermission: false })
      return
    }

    const checkPermissions = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/permissions/check-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permissionIds,
            spaceId
          })
        })
        if (response.ok) {
          const data = await response.json()
          setResult({
            hasPermission: data.hasPermission || false,
            source: data.source,
            role: data.role
          })
        } else {
          setResult({ hasPermission: false })
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
        setResult({ hasPermission: false })
      } finally {
        setLoading(false)
      }
    }

    checkPermissions()
  }, [permissionIds.join(','), session?.user?.id, spaceId])

  return { ...result, loading }
}

/**
 * Hook to get current user's role information
 */
export function useRole() {
  const { data: session } = useSession()
  const { currentSpace } = useSpace()

  return useMemo(() => {
    return {
      globalRole: session?.user?.role || null,
      spaceRole: currentSpace?.user_role || null,
      isSuperAdmin: session?.user?.role === 'SUPER_ADMIN',
      isAdmin: ['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role || ''),
      isManager: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session?.user?.role || ''),
      isSpaceOwner: currentSpace?.created_by === session?.user?.id,
      isSpaceAdmin: currentSpace?.user_role === 'admin' || currentSpace?.created_by === session?.user?.id
    }
  }, [session?.user?.role, session?.user?.id, currentSpace?.user_role, currentSpace?.created_by])
}

/**
 * Hook to get all permissions for current user
 */
export function useUserPermissions(options?: { spaceId?: string }) {
  const { data: session } = useSession()
  const { currentSpace } = useSpace()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const spaceId = options?.spaceId || currentSpace?.id

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    const loadPermissions = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/permissions/user${spaceId ? `?spaceId=${spaceId}` : ''}`
        )
        if (response.ok) {
          const data = await response.json()
          setPermissions(data.permissions || [])
        }
      } catch (error) {
        console.error('Error loading user permissions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [session?.user?.id, spaceId])

  return { permissions, loading }
}






