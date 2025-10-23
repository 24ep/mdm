'use client'

import { useSession } from 'next-auth/react'
import { useSpace } from '@/contexts/space-context'
import { useMemo } from 'react'

export interface SpacePermissions {
  canEdit: boolean
  canDelete: boolean
  canCreate: boolean
  canView: boolean
  userRole: string | null
  isOwner: boolean
  isAdmin: boolean
  isMember: boolean
}

export function useSpacePermissions(): SpacePermissions {
  const { data: session } = useSession()
  const { currentSpace } = useSpace()

  return useMemo(() => {
    if (!session?.user?.id || !currentSpace) {
      return {
        canEdit: false,
        canDelete: false,
        canCreate: false,
        canView: false,
        userRole: null,
        isOwner: false,
        isAdmin: false,
        isMember: false
      }
    }

    const userRole = currentSpace.user_role || null
    const isOwner = currentSpace.created_by === session.user.id
    const isAdmin = userRole === 'ADMIN' || isOwner
    const isMember = userRole === 'MEMBER' || isAdmin

    // Permission logic based on role hierarchy:
    // OWNER (creator) > ADMIN > MEMBER > VIEWER
    const canEdit = isAdmin || userRole === 'MEMBER'
    const canDelete = isAdmin
    const canCreate = isAdmin || userRole === 'MEMBER'
    const canView = isMember || userRole === 'VIEWER'

    return {
      canEdit,
      canDelete,
      canCreate,
      canView,
      userRole,
      isOwner,
      isAdmin,
      isMember
    }
  }, [session?.user?.id, currentSpace])
}
