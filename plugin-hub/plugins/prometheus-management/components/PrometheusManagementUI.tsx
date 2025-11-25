'use client'

import { InstanceService, InfrastructureInstance } from '@/features/infrastructure/types'
import { PrometheusManagement } from '@/features/infrastructure/components/PrometheusManagement'

export interface PrometheusManagementUIProps {
  service: InstanceService
  instance: InfrastructureInstance
  config: Record<string, any>
}

export default function PrometheusManagementUI({
  service,
  instance,
  config,
}: PrometheusManagementUIProps) {
  return (
    <div className="space-y-4">
      <PrometheusManagement instanceId={instance.id} />
    </div>
  )
}

