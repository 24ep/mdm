/**
 * Centralized z-index scale following best practices
 * 
 * Z-index layers (increment by 100 for flexibility):
 * - Base (0-99): Default content, static elements
 * - Low (100-999): Sidebars, navigation, dropdowns
 * - Medium (1000-1999): Popovers, tooltips, floating elements
 * - High (2000-2999): Modals, drawers, dialogs
 * - Very High (3000-3999): Notifications, toasts, alerts
 * - Widget (4000+): External widgets, chat widgets that need to be above everything
 */
export const Z_INDEX = {
  // Base layer (0-99)
  base: 0,
  content: 1,
  
  // Canvas/Widget layers (10-99)
  canvasElement: 10,
  canvasElementSelected: 20,
  canvasElementDragging: 50,
  canvasLockIndicator: 50,
  
  // Low layer (100-999)
  sidebar: 100,
  navigation: 200,
  dropdown: 300,
  sticky: 400,
  
  // Medium layer (1000-1999)
  tooltip: 1000,
  popover: 1100,
  floatingToolbar: 1200,
  sortableDragging: 1300,
  
  // High layer (2000-2999)
  overlay: 2000,
  drawer: 2100,
  modal: 2200,
  dialog: 2300,
  
  // Very High layer (3000-3999)
  notification: 3000,
  toast: 3100,
  alert: 3200,
  
  // Widget layer (4000+)
  widget: 4000,
  widgetOverlay: 3900,
  widgetWindow: 4100,
  chatWidget: 4000,
  chatWidgetOverlay: 3900,
  chatWidgetWindow: 4100,
  chatWidgetControl: 10002, // Chat widget control buttons
  chatWidgetOverlayText: 10003, // Chat widget overlay text
  chatWidgetPreview: 10004, // Chat widget preview selector
} as const

export type ZIndexKey = keyof typeof Z_INDEX

/**
 * Helper function to get z-index value
 */
export function getZIndex(key: ZIndexKey): number {
  return Z_INDEX[key]
}

/**
 * Helper function to calculate relative z-index
 * Useful for widgets that need to be above/below each other
 */
export function getRelativeZIndex(baseKey: ZIndexKey, offset: number): number {
  return Z_INDEX[baseKey] + offset
}

