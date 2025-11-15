'use client'

import { MarketplaceHome } from '@/features/marketplace'
import { useParams } from 'next/navigation'

export default function SpaceMarketplacePage() {
  const params = useParams()
  const spaceId = params?.space as string

  return (
    <MarketplaceHome 
      spaceId={spaceId}
      showSpaceSelector={false}
    />
  )
}

