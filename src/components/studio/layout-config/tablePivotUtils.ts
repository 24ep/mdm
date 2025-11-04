/**
 * Looker Studio-style table pivot utilities
 * 
 * When attributes are in "columns" dimension, their distinct values become column headers
 * When attributes are in "rows" dimension, they group rows
 * When attributes are in "values" dimension (pivot-table), they aggregate in cells
 */

export interface PivotConfig {
  columnAttrs: string[]
  rowAttrs: string[]
  valueAttrs: string[]
}

export interface PivotedData {
  pivotedData: any[]
  columnHeaders: string[]
}

/**
 * Pivot data according to Looker Studio-style logic
 * @param data Raw data array
 * @param config Pivot configuration
 * @returns Pivoted data structure with column headers
 */
export function pivotTableData(data: any[], config: PivotConfig): PivotedData {
  const { columnAttrs, rowAttrs, valueAttrs } = config
  const shouldPivot = columnAttrs.length > 0
  const hasRows = rowAttrs.length > 0
  const hasValues = valueAttrs.length > 0

  if (!shouldPivot || !data || data.length === 0) {
    return { pivotedData: [], columnHeaders: [] }
  }

  // Get all unique values from column attributes - these become column headers
  const columnHeaderValues = new Set<string>()
  data.forEach(row => {
    columnAttrs.forEach(attr => {
      const value = row[attr]
      if (value !== undefined && value !== null) {
        // Create composite key if multiple column attributes
        const key = columnAttrs.length > 1
          ? columnAttrs.map(a => String(row[a] || '')).join(' | ')
          : String(value)
        columnHeaderValues.add(key)
      }
    })
  })

  const columnHeaders = Array.from(columnHeaderValues).sort()

  // If no row attributes, just show the pivoted columns
  if (!hasRows) {
    // Simple pivot: each row becomes columns based on column attribute values
    const pivotedData = data.map((row, idx) => {
      const rowData: any = { __originalIndex: idx }
      columnHeaders.forEach(header => {
        // Match row's column attribute values to header
        const rowColumnKey = columnAttrs.length > 1
          ? columnAttrs.map(a => String(row[a] || '')).join(' | ')
          : String(row[columnAttrs[0]] || '')
        rowData[header] = rowColumnKey === header ? row : null
      })
      return rowData
    })
    return { pivotedData, columnHeaders }
  }

  // Group by row attributes and pivot column attributes
  const groupedMap: Record<string, any> = {}

  data.forEach(row => {
    // Create row key from row attributes
    const rowKey = hasRows
      ? rowAttrs.map(attr => String(row[attr] || '')).join(' | ')
      : String(row.__id || Math.random())

    // Create column key from column attributes
    const colKey = columnAttrs.length > 1
      ? columnAttrs.map(attr => String(row[attr] || '')).join(' | ')
      : String(row[columnAttrs[0]] || '')

    if (!groupedMap[rowKey]) {
      groupedMap[rowKey] = {
        __rowKey: rowKey,
        __rowValues: rowAttrs.reduce((acc, attr) => {
          acc[attr] = row[attr]
          return acc
        }, {} as Record<string, any>),
        ...Object.fromEntries(columnHeaders.map(h => [h, null]))
      }
    }

    // Store the value in the appropriate column
    const groupData = groupedMap[rowKey]

    // Find the matching column header
    const matchingHeader = columnHeaders.find(h => {
      if (columnAttrs.length > 1) {
        return h === colKey
      } else {
        return h === String(row[columnAttrs[0]] || '')
      }
    }) || colKey

    if (hasValues && valueAttrs.length > 0) {
      // For pivot tables: aggregate values from value attributes
      if (!groupData[matchingHeader]) {
        groupData[matchingHeader] = {}
      }
      valueAttrs.forEach(valueAttr => {
        const existing = groupData[matchingHeader][valueAttr]
        const current = row[valueAttr]
        if (existing === null || existing === undefined) {
          groupData[matchingHeader][valueAttr] = current
        } else if (typeof current === 'number' && typeof existing === 'number') {
          // Sum numeric values
          groupData[matchingHeader][valueAttr] = existing + current
        } else {
          // Keep first value
          if (groupData[matchingHeader][valueAttr] === undefined) {
            groupData[matchingHeader][valueAttr] = current
          }
        }
      })
    } else {
      // For regular tables: store values from all non-row, non-column attributes
      if (!groupData[matchingHeader]) {
        groupData[matchingHeader] = {}
      }
      // Store all attributes that are not row or column attributes
      const allDataAttrs = Object.keys(row).filter(key => 
        !key.startsWith('__') && 
        !rowAttrs.includes(key) && 
        !columnAttrs.includes(key)
      )
      if (allDataAttrs.length > 0) {
        allDataAttrs.forEach(attr => {
          groupData[matchingHeader][attr] = row[attr]
        })
      } else {
        // If no other attributes, store the entire row
        groupData[matchingHeader] = row
      }
    }
  })

  const pivotedData = Object.values(groupedMap)
  return { pivotedData, columnHeaders }
}

