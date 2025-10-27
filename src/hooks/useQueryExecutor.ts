import { useState } from 'react'
import toast from 'react-hot-toast'

interface QueryResult {
  id: string
  query: string
  results: any[]
  columns: string[]
  status: 'success' | 'error' | 'running'
  executionTime?: number
  timestamp: Date
  spaceName?: string
  userId?: string
  userName?: string
  size?: number
}

interface Space {
  id: string
  name: string
  slug: string
}

export function useQueryExecutor() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null)

  const executeQuery = async (
    query: string,
    selectedSpace: string,
    spaces: Space[],
    onResult: (result: QueryResult) => void
  ) => {
    if (!query.trim()) return

    setIsExecuting(true)
    try {
      // Mock query execution
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockResult: QueryResult = {
        id: Date.now().toString(),
        query,
        results: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ],
        columns: ['id', 'name', 'email'],
        status: 'success',
        executionTime: 150,
        timestamp: new Date(),
        spaceName: selectedSpace === 'all' ? 'All Spaces' : spaces.find(s => s.id === selectedSpace)?.name,
        userName: 'Current User',
        size: 2048
      }

      setCurrentResult(mockResult)
      onResult(mockResult)
      
      toast.success('Query executed successfully')
    } catch (error) {
      toast.error('Query execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  return {
    isExecuting,
    currentResult,
    executeQuery,
    setCurrentResult
  }
}
