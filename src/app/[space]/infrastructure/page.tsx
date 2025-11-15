'use client'

import { InfrastructureOverview } from '@/features/infrastructure'
import { useParams } from 'next/navigation'

export default function SpaceInfrastructurePage() {
  const params = useParams()
  const spaceId = params?.space as string

  return (
    <InfrastructureOverview 
      spaceId={spaceId}
      showSpaceSelector={false}
    />
  )
}

