'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronRight, Database, ArrowRight, Filter, SortAsc } from 'lucide-react'
import toast from 'react-hot-toast'

interface QueryStep {
  id: string
  name: string
  type: 'SCAN' | 'FILTER' | 'JOIN' | 'AGGREGATE' | 'SORT' | 'LIMIT' | 'PROJECT'
  tables?: string[]
  filters?: string[]
  estimatedRows: number
  estimatedCost: number
  children?: QueryStep[]
}

interface QueryPlanProps {
  query: string
  isVisible: boolean
}

export function QueryPlan({ query, isVisible }: QueryPlanProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [plan, setPlan] = useState<QueryStep | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  const generatePlan = async () => {
    if (!query || !query.trim()) {
      toast.error('Query is empty')
      return
    }

    setIsGenerating(true)

    try {
      // Simulate EXPLAIN query
      // In production: EXPLAIN (FORMAT JSON) query
      await new Promise(resolve => setTimeout(resolve, 800))

      const queryPlan = parseQueryToPlan(query)
      setPlan(queryPlan)
      
      // Expand all by default
      const allIds = getAllStepIds(queryPlan)
      setExpandedSteps(new Set(allIds))
    } catch (error) {
      toast.error('Failed to generate query plan')
      console.error('Plan generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getAllStepIds = (step: QueryStep): string[] => {
    const ids = [step.id]
    if (step.children) {
      step.children.forEach(child => {
        ids.push(...getAllStepIds(child))
      })
    }
    return ids
  }

  const parseQueryToPlan = (sql: string): QueryStep => {
    const queryUpper = sql.toUpperCase().trim()
    
    // Extract table names
    const tables: string[] = []
    const fromMatches = sql.match(/FROM\s+`?([\w\.]+)`?/gi) || []
    fromMatches.forEach(m => {
      const table = m.replace(/FROM\s+`?/i, '').replace(/`/g, '').trim()
      if (table && !tables.includes(table)) {
        tables.push(table)
      }
    })

    // Extract WHERE conditions
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP|\s+ORDER|\s+LIMIT|$)/i)
    const filters = whereMatch ? [whereMatch[1].trim()] : []

    // Check for aggregations
    const hasAggregate = /COUNT|SUM|AVG|MIN|MAX|GROUP\s+BY/i.test(sql)

    // Check for sorting
    const hasOrderBy = /ORDER\s+BY/i.test(sql)

    // Check for limit
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i)
    const limit = limitMatch ? parseInt(limitMatch[1]) : undefined

    // Build execution plan tree
    const root: QueryStep = {
      id: 'root',
      name: 'Query Execution',
      type: 'PROJECT',
      estimatedRows: limit || 10000,
      estimatedCost: 1.0
    }

    // Add scan steps
    const scanSteps: QueryStep[] = tables.map((table, idx) => ({
      id: `scan-${idx}`,
      name: `Table Scan: ${table}`,
      type: 'SCAN',
      tables: [table],
      estimatedRows: 100000,
      estimatedCost: 0.5
    }))

    // Add filter step if WHERE exists
    if (filters.length > 0) {
      root.children = [
        {
          id: 'filter',
          name: 'Filter',
          type: 'FILTER',
          filters,
          estimatedRows: 50000,
          estimatedCost: 0.3,
          children: scanSteps
        }
      ]
    } else {
      root.children = scanSteps
    }

    // Add aggregate step if needed
    if (hasAggregate) {
      root.children = [
        {
          id: 'aggregate',
          name: 'Aggregate',
          type: 'AGGREGATE',
          estimatedRows: 1000,
          estimatedCost: 0.2,
          children: root.children || []
        }
      ]
    }

    // Add sort step if needed
    if (hasOrderBy) {
      root.children = [
        {
          id: 'sort',
          name: 'Sort',
          type: 'SORT',
          estimatedRows: root.children?.[0]?.estimatedRows || 10000,
          estimatedCost: 0.1,
          children: root.children || []
        }
      ]
    }

    // Add limit step if needed
    if (limit) {
      root.children = [
        {
          id: 'limit',
          name: `Limit (${limit})`,
          type: 'LIMIT',
          estimatedRows: limit,
          estimatedCost: 0.05,
          children: root.children || []
        }
      ]
    }

    return root
  }

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const renderStep = (step: QueryStep, depth: number = 0): JSX.Element => {
    const isExpanded = expandedSteps.has(step.id)
    const hasChildren = step.children && step.children.length > 0

    const getStepIcon = () => {
      switch (step.type) {
        case 'SCAN':
          return <Database className="h-4 w-4 text-blue-500" />
        case 'FILTER':
          return <Filter className="h-4 w-4 text-orange-500" />
        case 'JOIN':
          return <ArrowRight className="h-4 w-4 text-green-500" />
        case 'AGGREGATE':
          return <Database className="h-4 w-4 text-purple-500" />
        case 'SORT':
          return <SortAsc className="h-4 w-4 text-pink-500" />
        default:
          return <Database className="h-4 w-4 text-gray-500" />
      }
    }

    return (
      <div key={step.id} className="space-y-1">
        <div
          className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${
            depth === 0 ? 'bg-gray-100' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => hasChildren && toggleStep(step.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          ) : (
            <div className="w-4" />
          )}
          {getStepIcon()}
          <span className="text-sm font-medium">{step.name}</span>
          <span className="text-xs text-gray-500 ml-auto">
            ~{step.estimatedRows.toLocaleString()} rows
          </span>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {step.children!.map(child => renderStep(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant="outline"
        onClick={generatePlan}
        disabled={isGenerating || !query.trim()}
        className="h-8 px-3"
      >
        {isGenerating ? 'Generating...' : 'Explain Plan'}
      </Button>

      {plan && (
        <Card className="border-blue-200 bg-blue-50 mt-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Query Execution Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {renderStep(plan)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

