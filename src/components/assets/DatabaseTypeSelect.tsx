'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getDatabaseTypes, type Asset } from '@/lib/assets'

interface DatabaseTypeSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  showIcons?: boolean
}

export function DatabaseTypeSelect({
  value,
  onValueChange,
  placeholder = 'Select database type',
  disabled = false,
  showIcons = true,
}: DatabaseTypeSelectProps) {
  const [databaseTypes, setDatabaseTypes] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDatabaseTypes()
  }, [])

  const loadDatabaseTypes = async () => {
    try {
      const types = await getDatabaseTypes()
      setDatabaseTypes(types.filter((t) => t.isActive))
    } catch (error) {
      console.error('Failed to load database types:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {databaseTypes.map((type) => (
          <SelectItem key={type.id} value={type.code}>
            <div className="flex items-center gap-2">
              {showIcons && type.icon && <span>{type.icon}</span>}
              <span>{type.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

