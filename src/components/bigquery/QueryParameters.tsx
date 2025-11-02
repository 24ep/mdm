'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, Plus, Variable } from 'lucide-react'
import toast from 'react-hot-toast'

interface QueryParameter {
  name: string
  value: string
  type: 'string' | 'number' | 'date' | 'boolean'
}

interface QueryParametersProps {
  query: string
  onQueryChange: (query: string) => void
  isOpen: boolean
  onClose: () => void
}

export function QueryParameters({ query, onQueryChange, isOpen, onClose }: QueryParametersProps) {
  const [parameters, setParameters] = useState<QueryParameter[]>([])
  const [resolvedQuery, setResolvedQuery] = useState(query)

  // Extract parameters from query (@variable_name)
  useEffect(() => {
    if (!query) {
      setParameters([])
      return
    }

    const paramRegex = /@(\w+)/g
    const matches = Array.from(query.matchAll(paramRegex))
    const uniqueParams = Array.from(new Set(matches.map(m => m[1])))
    
    const newParameters = uniqueParams.map(name => {
      const existing = parameters.find(p => p.name === name)
      return existing || {
        name,
        value: '',
        type: 'string' as const
      }
    })

    setParameters(newParameters)
  }, [query])

  // Resolve query with parameter values
  const resolveQuery = (params: QueryParameter[]): string => {
    let resolved = query

    params.forEach(param => {
      let value = param.value
      
      // Format value based on type
      if (param.type === 'string' && value && !value.startsWith("'") && !value.startsWith('"')) {
        value = `'${value.replace(/'/g, "''")}'` // Escape single quotes
      } else if (param.type === 'number') {
        value = value || '0'
      } else if (param.type === 'date' && value) {
        value = `'${value}'`
      } else if (param.type === 'boolean') {
        value = value.toLowerCase() === 'true' ? 'TRUE' : 'FALSE'
      }

      const regex = new RegExp(`@${param.name}\\b`, 'g')
      resolved = resolved.replace(regex, value || 'NULL')
    })

    return resolved
  }

  const handleParameterChange = (index: number, field: keyof QueryParameter, value: string) => {
    const updated = [...parameters]
    if (field === 'type') {
      updated[index] = { ...updated[index], [field]: value as any, value: '' }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setParameters(updated)
    setResolvedQuery(resolveQuery(updated))
  }

  const handleAddParameter = () => {
    setParameters([...parameters, { name: '', value: '', type: 'string' }])
  }

  const handleRemoveParameter = (index: number) => {
    const updated = parameters.filter((_, i) => i !== index)
    setParameters(updated)
    setResolvedQuery(resolveQuery(updated))
  }

  const handleApply = () => {
    if (parameters.some(p => !p.name || (p.value === '' && p.type !== 'boolean'))) {
      toast.error('Please fill in all parameter names and values')
      return
    }

    onQueryChange(resolvedQuery)
    toast.success('Parameters applied to query')
    onClose()
  }

  const handleInsertQuery = () => {
    onQueryChange(resolvedQuery)
    toast.success('Resolved query inserted')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5" />
            Query Parameters
          </DialogTitle>
          <DialogDescription>
            Define parameters for your query using @variable_name syntax
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {parameters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No parameters found in query.</p>
              <p className="text-sm mt-2">Use @variable_name in your query to create parameters.</p>
            </div>
          ) : (
            <>
              {parameters.map((param, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                      <Label className="text-xs">Parameter</Label>
                      <Input
                        value={param.name}
                        onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                        placeholder="@name"
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Type</Label>
                      <select
                        value={param.type}
                        onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                        className="h-8 w-full text-sm border rounded px-2"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                    <div className="col-span-5">
                      <Label className="text-xs">Value</Label>
                      <Input
                        value={param.value}
                        onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                        placeholder={param.type === 'date' ? 'YYYY-MM-DD' : 'Enter value'}
                        type={param.type === 'date' ? 'date' : param.type === 'number' ? 'number' : 'text'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveParameter(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="border-t pt-4">
            <div className="space-y-2">
              <Label>Resolved Query Preview</Label>
              <div className="bg-gray-50 border rounded p-3 font-mono text-xs max-h-40 overflow-y-auto">
                {resolvedQuery || query}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleInsertQuery} disabled={!resolvedQuery || resolvedQuery === query}>
              Insert Query
            </Button>
            <Button onClick={handleApply} disabled={parameters.length === 0}>
              Apply Parameters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

