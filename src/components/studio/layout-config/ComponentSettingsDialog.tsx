'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ComponentConfig } from './types'

interface ComponentSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobileViewport: boolean
  componentConfigs: Record<string, ComponentConfig>
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
}

export function ComponentSettingsDialog({
  open,
  onOpenChange,
  isMobileViewport,
  componentConfigs,
  handleComponentConfigUpdate,
}: ComponentSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobileViewport ? 'w-[90vw] max-w-[90vw]' : 'w-[600px] max-w-[600px]'} max-h-[80vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>Component Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Sidebar, top, and footer settings removed - pages now use secondary platform sidebar */}
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Component settings for sidebar, top menu bar, and footer have been removed.</p>
            <p className="text-xs mt-2">Pages now use the secondary platform sidebar for navigation.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
