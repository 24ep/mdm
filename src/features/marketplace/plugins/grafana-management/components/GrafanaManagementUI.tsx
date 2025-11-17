'use client'

import { InstanceService, InfrastructureInstance } from '@/features/infrastructure/types'
import { GrafanaManagement } from '@/features/infrastructure/components/GrafanaManagement'

export interface GrafanaManagementUIProps {
  service: InstanceService
  instance: InfrastructureInstance
  config: Record<string, any>
}

export default function GrafanaManagementUI({
  service,
  instance,
  config,
}: GrafanaManagementUIProps) {
  return (
    <div className="space-y-4">
      <GrafanaManagement instanceId={instance.id} />
    </div>
  )
}

