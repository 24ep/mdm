'use client'

import { Button } from '@/components/ui/button'
import { Code2, Sparkles } from 'lucide-react'
import { formatSQL, compactSQL } from '@/lib/sql-formatter'
import toast from 'react-hot-toast'

interface QueryFormatterProps {
  query: string
  onQueryChange: (formattedQuery: string) => void
}

export function QueryFormatter({ query, onQueryChange }: QueryFormatterProps) {
  const handleFormat = () => {
    try {
      const formatted = formatSQL(query)
      onQueryChange(formatted)
      toast.success('Query formatted successfully')
    } catch (error) {
      toast.error('Failed to format query')
      console.error('Format error:', error)
    }
  }

  const handleCompact = () => {
    try {
      const compacted = compactSQL(query)
      onQueryChange(compacted)
      toast.success('Query compacted successfully')
    } catch (error) {
      toast.error('Failed to compact query')
      console.error('Compact error:', error)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleFormat}
        className="h-8 px-3"
        title="Format SQL query (Ctrl+Shift+F)"
      >
        <Code2 className="h-4 w-4 mr-1" />
        Format
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCompact}
        className="h-8 px-3"
        title="Compact SQL query to single line"
      >
        <Sparkles className="h-4 w-4 mr-1" />
        Compact
      </Button>
    </div>
  )
}

