'use client'

import { useParams } from 'next/navigation'
import { IntakeFormManagement } from '@/components/project-management'

export default function IntakeFormsPage() {
  const params = useParams()
  const spaceId = params.space as string

  if (!spaceId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Space ID is required</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <IntakeFormManagement spaceId={spaceId} />
    </div>
  )
}
