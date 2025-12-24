'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  TrendingUp, 
  Clock,
  Database,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { QueryPlan, QueryPlanNode } from '@/lib/query-plan'
import { cn } from '@/lib/utils'

interface QueryPlanViewerProps {
  query: string
  onClose?: () => void
}

export function QueryPlanViewer({ query, onClose }: QueryPlanViewerProps) {
  const [plan, setPlan] = useState<QueryPlan | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['0']))

  useEffect(() => {
    if (query) {
      loadPlan()
    }
  }, [query])

  const loadPlan = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/sql/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, analyze: true })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to get execution plan')
      }

      const data = await response.json()
      setPlan(data.plan)
      setAnalysis(data.analysis)
      setSummary(data.summary)
    } catch (err: any) {
      setError(err.message || 'Failed to load execution plan')
      console.error('Error loading plan:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderPlanNode = (node: QueryPlanNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0

    const getNodeIcon = () => {
      switch (node.nodeType) {
        case 'Seq Scan':
          return <Database className="h-4 w-4 text-orange-500" />
        case 'Index Scan':
        case 'Index Only Scan':
          return <Zap className="h-4 w-4 text-green-500" />
        case 'Hash Join':
        case 'Nested Loop':
        case 'Merge Join':
          return <TrendingUp className="h-4 w-4 text-blue-500" />
        default:
          return <Database className="h-4 w-4 text-gray-500" />
      }
    }

    const getCostColor = (cost?: number) => {
      if (!cost) return 'text-gray-500'
      if (cost < 100) return 'text-green-600'
      if (cost < 1000) return 'text-yellow-600'
      return 'text-red-600'
    }

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer",
            level > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <span className="text-gray-400">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && <span className="w-4" />}
          
          {getNodeIcon()}
          
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{node.nodeType}</span>
            {node.relationName && (
              <Badge variant="outline" className="text-xs">
                {node.relationName}
                {node.alias && node.alias !== node.relationName && ` AS ${node.alias}`}
              </Badge>
            )}
            {node.joinType && (
              <Badge variant="secondary" className="text-xs">
                {node.joinType}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            {node.totalCost !== undefined && (
              <span className={getCostColor(node.totalCost)}>
                Cost: {node.totalCost.toFixed(2)}
              </span>
            )}
            {node.rows !== undefined && (
              <span>
                Rows: {node.rows.toLocaleString()}
              </span>
            )}
            {node.width !== undefined && (
              <span>
                Width: {node.width}
              </span>
            )}
          </div>
        </div>

        {/* Node details */}
        {isExpanded && (
          <div className="ml-8 mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
            {node.filter && (
              <div className="mb-1">
                <span className="font-medium">Filter: </span>
                <code className="text-red-600 dark:text-red-400">{node.filter}</code>
              </div>
            )}
            {node.joinCondition && (
              <div className="mb-1">
                <span className="font-medium">Join Condition: </span>
                <code className="text-blue-600 dark:text-blue-400">{node.joinCondition}</code>
              </div>
            )}
            {node.indexName && (
              <div className="mb-1">
                <span className="font-medium">Index: </span>
                <code className="text-green-600 dark:text-green-400">{node.indexName}</code>
              </div>
            )}
            {node.indexCondition && (
              <div className="mb-1">
                <span className="font-medium">Index Condition: </span>
                <code className="text-purple-600 dark:text-purple-400">{node.indexCondition}</code>
              </div>
            )}
            {node.sortKey && node.sortKey.length > 0 && (
              <div className="mb-1">
                <span className="font-medium">Sort Key: </span>
                <code>{node.sortKey.join(', ')}</code>
              </div>
            )}
            {node.groupKey && node.groupKey.length > 0 && (
              <div className="mb-1">
                <span className="font-medium">Group Key: </span>
                <code>{node.groupKey.join(', ')}</code>
              </div>
            )}
          </div>
        )}

        {/* Render children */}
        {isExpanded && hasChildren && node.children && (
          <div className="ml-4">
            {node.children.map((child, index) => 
              renderPlanNode(child, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Query Execution Plan</CardTitle>
          <CardDescription>Analyzing query performance...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Query Execution Plan</CardTitle>
          <CardDescription>Failed to analyze query</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={loadPlan} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Query Execution Plan</CardTitle>
          <CardDescription>Click "Analyze Plan" to view execution plan</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadPlan} variant="outline">
            Analyze Plan
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Query Execution Plan</CardTitle>
            <CardDescription>Performance analysis and optimization recommendations</CardDescription>
          </div>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm">
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <div className="text-xs text-gray-500">Total Cost</div>
              <div className="text-lg font-semibold">{summary.totalCost?.toFixed(2) || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Max Rows</div>
              <div className="text-lg font-semibold">{summary.totalRows?.toLocaleString() || 'N/A'}</div>
            </div>
            {plan.executionTime && (
              <div>
                <div className="text-xs text-gray-500">Execution Time</div>
                <div className="text-lg font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {plan.executionTime.toFixed(2)}ms
                </div>
              </div>
            )}
            {analysis && (
              <div>
                <div className="text-xs text-gray-500">Performance Score</div>
                <div className="text-lg font-semibold flex items-center gap-1">
                  {analysis.performanceScore >= 80 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : analysis.performanceScore >= 60 ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {analysis.performanceScore}/100
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warnings and Recommendations */}
        {analysis && (
          <div className="space-y-2">
            {analysis.warnings.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Warnings & Info</div>
                {analysis.warnings.map((warning: any, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded text-xs",
                      warning.severity === 'error' && "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200",
                      warning.severity === 'warning' && "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200",
                      warning.severity === 'info' && "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
                    )}
                  >
                    {warning.severity === 'error' && <AlertCircle className="h-4 w-4 mt-0.5" />}
                    {warning.severity === 'warning' && <AlertTriangle className="h-4 w-4 mt-0.5" />}
                    {warning.severity === 'info' && <Info className="h-4 w-4 mt-0.5" />}
                    <span>{warning.message}</span>
                  </div>
                ))}
              </div>
            )}

            {analysis.recommendations.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Recommendations</div>
                {analysis.recommendations.map((rec: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-800 dark:text-green-200"
                  >
                    <CheckCircle className="h-4 w-4 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Plan Tree */}
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 max-h-96 overflow-auto">
          <div className="text-sm font-medium mb-2">Execution Plan Tree</div>
          {plan.plan && renderPlanNode(plan.plan)}
        </div>

        {/* Operations Summary */}
        {summary && summary.operations.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Operations Used</div>
            <div className="flex flex-wrap gap-2">
              {summary.operations.map((op: string) => (
                <Badge key={op} variant="outline">
                  {op}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tables Accessed */}
        {summary && summary.tables.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Tables Accessed</div>
            <div className="flex flex-wrap gap-2">
              {summary.tables.map((table: string) => (
                <Badge key={table} variant="secondary">
                  <Database className="h-3 w-3 mr-1" />
                  {table}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

