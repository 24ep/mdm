'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { TicketsList } from '@/features/tickets'

export default function ProjectsPage() {
  return (
    <MainLayout>
      <TicketsList 
        spaceId={null}
        viewMode="kanban"
        showFilters={true}
        showSpaceSelector={false}
      />
    </MainLayout>
  )
}

