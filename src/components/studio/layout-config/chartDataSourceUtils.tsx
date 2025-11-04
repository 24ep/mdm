import { Calendar as CalendarIcon, Hash, Type as TypeIcon } from 'lucide-react'
import { Attribute } from './chartDataSourceTypes'

export const getTypeBadgeClass = (type?: string) => {
  const t = (type || '').toLowerCase()
  if (t.includes('int') || t.includes('num') || t.includes('dec') || t.includes('float') || t.includes('double')) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
  }
  if (t.includes('date') || t.includes('time')) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
  }
  if (t.includes('bool')) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
}

export const getAttributeIcon = (type?: string) => {
  const t = (type || '').toLowerCase()
  if (t.includes('int') || t.includes('num') || t.includes('dec') || t.includes('float') || t.includes('double')) return Hash
  if (t.includes('date') || t.includes('time')) return CalendarIcon
  return TypeIcon
}

export const getEffectiveType = (
  dimKey: string,
  attr: Attribute | undefined,
  attributeTypeOverrides: Record<string, Record<string, string>>
): string => {
  const override = attributeTypeOverrides[dimKey]?.[attr?.name || '']
  return (override || attr?.type || 'text').toLowerCase()
}

