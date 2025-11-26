'use client'

import { TicketsList } from '@/features/tickets'

export default function ProjectsPage() {
  return (
    <div className="h-screen p-6">
      <TicketsList 
        spaceId={null}
        viewMode="kanban"
        showFilters={true}
        showSpaceSelector={true}
      />
    </div>
  )
}

