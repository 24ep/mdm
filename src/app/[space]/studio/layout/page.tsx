'use client'

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function LayoutStudioPage() {
  const params = useParams() as { space: string }
  const router = useRouter()
  useEffect(() => {
    // Redirect into the Space Settings with sidebar visible and studio mode
    router.replace(`/${params.space}/settings?tab=space-studio&studio=layout`)
  }, [params.space, router])
  return null
}


