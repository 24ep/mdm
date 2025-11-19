'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ComponentConfig } from './types'
import { ColorInput } from './ColorInput'

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
        <div className="flex items-center justify-between px-4">
          <Label className="text-xs">Width</Label>
          <Input
            type="number"
            value={config.width}
            onChange={(e) => {
              handleComponentConfigUpdate(selectedComponent, { width: parseInt(e.target.value) || 0 })
            }}
            className="h-7 text-xs w-32"
          />
        </div>
      )}

      {config.height !== undefined && (
        <div className="flex items-center justify-between px-4">
          <Label className="text-xs">Height</Label>
          <Input
            type="number"
            value={config.height}
            onChange={(e) => {
              handleComponentConfigUpdate(selectedComponent, { height: parseInt(e.target.value) || 0 })
            }}
            className="h-7 text-xs w-32"
          />
        </div>
      )}

      {/* Colors */}
      <div className="space-y-2 px-4">
        <Label className="text-xs font-semibold">Colors</Label>
        <div className="flex items-center justify-between">
            <Label className="text-xs">Background</Label>
            <ColorInput
              value={config.backgroundColor || '#ffffff'}
              onChange={(color) => {
                handleComponentConfigUpdate(selectedComponent, { backgroundColor: color })
              }}
              allowImageVideo={false}
            className="relative w-32"
              inputClassName="h-7 text-xs pl-7"
            />
          </div>
        <div className="flex items-center justify-between">
            <Label className="text-xs">Text</Label>
            <ColorInput
              value={config.textColor || '#374151'}
              onChange={(color) => {
                handleComponentConfigUpdate(selectedComponent, { textColor: color })
              }}
              allowImageVideo={false}
            className="relative w-32"
              inputClassName="h-7 text-xs pl-7"
            />
        </div>
      </div>
    </div>
  )
}