/**
 * Get cell value from pivoted data
 * @param rowData Pivoted row data
 * @param columnHeader Column header key
 * @param valueAttr Optional value attribute name (for pivot tables)
 * @param rowAttrs Row attributes array (to filter out)
 * @param columnAttrs Column attributes array (to filter out)
 * @param hasValues Whether values dimension is configured
 * @returns Formatted cell value string
 */
export function getPivotCellValue(
  rowData: any,
  columnHeader: string,
  valueAttr?: string,
  rowAttrs: string[] = [],
  columnAttrs: string[] = [],
  hasValues: boolean = false
): string {
  if (!rowData || !columnHeader) return ''

  const cell = rowData[columnHeader]
  if (cell === null || cell === undefined) return ''

  if (hasValues && valueAttr) {
    // For pivot tables, extract the specific value attribute
    if (typeof cell === 'object' && cell !== null) {
      return cell[valueAttr] !== undefined && cell[valueAttr] !== null 
        ? String(cell[valueAttr]) 
        : ''
    }
    return String(cell)
  } else if (typeof cell === 'object' && cell !== null) {
    // For regular pivot tables (no values dimension), show all non-metadata attributes
    const keys = Object.keys(cell).filter(k => 
      !k.startsWith('__') && 
      !rowAttrs.includes(k) && 
      !columnAttrs.includes(k)
    )
    if (keys.length > 0) {
      // Show all values joined, or just the first one
      const values = keys.map(k => `${k}: ${cell[k]}`).join(', ')
      return values.length > 50 ? values.substring(0, 50) + '...' : values
    }
    // If no other attributes, try to find any numeric or string value
    const allKeys = Object.keys(cell).filter(k => !k.startsWith('__'))
    if (allKeys.length > 0) {
      return String(cell[allKeys[0]] || '')
    }
    return ''
  }

  return String(cell)
}

/**
 * Convert chartDimensions configuration to pivot config
 * @param chartDimensions Chart dimensions configuration object
 * @param widgetType Widget type ('table' or 'pivot-table')
 * @returns Pivot configuration
 */
export function getPivotConfig(
  chartDimensions: Record<string, string | string[]> | undefined,
  widgetType: string
): PivotConfig {
  let columnAttrs: string[] = []
  let rowAttrs: string[] = []
  let valueAttrs: string[] = []

  if (chartDimensions && typeof chartDimensions === 'object') {
    if (widgetType === 'table') {
      columnAttrs = Array.isArray(chartDimensions.columns) 
        ? chartDimensions.columns.filter(Boolean)
        : chartDimensions.columns 
          ? [chartDimensions.columns].filter(Boolean)
          : []
      rowAttrs = Array.isArray(chartDimensions.rows) 
        ? chartDimensions.rows.filter(Boolean)
        : chartDimensions.rows 
          ? [chartDimensions.rows].filter(Boolean)
          : []
    } else if (widgetType === 'pivot-table') {
      rowAttrs = Array.isArray(chartDimensions.rows) 
        ? chartDimensions.rows.filter(Boolean)
        : chartDimensions.rows 
          ? [chartDimensions.rows].filter(Boolean)
          : []
      columnAttrs = Array.isArray(chartDimensions.columns) 
        ? chartDimensions.columns.filter(Boolean)
        : chartDimensions.columns 
          ? [chartDimensions.columns].filter(Boolean)
          : []
      valueAttrs = Array.isArray(chartDimensions.values) 
        ? chartDimensions.values.filter(Boolean)
        : chartDimensions.values 
          ? [chartDimensions.values].filter(Boolean)
          : []
    }
  }

  return { columnAttrs, rowAttrs, valueAttrs }
}

