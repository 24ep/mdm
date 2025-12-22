'use client'

import { useState } from 'react'
import { CodeSnippet } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Code, X, Search, Copy, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CodeSnippetsPanelProps {
  onInsertSnippet: (snippet: CodeSnippet) => void
  onClose: () => void
}

const defaultSnippets: CodeSnippet[] = [
  {
    id: '1',
    name: 'Import Pandas',
    description: 'Import pandas library',
    code: 'import pandas as pd\nimport numpy as np',
    language: 'python',
    category: 'Imports',
    tags: ['pandas', 'numpy', 'import']
  },
  {
    id: '2',
    name: 'Load CSV',
    description: 'Load data from CSV file',
    code: "df = pd.read_csv('data.csv')\nprint(df.head())",
    language: 'python',
    category: 'Data Loading',
    tags: ['csv', 'pandas', 'data']
  },
  {
    id: '3',
    name: 'Basic Plot',
    description: 'Create a simple matplotlib plot',
    code: "import matplotlib.pyplot as plt\n\nplt.figure(figsize=(10, 6))\nplt.plot(x, y)\nplt.xlabel('X Label')\nplt.ylabel('Y Label')\nplt.title('Plot Title')\nplt.show()",
    language: 'python',
    category: 'Visualization',
    tags: ['matplotlib', 'plot', 'visualization']
  },
  {
    id: '4',
    name: 'SQL Select',
    description: 'Basic SELECT query template',
    code: 'SELECT *\nFROM table_name\nWHERE condition\nLIMIT 100;',
    language: 'sql',
    category: 'SQL',
    tags: ['sql', 'select', 'query']
  },
  {
    id: '5',
    name: 'DataFrame Info',
    description: 'Display DataFrame information',
    code: 'print(df.info())\nprint(df.describe())\nprint(df.shape)',
    language: 'python',
    category: 'Data Exploration',
    tags: ['pandas', 'dataframe', 'info']
  },
  {
    id: '6',
    name: 'Filter DataFrame',
    description: 'Filter DataFrame by condition',
    code: "filtered_df = df[df['column'] > value]\nprint(filtered_df.head())",
    language: 'python',
    category: 'Data Manipulation',
    tags: ['pandas', 'filter', 'dataframe']
  },
  {
    id: '7',
    name: 'Group By',
    description: 'Group and aggregate data',
    code: "grouped = df.groupby('column').agg({\n    'value': ['mean', 'sum', 'count']\n})\nprint(grouped)",
    language: 'python',
    category: 'Data Manipulation',
    tags: ['pandas', 'groupby', 'aggregate']
  },
  {
    id: '8',
    name: 'Seaborn Plot',
    description: 'Create a seaborn visualization',
    code: "import seaborn as sns\n\nsns.set_style('whitegrid')\nsns.scatterplot(data=df, x='x', y='y', hue='category')\nplt.show()",
    language: 'python',
    category: 'Visualization',
    tags: ['seaborn', 'plot', 'visualization']
  }
]

export function CodeSnippetsPanel({
  onInsertSnippet,
  onClose
}: CodeSnippetsPanelProps) {
  const [snippets] = useState<CodeSnippet[]>(defaultSnippets)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(snippets.map(s => s.category)))

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = 
      snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !selectedCategory || snippet.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleInsert = (snippet: CodeSnippet) => {
    onInsertSnippet(snippet)
    toast.success(`Snippet "${snippet.name}" inserted`)
  }

  const handleCopy = async (code: string) => {
    const { copyToClipboard } = await import('@/lib/clipboard')
    const success = await copyToClipboard(code)
    if (success) {
      toast.success('Code copied to clipboard')
    } else {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="w-96 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <h3 className="font-semibold">Code Snippets</h3>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Button
            size="sm"
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="h-7 text-xs"
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="h-7 text-xs"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredSnippets.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No snippets found</p>
            </div>
          ) : (
            filteredSnippets.map(snippet => (
              <div
                key={snippet.id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {snippet.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {snippet.description}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {snippet.language}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {snippet.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{snippet.code}</pre>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleInsert(snippet)}
                    className="h-7 text-xs flex-1"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    Insert
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(snippet.code)}
                    className="h-7 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

