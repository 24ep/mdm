'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Code, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface CodeSnippet {
  id: string
  trigger: string
  name: string
  description: string
  code: string
  category: string
}

interface QuerySnippetsProps {
  isOpen: boolean
  onClose: () => void
  onInsertSnippet: (code: string) => void
}

// Predefined code snippets (different from templates - these are smaller code fragments)
const codeSnippets: CodeSnippet[] = [
  // Common functions
  {
    id: 'func-coalesce',
    trigger: 'coalesce',
    name: 'COALESCE',
    description: 'Returns first non-NULL value',
    code: 'COALESCE(\\${1:column}, \\${2:default_value})',
    category: 'Functions'
  },
  {
    id: 'func-case',
    trigger: 'case',
    name: 'CASE Expression',
    description: 'Conditional logic',
    code: `CASE 
  WHEN \${1:condition} THEN \${2:result}
  WHEN \${3:condition} THEN \${4:result}
  ELSE \${5:default}
END`,
    category: 'Functions'
  },
  {
    id: 'func-date-diff',
    trigger: 'datediff',
    name: 'DATE_DIFF',
    description: 'Calculate difference between dates',
    code: 'DATE_DIFF(\\${1:end_date}, \\${2:start_date}, DAY)',
    category: 'Functions'
  },
  {
    id: 'func-substring',
    trigger: 'substr',
    name: 'SUBSTRING',
    description: 'Extract substring from string',
    code: 'SUBSTRING(\\${1:column}, \\${2:start}, \\${3:length})',
    category: 'Functions'
  },
  
  // Window functions
  {
    id: 'window-row-number',
    trigger: 'rownum',
    name: 'ROW_NUMBER()',
    description: 'Assign sequential row numbers',
    code: 'ROW_NUMBER() OVER (PARTITION BY \\${1:column} ORDER BY \\${2:column})',
    category: 'Window Functions'
  },
  {
    id: 'window-rank',
    trigger: 'rank',
    name: 'RANK()',
    description: 'Rank rows with gaps',
    code: 'RANK() OVER (ORDER BY \\${1:column} DESC)',
    category: 'Window Functions'
  },
  {
    id: 'window-lag',
    trigger: 'lag',
    name: 'LAG()',
    description: 'Access previous row value',
    code: 'LAG(\\${1:column}, \\${2:offset}) OVER (PARTITION BY \\${3:partition} ORDER BY \\${4:order})',
    category: 'Window Functions'
  },
  {
    id: 'window-lead',
    trigger: 'lead',
    name: 'LEAD()',
    description: 'Access next row value',
    code: 'LEAD(\\${1:column}, \\${2:offset}) OVER (PARTITION BY \\${3:partition} ORDER BY \\${4:order})',
    category: 'Window Functions'
  },
  
  // Common patterns
  {
    id: 'pattern-exists',
    trigger: 'exists',
    name: 'EXISTS Subquery',
    description: 'Check if subquery returns rows',
    code: `EXISTS (
  SELECT 1 
  FROM \${1:table}
  WHERE \${2:condition}
)`,
    category: 'Patterns'
  },
  {
    id: 'pattern-in',
    trigger: 'in',
    name: 'IN Subquery',
    description: 'Check if value in subquery result',
    code: `\${1:column} IN (
  SELECT \${2:column}
  FROM \${3:table}
  WHERE \${4:condition}
)`,
    category: 'Patterns'
  },
  {
    id: 'pattern-cte',
    trigger: 'cte',
    name: 'Common Table Expression',
    description: 'Define CTE',
    code: `WITH \${1:cte_name} AS (
  SELECT \${2:columns}
  FROM \${3:table}
  WHERE \${4:condition}
)
SELECT * FROM \${1:cte_name}`,
    category: 'Patterns'
  },
  
  // Date operations
  {
    id: 'date-current',
    trigger: 'date',
    name: 'Current Date/Time',
    description: 'Get current timestamp',
    code: 'CURRENT_TIMESTAMP()',
    category: 'Date Operations'
  },
  {
    id: 'date-extract',
    trigger: 'extract',
    name: 'Extract Date Part',
    description: 'Extract year, month, day, etc.',
    code: 'EXTRACT(\\${1|YEAR,MONTH,DAY,HOUR,MINUTE|} FROM \\${2:date_column})',
    category: 'Date Operations'
  },
  {
    id: 'date-format',
    trigger: 'format',
    name: 'Format Date',
    description: 'Format date string',
    code: "FORMAT_DATE('\\${1:%Y-%m-%d}', \\${2:date_column})",
    category: 'Date Operations'
  },
  
  // Aggregations
  {
    id: 'agg-count-distinct',
    trigger: 'countd',
    name: 'COUNT DISTINCT',
    description: 'Count distinct values',
    code: 'COUNT(DISTINCT \\${1:column})',
    category: 'Aggregations'
  },
  {
    id: 'agg-group-concat',
    trigger: 'concat',
    name: 'STRING_AGG',
    description: 'Concatenate grouped values',
    code: "STRING_AGG(\\${1:column}, ', ')",
    category: 'Aggregations'
  },
]

export function QuerySnippets({ isOpen, onClose, onInsertSnippet }: QuerySnippetsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const categories = Array.from(new Set(codeSnippets.map(s => s.category)))

  const filteredSnippets = codeSnippets.filter(snippet => {
    const matchesSearch = !searchQuery || 
      snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.trigger.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || snippet.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleInsert = (snippet: CodeSnippet) => {
    // Replace ${n:placeholder} with just placeholder for insertion
    let code = snippet.code
    code = code.replace(/\$\{(\d+):([^}]+)\}/g, '$2') // Remove placeholder syntax
    
    onInsertSnippet(code)
    toast.success(`Snippet "${snippet.name}" inserted`)
    onClose()
  }

  const handleCopy = (snippet: CodeSnippet) => {
    navigator.clipboard.writeText(snippet.code.replace(/\$\{(\d+):([^}]+)\}/g, '$2'))
    setCopiedId(snippet.id)
    toast.success('Snippet copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Code Snippets
          </DialogTitle>
          <DialogDescription>
            Insert code snippets by trigger or browse by category
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search snippets by name, description, or trigger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredSnippets.map(snippet => (
                <div
                  key={snippet.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{snippet.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {snippet.trigger}
                      </span>
                      <span className="text-xs text-blue-600">{snippet.category}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{snippet.description}</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded font-mono overflow-x-auto">
                      {snippet.code.replace(/\$\{(\d+):([^}]+)\}/g, '<span class="text-blue-600">$2</span>')}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(snippet)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedId === snippet.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleInsert(snippet)}
                      className="h-8"
                    >
                      Insert
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

