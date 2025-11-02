'use client'

import { useParams } from 'next/navigation'
import LayoutConfig from '@/components/studio/layout-config'
import { useSpace } from '@/contexts/space-context'

export default function LayoutConfigPage() {
  const params = useParams() as { space: string; layoutname: string }
  const { currentSpace } = useSpace()
  
  return (
    <div className="h-full flex flex-col min-h-0">
      <LayoutConfig 
        spaceId={currentSpace?.id || params.space}
        layoutName={params.layoutname}
      />
    </div>
  )
}

