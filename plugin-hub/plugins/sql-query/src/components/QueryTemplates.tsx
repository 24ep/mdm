'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Search, FileText, Database, BarChart3, Settings, Zap, Code } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QueryTemplate {
  id: string
  name: string
  description: string
  sql: string
  category: string
}

interface QueryTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onInsertTemplate: (sql: string) => void
}

const queryTemplates: QueryTemplate[] = [
  {
    id: 'select-all',
    name: 'Select All Records',
    description: 'Select all records from a table',
    sql: `SELECT * FROM \`project.dataset.table\` LIMIT 100;`,
    category: 'Basic'
  },
  {
    id: 'select-filtered',
    name: 'Select with Filter',
    description: 'Select records with WHERE condition',
    sql: `SELECT 
  column1,
  column2,
  column3
FROM \`project.dataset.table\`
WHERE column1 = 'value'
  AND column2 > 100
ORDER BY column3 DESC
LIMIT 50;`,
    category: 'Basic'
  },
  {
    id: 'join-tables',
    name: 'Join Tables',
    description: 'Join two tables with common key',
    sql: `SELECT 
  t1.column1,
  t1.column2,
  t2.column3,
  t2.column4
FROM \`project.dataset.table1\` t1
JOIN \`project.dataset.table2\` t2
  ON t1.id = t2.table1_id
WHERE t1.status = 'active'
ORDER BY t1.created_at DESC;`,
    category: 'Joins'
  },
  {
    id: 'aggregate-data',
    name: 'Aggregate Data',
    description: 'Group and aggregate data with functions',
    sql: `SELECT 
  category,
  COUNT(*) as total_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM \`project.dataset.transactions\`
WHERE date >= '2024-01-01'
GROUP BY category
HAVING COUNT(*) > 10
ORDER BY total_amount DESC;`,
    category: 'Analytics'
  },
  {
    id: 'window-functions',
    name: 'Window Functions',
    description: 'Use window functions for ranking and analytics',
    sql: `SELECT 
  user_id,
  amount,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) as rank,
  SUM(amount) OVER (PARTITION BY user_id) as user_total,
  AVG(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg
FROM \`project.dataset.transactions\`
WHERE date >= '2024-01-01';`,
    category: 'Analytics'
  },
  {
    id: 'create-table',
    name: 'Create Table',
    description: 'Create a new table with schema',
    sql: `CREATE TABLE \`project.dataset.new_table\` (
  id INT64 NOT NULL,
  name STRING(255),
  email STRING(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY id;`,
    category: 'DDL'
  },
  {
    id: 'insert-data',
    name: 'Insert Data',
    description: 'Insert new records into table',
    sql: `INSERT INTO \`project.dataset.table\` (column1, column2, column3)
VALUES 
  ('value1', 'value2', 'value3'),
  ('value4', 'value5', 'value6'),
  ('value7', 'value8', 'value9');`,
    category: 'DML'
  },
  {
    id: 'update-data',
    name: 'Update Data',
    description: 'Update existing records',
    sql: `UPDATE \`project.dataset.table\`
SET 
  column1 = 'new_value',
  updated_at = CURRENT_TIMESTAMP()
WHERE condition_column = 'condition_value'
  AND status = 'active';`,
    category: 'DML'
  },
  {
    id: 'delete-data',
    name: 'Delete Data',
    description: 'Delete records with condition',
    sql: `DELETE FROM \`project.dataset.table\`
WHERE condition_column = 'condition_value'
  AND created_at < '2024-01-01';`,
    category: 'DML'
  },
  {
    id: 'cte-query',
    name: 'Common Table Expression',
    description: 'Use CTE for complex queries',
    sql: `WITH user_stats AS (
  SELECT 
    user_id,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount
  FROM \`project.dataset.transactions\`
  WHERE date >= '2024-01-01'
  GROUP BY user_id
),
top_users AS (
  SELECT *
  FROM user_stats
  WHERE total_amount > 1000
)
SELECT 
  u.user_id,
  u.transaction_count,
  u.total_amount,
  RANK() OVER (ORDER BY u.total_amount DESC) as rank
FROM top_users u
ORDER BY u.total_amount DESC;`,
    category: 'Advanced'
  }
]

export function QueryTemplates({ isOpen, onClose, onInsertTemplate }: QueryTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const insertTemplate = (template: QueryTemplate) => {
    onInsertTemplate(template.sql)
    onClose()
  }

  const getTemplatesByCategory = () => {
    const categories = Array.from(new Set(queryTemplates.map(t => t.category)))
    return categories.map(category => ({
      category,
      templates: queryTemplates.filter(t => t.category === category)
    }))
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Basic':
        return <FileText className="h-4 w-4" />
      case 'Joins':
        return <Database className="h-4 w-4" />
      case 'Analytics':
        return <BarChart3 className="h-4 w-4" />
      case 'DDL':
        return <Settings className="h-4 w-4" />
      case 'DML':
        return <Zap className="h-4 w-4" />
      case 'Advanced':
        return <Code className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFilteredTemplates = () => {
    let filtered = queryTemplates

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.sql.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const categories = getTemplatesByCategory()
  const filteredTemplates = getFilteredTemplates()

  // Set default category when component opens
  useEffect(() => {
    if (isOpen && !selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].category)
    }
  }, [isOpen, selectedCategory, categories])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Query Templates</DialogTitle>
          <DialogDescription>
            Choose from common SQL query patterns to get started quickly
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-4 h-[60vh]">
          {/* Left Sidebar - Categories */}
          <div className="w-64 border-r border-gray-200 flex-shrink-0">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>
            
            <ScrollArea className="h-full">
              <div className="p-2">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                      selectedCategory === '' 
                        ? "bg-blue-100 text-blue-700 font-medium" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    All Templates
                    <span className="ml-auto text-xs text-gray-500">
                      {queryTemplates.length}
                    </span>
                  </button>
                  
                  {categories.map(({ category, templates }) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                        selectedCategory === category 
                          ? "bg-blue-100 text-blue-700 font-medium" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {getCategoryIcon(category)}
                      {category}
                      <span className="ml-auto text-xs text-gray-500">
                        {templates.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {searchQuery.trim() ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Search Results ({filteredTemplates.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => insertTemplate(template)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(template.category)}
                              <h4 className="font-medium text-gray-900">{template.name}</h4>
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                              Use
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                          <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700 max-h-20 overflow-hidden">
                            {template.sql}
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredTemplates.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No templates found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedCategory ? (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          {getCategoryIcon(selectedCategory)}
                          <h3 className="text-lg font-semibold text-gray-900">{selectedCategory}</h3>
                          <span className="text-sm text-gray-500">
                            ({filteredTemplates.length} templates)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredTemplates.map((template) => (
                            <div
                              key={template.id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                              onClick={() => insertTemplate(template)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{template.name}</h4>
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                  Use
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                              <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700 max-h-20 overflow-hidden">
                                {template.sql}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
          <div className="space-y-6">
                        {categories.map(({ category, templates }) => (
              <div key={category}>
                            <div className="flex items-center gap-2 mb-3">
                              {getCategoryIcon(category)}
                              <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                              <span className="text-sm text-gray-500">({templates.length} templates)</span>
                            </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => insertTemplate(template)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                          Use
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700 max-h-20 overflow-hidden">
                        {template.sql}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
                      </div>
                    )}
                  </div>
                )}
          </div>
        </ScrollArea>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
