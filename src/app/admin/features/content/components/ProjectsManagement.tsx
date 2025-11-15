'use client'

import { TicketsList } from '@/features/tickets'

export function ProjectsManagement() {
  return (
    <div className="p-6">
      <TicketsList 
        spaceId={null}
        viewMode="kanban"
        showFilters={true}
        showSpaceSelector={true}
      />
    </div>
  )
}
