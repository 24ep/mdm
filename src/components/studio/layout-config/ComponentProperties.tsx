'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ComponentConfig } from './types'

interface ComponentPropertiesProps {
  config: ComponentConfig
  selectedComponent: string
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
}

export function ComponentProperties({
  config,
  selectedComponent,
  handleComponentConfigUpdate,
}: ComponentPropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="border-b pb-3 px-4">
        <h3 className="font-semibold text-sm capitalize">{config.type} Component</h3>
        <p className="text-xs text-muted-foreground">Component Properties</p>
      </div>

      {/* Visibility */}
      <div className="flex items-center justify-between px-4">
        <Label className="text-xs">Visible</Label>
        <Switch
          checked={config.visible}
          onCheckedChange={(checked) => {
            handleComponentConfigUpdate(selectedComponent, { visible: checked })
          }}
        />
      </div>

      {/* Dimensions */}
      {config.width !== undefined && (
        <div className="space-y-1 px-4">
          <Label className="text-xs">Width</Label>
          <Input
            type="number"
            value={config.width}
            onChange={(e) => {
              handleComponentConfigUpdate(selectedComponent, { width: parseInt(e.target.value) || 0 })
            }}
            className="h-7 text-xs"
          />
        </div>
      )}

      {config.height !== undefined && (
        <div className="space-y-1 px-4">
          <Label className="text-xs">Height</Label>
          <Input
            type="number"
            value={config.height}
            onChange={(e) => {
              handleComponentConfigUpdate(selectedComponent, { height: parseInt(e.target.value) || 0 })
            }}
            className="h-7 text-xs"
          />
        </div>
      )}

      {/* Colors */}
      <div className="space-y-2 px-4">
        <Label className="text-xs font-semibold">Colors</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Background</Label>
            <div className="relative">
              <Input
                type="color"
                value={config.backgroundColor || '#ffffff'}
                onChange={(e) => {
                  handleComponentConfigUpdate(selectedComponent, { backgroundColor: e.target.value })
                }}
                className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none"
                style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
              />
              <Input
                type="text"
                value={config.backgroundColor || '#ffffff'}
                onChange={(e) => {
                  handleComponentConfigUpdate(selectedComponent, { backgroundColor: e.target.value })
                }}
                className="h-7 text-xs pl-7"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Text</Label>
            <div className="relative">
              <Input
                type="color"
                value={config.textColor || '#374151'}
                onChange={(e) => {
                  handleComponentConfigUpdate(selectedComponent, { textColor: e.target.value })
                }}
                className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none"
                style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
              />
              <Input
                type="text"
                value={config.textColor || '#374151'}
                onChange={(e) => {
                  handleComponentConfigUpdate(selectedComponent, { textColor: e.target.value })
                }}
                className="h-7 text-xs pl-7"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

