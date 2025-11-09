/**
 * Field Type Constants
 * Standard field types used across the application
 */

import { Type, Hash, Mail, Phone, Link, Calendar, ToggleLeft, List, FileText, Image, File, MapPin, DollarSign, Star, Palette } from 'lucide-react'

/**
 * Field type definitions
 */
export const FIELD_TYPES = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  URL: 'URL',
  DATE: 'DATE',
  DATETIME: 'DATETIME',
  BOOLEAN: 'BOOLEAN',
  SELECT: 'SELECT',
  MULTISELECT: 'MULTISELECT',
  TEXTAREA: 'TEXTAREA',
  RICH_TEXT: 'RICH_TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  LOCATION: 'LOCATION',
  CURRENCY: 'CURRENCY',
  PERCENTAGE: 'PERCENTAGE',
  RATING: 'RATING',
  COLOR: 'COLOR',
  JSON: 'JSON',
} as const

/**
 * Field type icons mapping
 */
export const FIELD_TYPE_ICONS: Record<string, any> = {
  TEXT: Type,
  NUMBER: Hash,
  EMAIL: Mail,
  PHONE: Phone,
  URL: Link,
  DATE: Calendar,
  DATETIME: Calendar,
  BOOLEAN: ToggleLeft,
  SELECT: List,
  MULTISELECT: List,
  TEXTAREA: FileText,
  RICH_TEXT: FileText,
  IMAGE: Image,
  FILE: File,
  LOCATION: MapPin,
  CURRENCY: DollarSign,
  PERCENTAGE: Hash,
  RATING: Star,
  COLOR: Palette,
  JSON: FileText,
} as const

/**
 * Field type labels
 */
export const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Text',
  NUMBER: 'Number',
  EMAIL: 'Email',
  PHONE: 'Phone',
  URL: 'URL',
  DATE: 'Date',
  DATETIME: 'Date & Time',
  BOOLEAN: 'Boolean',
  SELECT: 'Select',
  MULTISELECT: 'Multi-Select',
  TEXTAREA: 'Textarea',
  RICH_TEXT: 'Rich Text',
  IMAGE: 'Image',
  FILE: 'File',
  LOCATION: 'Location',
  CURRENCY: 'Currency',
  PERCENTAGE: 'Percentage',
  RATING: 'Rating',
  COLOR: 'Color',
  JSON: 'JSON',
} as const

/**
 * Get field type icon
 */
export function getFieldTypeIcon(type: string) {
  return FIELD_TYPE_ICONS[type] || FileText
}

/**
 * Get field type label
 */
export function getFieldTypeLabel(type: string) {
  return FIELD_TYPE_LABELS[type] || type
}

