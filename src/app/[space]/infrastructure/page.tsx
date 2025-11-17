'use client'

import { InfrastructureOverview } from '@/features/infrastructure'
import { useParams } from 'next/navigation'

export default function SpaceInfrastructurePage() {
  const params = useParams()
  const spaceId = params?.space as string

  return (
    <div className="p-6">
      <InfrastructureOverview 
        spaceId={spaceId}
        showSpaceSelector={false}
      />
    </div>
  )
}

