/**
 * Common utility functions for chart rendering
 */

/**
 * Get selected columns for a table chart
 * Combines columns (measures) and rows (dimensions) attributes
 * 
 * @param measures - Column attributes from chartDimensions.columns
 * @param dimensions - Row attributes from chartDimensions.rows (optional, also shown as columns)
 * @returns Array of unique column names
 */
export function getTableColumns(measures: string[], dimensions: string[]): string[] {
  // Combine both columns and rows attributes to show all selected attributes
  // Remove duplicates if an attribute is in both
  return [
    ...measures,  // columns from chartDimensions.columns
    ...dimensions  // rows from chartDimensions.rows (also shown as columns)
  ].filter((col, index, arr) => arr.indexOf(col) === index)
}

/**
 * Check if table has valid column configuration
 * 
 * @param columns - Array of column names
 * @returns true if columns array is not empty
 */
export function hasValidTableColumns(columns: string[]): boolean {
  return columns.length > 0
}

