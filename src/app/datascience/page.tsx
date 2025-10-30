'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ProjectsList } from '@/components/datascience/ProjectsList'

export default function DataScienceHome() {
  const [activeTab, setActiveTab] = useState('notebook')
  const [selectedSpace, setSelectedSpace] = useState<string>('')

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      selectedSpace={selectedSpace}
      onSpaceChange={setSelectedSpace}
    >
      {activeTab === 'notebook' && <ProjectsList />}
    </AdminLayout>
  )
}