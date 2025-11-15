'use client'

import { OutlineKnowledgeBase } from '@/features/knowledge'
import { useParams } from 'next/navigation'

export default function SpaceKnowledgePage() {
  const params = useParams()
  const spaceId = params?.space as string

  return (
    <div className="h-screen">
      <OutlineKnowledgeBase spaceId={spaceId} />
    </div>
  )
}

