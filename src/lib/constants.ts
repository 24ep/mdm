/**
 * Standardized height constants for consistent scrolling behavior across the application
 */
export const SCROLLABLE_HEIGHTS = {
  SMALL: 'max-h-[200px]',
  MEDIUM: 'max-h-[400px]', 
  LARGE: 'max-h-[600px]',
  EXTRA_LARGE: 'max-h-[800px]',
  VIEWPORT: 'max-h-[60vh]',
  FULL: 'max-h-[80vh]'
} as const

export type ScrollableHeight = keyof typeof SCROLLABLE_HEIGHTS

/**
 * Get the CSS class for a scrollable height
 */
export function getScrollableHeight(height: ScrollableHeight): string {
  return SCROLLABLE_HEIGHTS[height]
}
