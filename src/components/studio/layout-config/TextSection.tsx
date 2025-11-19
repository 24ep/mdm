'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from './ColorInput'
import { PlacedWidget } from './widgets'
import { Star, Home, Settings as SettingsIcon, User, Bell } from 'lucide-react'

interface TextSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function TextSection({ widget, selectedWidgetId, setPlacedWidgets }: TextSectionProps) {
  const props = widget.properties || {}
  const update = (k: string, v: any) => setPlacedWidgets(prev => prev.map(w => w.id === selectedWidgetId ? { ...w, properties: { ...w.properties, [k]: v } } : w))

  return (
    <div className="px-4 pb-3 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Text</Label>
        <Input
          value={String(props.text || '')}
          onChange={(e) => update('text', e.target.value)}
          placeholder="Enter text"
          className="h-7 text-xs w-32"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Show icon</Label>
        <Switch checked={!!props.textIconEnabled} onCheckedChange={(v) => update('textIconEnabled', v)} />
      </div>

      {props.textIconEnabled && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Icon</Label>
            <Select value={String(props.textIcon || 'star')} onValueChange={(v) => update('textIcon', v)}>
              <SelectTrigger className="h-7 text-xs w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="star"><div className="flex items-center gap-2"><Star className="h-4 w-4" />Star</div></SelectItem>
                <SelectItem value="home"><div className="flex items-center gap-2"><Home className="h-4 w-4" />Home</div></SelectItem>
                <SelectItem value="settings"><div className="flex items-center gap-2"><SettingsIcon className="h-4 w-4" />Settings</div></SelectItem>
                <SelectItem value="user"><div className="flex items-center gap-2"><User className="h-4 w-4" />User</div></SelectItem>
                <SelectItem value="bell"><div className="flex items-center gap-2"><Bell className="h-4 w-4" />Bell</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Icon color</Label>
            <ColorInput
              value={String(props.textIconColor || '#111827')}
              onChange={(c) => update('textIconColor', c)}
              allowImageVideo={false}
              className="relative w-32"
              inputClassName="h-7 text-xs pl-7"
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <Label className="text-xs">Font family</Label>
        <Select value={String(props.textFontFamily || props.fontFamily || 'inherit')} onValueChange={(v) => update('textFontFamily', v)}>
          <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="inherit">Inherit</SelectItem>
            <SelectItem value="system-ui">System UI</SelectItem>
            <SelectItem value="Roboto">Roboto</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="'Times New Roman'">Times New Roman</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Verdana">Verdana</SelectItem>
            <SelectItem value="'Courier New'">Courier New</SelectItem>
            <SelectItem value="monospace">Monospace</SelectItem>
            <SelectItem value="sans-serif">Sans-serif</SelectItem>
            <SelectItem value="serif">Serif</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Font size</Label>
        <Input type="number" value={Number(props.textFontSize ?? props.fontSize ?? 14)} onChange={(e) => update('textFontSize', parseInt(e.target.value) || 14)} className="h-7 text-xs w-32" />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Weight</Label>
        <Select value={String(props.textFontWeight || props.fontWeight || '400')} onValueChange={(v) => update('textFontWeight', v)}>
          <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="400">Regular (400)</SelectItem>
            <SelectItem value="500">Medium (500)</SelectItem>
              <SelectItem value="600">Semi Bold (600)</SelectItem>
              <SelectItem value="700">Bold (700)</SelectItem>
              <SelectItem value="800">Extra Bold (800)</SelectItem>
            </SelectContent>
          </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Style</Label>
        <Select value={String(props.textFontStyle || props.fontStyle || 'normal')} onValueChange={(v) => update('textFontStyle', v)}>
          <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="italic">Italic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Alignment</Label>
        <Select value={String(props.textAlign || 'left')} onValueChange={(v) => update('textAlign', v)}>
          <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Text color</Label>
        <ColorInput
          value={String(props.textColor || '#000000')}
          onChange={(c) => update('textColor', c)}
          allowImageVideo={false}
          className="relative w-32"
          inputClassName="h-7 text-xs pl-7"
        />
      </div>
    </div>
  )
}



