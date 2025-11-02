'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Pencil, Layout } from 'lucide-react'

export function LayoutTitle({ name, onChange, onSave }: { name: string; onChange: (v: string) => void; onSave?: (v: string) => Promise<void> }) {
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
    </div>
  )
}

