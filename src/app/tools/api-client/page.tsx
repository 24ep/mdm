'use client'

import { ApiClient } from '@/features/api-client/components/ApiClient'
import { useEffect, useState } from 'react'

export default function ApiClientPage() {
  const [workspaceId, setWorkspaceId] = useState<string | undefined>()

  // Get or create a workspace
  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        // Try to get existing workspace or create a new one
        const res = await fetch('/api/api-client/workspaces')
        if (res.ok) {
          const data = await res.json()
          if (data.workspaces && data.workspaces.length > 0) {
            setWorkspaceId(data.workspaces[0].id)
          } else {
            // Create a default workspace
            const createRes = await fetch('/api/api-client/workspaces', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: 'My Workspace',
                isPersonal: true,
              }),
            })
            if (createRes.ok) {
              const createData = await createRes.json()
              setWorkspaceId(createData.workspace.id)
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize workspace:', error)
      }
    }

    initializeWorkspace()
  }, [])

  return (
    <div className="h-screen">
      {workspaceId && <ApiClient workspaceId={workspaceId} />}
    </div>
  )
}

