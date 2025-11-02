'use client'

import { GlobalStyleConfig, ComponentStyle } from './types'
import { WidgetType } from './widgets'

/**
 * Maps widget types to global component style types
 */
export function getWidgetComponentType(widgetType: WidgetType): keyof NonNullable<GlobalStyleConfig['components']> | null {
  // Map widget types to component styles
  const mapping: Record<string, keyof NonNullable<GlobalStyleConfig['components']>> = {
    'card': 'card',
    'button': 'button',
    'text': 'card',
    'input': 'input',
    'select': 'select',
    'table': 'table',
    'tabs': 'tabs',
    'modal': 'modal',
    'tooltip': 'tooltip',
  }
  
  // Check for exact match first
  if (mapping[widgetType]) {
    return mapping[widgetType]
  }
  
  // Check for partial matches (e.g., "text-filter" -> "input")
  if (widgetType.includes('filter') || widgetType.includes('input')) {
    return 'input'
  }
  
  if (widgetType.includes('button')) {
    return 'button'
  }
  
  if (widgetType.includes('table')) {
    return 'table'
  }
  
  if (widgetType.includes('tabs') || widgetType.includes('tab')) {
    return 'tabs'
  }
  
  // Default to card for most widgets
  return 'card'
}

/**
 * Gets the effective style value for a widget property
 * Returns widget property if set, otherwise falls back to global component style
 */
export function getEffectiveStyle(
  widgetProperty: any,
  globalStyle: ComponentStyle | undefined,
  propertyKey: keyof ComponentStyle
): any {
  // If widget has explicit property value, use it
  if (widgetProperty !== undefined && widgetProperty !== null) {
    return widgetProperty
  }
  
  // Otherwise, use global style
  return globalStyle?.[propertyKey]
}

/**
 * Checks if a widget property is using global style (not overridden)
 */
export function isUsingGlobalStyle(
  widgetProperty: any,
  globalStyle: ComponentStyle | undefined,
  propertyKey: keyof ComponentStyle
): boolean {
  // If widget property is undefined/null, it's using global
  if (widgetProperty === undefined || widgetProperty === null) {
    return true
  }
  
  // If global style doesn't exist for this property, it's not using global
  if (globalStyle?.[propertyKey] === undefined) {
    return false
  }
  
  // Compare values
  return widgetProperty === globalStyle[propertyKey]
}

/**
 * Resets a widget property to use global style (sets to undefined)
 */
export function resetToGlobalStyle(
  propertyKey: string,
  widgetProperties: Record<string, any>,
  setProperties: (properties: Record<string, any>) => void
) {
  const newProperties = { ...widgetProperties }
  // Set to undefined to use global style
  delete newProperties[propertyKey]
  setProperties(newProperties)
}

