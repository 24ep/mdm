'use client'

import React from 'react'
import { ComponentConfig } from './types'

interface SettingsTabProps {
  spaceId: string
  isMobileViewport: boolean
  componentConfigs: Record<string, ComponentConfig>
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
  pages: any[]
}

export function SettingsTab({
  spaceId,
  isMobileViewport,
  componentConfigs,
  handleComponentConfigUpdate,
  pages,
}: SettingsTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 text-sm text-muted-foreground text-center">
        Global configuration has been moved to the Global Config drawer. Click the "Global Config" button in the toolbar to access it.
      </div>
    </div>
  )
}

