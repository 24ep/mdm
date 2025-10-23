'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { SpaceDashboard } from '@/components/dashboard/SpaceDashboard'

export default function SpaceDashboardPage() {
  const params = useParams()
  const spaceId = params.space as string
  const [isEditMode, setIsEditMode] = useState(false)

  // In a real implementation, you would fetch the space name from the API
  const spaceName = 'Space Dashboard' // This would come from space data

  return (
    <SpaceDashboard
      spaceId={spaceId}
      spaceName={spaceName}
      isEditMode={isEditMode}
      onEditModeChange={setIsEditMode}
    />
  )
}