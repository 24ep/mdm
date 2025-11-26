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

// Note: Users can switch to timesheet view using the view mode buttons in TicketsList
// The timesheet view is now fully integrated and supports time tracking features