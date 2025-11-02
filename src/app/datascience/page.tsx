'use client'

import { useState } from 'react'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { ProjectsList } from '@/components/datascience/ProjectsList'

export default function DataScienceHome() {
  const [activeTab, setActiveTab] = useState('notebook')
  const [selectedSpace, setSelectedSpace] = useState<string>('')

  return (
    <PlatformLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      selectedSpace={selectedSpace}
      onSpaceChange={setSelectedSpace}
    >
      {activeTab === 'notebook' && <ProjectsList />}
    </PlatformLayout>
  )
}