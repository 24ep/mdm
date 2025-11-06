/**
 * Query Execution Plan Analysis
 * Analyzes and visualizes SQL query execution plans
 */

import { query } from '@/lib/db'

export interface QueryPlanNode {
  id: string
  nodeType: string
  operation: string
  relationName?: string
  alias?: string
  startupCost?: number
  totalCost?: number
  rows?: number
  width?: number
  filter?: string
  joinType?: string
  joinCondition?: string
  indexName?: string
  indexCondition?: string
  sortKey?: string[]
  groupKey?: string[]
  children?: QueryPlanNode[]
  metadata?: Record<string, any>
}

export interface QueryPlan {
  plan: QueryPlanNode
  planningTime?: number
  executionTime?: number
  totalTime?: number
  settings?: Record<string, string>
}

class QueryPlanAnalyzer {
  async getExecutionPlan(sqlQuery: string): Promise<QueryPlan> {
    try {
      // Wrap query in EXPLAIN ANALYZE
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON) ${sqlQuery}`
      
      const result = await query(explainQuery)
      
      // PostgreSQL returns plan as JSON array
      if (result.rows && result.rows.length > 0) {
        // PostgreSQL EXPLAIN returns JSON in different formats
        // Try to find the plan data in various possible locations
        let planJson: any = null
        const firstRow = result.rows[0]
        
        // Check if it's already an object with 'QUERY PLAN' key
        if (firstRow && typeof firstRow === 'object') {
          const keys = Object.keys(firstRow)
          const queryPlanKey = keys.find(k => k.toLowerCase().includes('query') || k.toLowerCase().includes('plan'))
          
          if (queryPlanKey) {
            const planData = firstRow[queryPlanKey]
            if (typeof planData === 'string') {
              planJson = JSON.parse(planData)
            } else if (Array.isArray(planData)) {
              planJson = planData
            } else {
              planJson = planData
            }
          } else if (Array.isArray(firstRow)) {
            planJson = firstRow
          } else {
            // Try to parse the entire row as JSON
            planJson = firstRow
          }
        } else if (typeof firstRow === 'string') {
          planJson = JSON.parse(firstRow)
        }
        
        // Handle array format [{"Plan": {...}, "Planning Time": ..., "Execution Time": ...}]
        if (Array.isArray(planJson) && planJson.length > 0) {
          const planData = planJson[0]
          const planningTime = planData['Planning Time']
          const executionTime = planData['Execution Time']
          const plan = this.parsePlanNode(planData.Plan || planData)
          
          return {
            plan,
            planningTime,
            executionTime,
            totalTime: planningTime && executionTime ? planningTime + executionTime : undefined
          }
        }
        
        // Handle direct object format
        if (planJson && planJson.Plan) {
          return {
            plan: this.parsePlanNode(planJson.Plan),
            planningTime: planJson['Planning Time'],
            executionTime: planJson['Execution Time']
          }
        }
      }
      
      throw new Error('No plan data returned')
    } catch (error: any) {
      // If EXPLAIN ANALYZE fails, try EXPLAIN only
      try {
        const explainQuery = `EXPLAIN (FORMAT JSON) ${sqlQuery}`
        const result = await query(explainQuery)
        
        if (result.rows && result.rows.length > 0) {
          const firstRow = result.rows[0]
          let planJson: any = null
          
          if (typeof firstRow === 'object') {
            const keys = Object.keys(firstRow)
            const queryPlanKey = keys.find(k => k.toLowerCase().includes('query') || k.toLowerCase().includes('plan'))
            if (queryPlanKey) {
              const planData = firstRow[queryPlanKey]
              planJson = typeof planData === 'string' ? JSON.parse(planData) : planData
            } else if (Array.isArray(firstRow)) {
              planJson = firstRow
            }
          } else if (typeof firstRow === 'string') {
            planJson = JSON.parse(firstRow)
          }
          
          if (Array.isArray(planJson) && planJson.length > 0) {
            const plan = this.parsePlanNode(planJson[0]?.Plan || planJson[0])
            return { plan }
          } else if (planJson?.Plan) {
            return { plan: this.parsePlanNode(planJson.Plan) }
          }
        }
      } catch (explainError) {
        console.error('Failed to get execution plan:', explainError)
      }
      
      throw error
    }
  }

  private parsePlanNode(node: any, id: string = '0'): QueryPlanNode {
    const planNode: QueryPlanNode = {
      id,
      nodeType: node['Node Type'] || node.nodeType || 'Unknown',
      operation: node['Node Type'] || node.nodeType || 'Unknown',
      relationName: node['Relation Name'] || node.relationName,
      alias: node['Alias'] || node.alias,
      startupCost: node['Startup Cost'] || node.startupCost,
      totalCost: node['Total Cost'] || node.totalCost,
      rows: node['Plan Rows'] || node.rows,
      width: node['Plan Width'] || node.width,
      filter: node['Filter'] || node.filter,
      joinType: node['Join Type'] || node.joinType,
      joinCondition: node['Hash Cond'] || node['Merge Cond'] || node.joinCondition,
      indexName: node['Index Name'] || node.indexName,
      indexCondition: node['Index Cond'] || node.indexCondition,
      sortKey: node['Sort Key'] || node.sortKey,
      groupKey: node['Group Key'] || node.groupKey,
      metadata: {
        ...node
      }
    }

    // Recursively parse children
    if (node.Plans && Array.isArray(node.Plans)) {
      planNode.children = node.Plans.map((child: any, index: number) => 
        this.parsePlanNode(child, `${id}.${index}`)
      )
    }

    return planNode
  }

  analyzePlan(plan: QueryPlanNode): {
    warnings: Array<{ severity: 'error' | 'warning' | 'info'; message: string; nodeId: string }>
    recommendations: string[]
    performanceScore: number
  } {
    const warnings: Array<{ severity: 'error' | 'warning' | 'info'; message: string; nodeId: string }> = []
    const recommendations: string[] = []
    let totalCost = 0
    let hasSeqScan = false
    let hasIndexScan = false
    let hasNestedLoop = false
    let hasHashJoin = false
    let largeRowCount = false

    const traverse = (node: QueryPlanNode) => {
      totalCost = Math.max(totalCost, node.totalCost || 0)

      // Check for sequential scans
      if (node.nodeType === 'Seq Scan') {
        hasSeqScan = true
        if ((node.rows || 0) > 10000) {
          warnings.push({
            severity: 'warning',
            message: `Sequential scan on ${node.relationName || 'table'} may be slow. Consider adding an index.`,
            nodeId: node.id
          })
          recommendations.push(`Add index on ${node.relationName || 'table'} for better performance`)
        }
      }

      // Check for index scans
      if (node.nodeType === 'Index Scan' || node.nodeType === 'Index Only Scan') {
        hasIndexScan = true
      }

      // Check for nested loops (can be slow for large datasets)
      if (node.nodeType === 'Nested Loop') {
        hasNestedLoop = true
        if ((node.rows || 0) > 100000) {
          warnings.push({
            severity: 'warning',
            message: 'Nested loop join may be slow for large datasets. Consider using hash join.',
            nodeId: node.id
          })
        }
      }

      // Check for hash joins
      if (node.nodeType === 'Hash Join') {
        hasHashJoin = true
      }

      // Check for large row counts
      if ((node.rows || 0) > 1000000) {
        largeRowCount = true
        warnings.push({
          severity: 'info',
          message: `Large result set (${node.rows?.toLocaleString()} rows). Consider adding LIMIT or filtering.`,
          nodeId: node.id
        })
      }

      // Check for missing indexes on filters
      if (node.filter && !node.indexName && node.nodeType === 'Seq Scan') {
        warnings.push({
          severity: 'warning',
          message: `Filter applied without index: ${node.filter}`,
          nodeId: node.id
        })
      }

      // Recursively check children
      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    traverse(plan)

    // Calculate performance score (0-100)
    let score = 100
    
    if (hasSeqScan && !hasIndexScan) score -= 20
    if (hasNestedLoop && !hasHashJoin && largeRowCount) score -= 15
    if (totalCost > 1000) score -= 10
    if (totalCost > 10000) score -= 20
    if (largeRowCount) score -= 10

    score = Math.max(0, score)

    // Generate recommendations
    if (hasSeqScan && !hasIndexScan) {
      recommendations.push('Consider adding indexes on frequently queried columns')
    }

    if (hasNestedLoop && largeRowCount) {
      recommendations.push('Consider using hash joins for large datasets')
    }

    if (totalCost > 10000) {
      recommendations.push('Query has high cost. Consider optimizing or breaking into smaller queries')
    }

    return {
      warnings,
      recommendations,
      performanceScore: score
    }
  }

  getPlanSummary(plan: QueryPlanNode): {
    totalCost: number
    totalRows: number
    operations: string[]
    tables: string[]
  } {
    const operations = new Set<string>()
    const tables = new Set<string>()
    let maxCost = 0
    let maxRows = 0

    const traverse = (node: QueryPlanNode) => {
      operations.add(node.nodeType)
      if (node.relationName) {
        tables.add(node.relationName)
      }
      maxCost = Math.max(maxCost, node.totalCost || 0)
      maxRows = Math.max(maxRows, node.rows || 0)

      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    traverse(plan)

    return {
      totalCost: maxCost,
      totalRows: maxRows,
      operations: Array.from(operations),
      tables: Array.from(tables)
    }
  }
}

// Export singleton instance
export const queryPlanAnalyzer = new QueryPlanAnalyzer()

