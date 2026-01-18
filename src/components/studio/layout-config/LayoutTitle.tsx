'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Pencil, Layout } from 'lucide-react'

export type PageType = 'general' | 'dashboard'

interface LayoutTitleProps {
  name: string
  onChange: (v: string) => void
  onSave?: (v: string) => Promise<void>
  pageType?: PageType
  onPageTypeChange?: (type: PageType) => void
}

export function LayoutTitle({ 
  name, 
  onChange, 
  onSave,
  pageType = 'general',
  onPageTypeChange
}: LayoutTitleProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  useEffect(() => { setValue(name) }, [name])

  const commit = useCallback(async () => {
    const newName = value.trim() || 'Layout'
    onChange(newName)
    if (onSave) {
      try {
        await onSave(newName)
      } catch (e) {
        console.error('Failed to save layout name:', e)
      }
    }
    setEditing(false)
  }, [onChange, onSave, value])

  if (editing) {
    return (
      <div className="flex items-center gap-2 ml-4">
        <Layout className="h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
          className="h-8"
          autoFocus
        />
        <Button size="sm" variant="outline" onClick={commit}><Save className="h-4 w-4" /></Button>
        {onPageTypeChange && (
          <Select value={pageType} onValueChange={(value) => onPageTypeChange(value as PageType)}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Page Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="dashboard">Dashboard</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 ml-4">
      <Layout className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{name}</h2>
      <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit name">
        <Pencil className="h-4 w-4" />
      </Button>
      {onPageTypeChange && (
        <Select value={pageType} onValueChange={(value) => onPageTypeChange(value as PageType)}>
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="Page Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="dashboard">Dashboard</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
