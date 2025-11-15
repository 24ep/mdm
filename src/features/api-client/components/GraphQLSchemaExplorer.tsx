'use client'

import { useState, useEffect } from 'react'
import { GraphQLSchema, GraphQLType, GraphQLField, fetchGraphQLSchema, formatTypeRef } from '../lib/graphql-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, ChevronDown, Search, RefreshCw } from 'lucide-react'
import { CodeEditor } from '@/components/ui/code-editor'

interface GraphQLSchemaExplorerProps {
  url: string
  headers: Record<string, string>
  onSelectField?: (field: GraphQLField, type: GraphQLType) => void
}

export function GraphQLSchemaExplorer({
  url,
  headers,
  onSelectField,
}: GraphQLSchemaExplorerProps) {
  const [schema, setSchema] = useState<GraphQLSchema | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<GraphQLType | null>(null)

  const loadSchema = async () => {
    if (!url) return

    setLoading(true)
    setError(null)

    try {
      const fetchedSchema = await fetchGraphQLSchema(url, headers)
      setSchema(fetchedSchema)
      
      // Auto-expand query and mutation types
      if (fetchedSchema.queryType) {
        setExpandedTypes(new Set([fetchedSchema.queryType!.name]))
      }
      if (fetchedSchema.mutationType) {
        setExpandedTypes((prev) => new Set([...prev, fetchedSchema.mutationType!.name]))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (url) {
      loadSchema()
    }
  }, [url])

  const toggleType = (typeName: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(typeName)) {
      newExpanded.delete(typeName)
    } else {
      newExpanded.add(typeName)
    }
    setExpandedTypes(newExpanded)
  }

  const filteredTypes = schema?.types.filter((type) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      type.name?.toLowerCase().includes(query) ||
      type.fields?.some((f) => f.name.toLowerCase().includes(query)) ||
      false
    )
  }) || []

  const handleFieldClick = (field: GraphQLField, type: GraphQLType) => {
    onSelectField?.(field, type)
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading schema...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-500 mb-2">{error}</div>
        <Button variant="outline" size="sm" onClick={loadSchema}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Enter a GraphQL endpoint URL to load schema
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search types and fields..."
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={loadSchema} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Schema
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-2 space-y-1">
          {filteredTypes
            .filter((type) => 
              !type.name?.startsWith('__') && 
              (type.fields || type.inputFields || type.enumValues)
            )
            .map((type) => {
              const isExpanded = expandedTypes.has(type.name || '')
              const hasFields = type.fields && type.fields.length > 0
              const hasInputFields = type.inputFields && type.inputFields.length > 0
              const hasEnumValues = type.enumValues && type.enumValues.length > 0

              return (
                <div key={type.name} className="border border-border rounded">
                  <div
                    className="flex items-center gap-1 px-2 py-1 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      toggleType(type.name || '')
                      setSelectedType(type)
                    }}
                  >
                    {(hasFields || hasInputFields || hasEnumValues) && (
                      <button className="p-0.5">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    <span className="text-sm font-medium">{type.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{type.kind}</span>
                  </div>

                  {isExpanded && (
                    <div className="px-2 pb-2 space-y-1">
                      {type.description && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {type.description}
                        </div>
                      )}

                      {hasFields && (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground">Fields:</div>
                          {type.fields!.map((field) => (
                            <div
                              key={field.name}
                              className="pl-4 py-1 hover:bg-accent cursor-pointer rounded text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleFieldClick(field, type)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{field.name}</span>
                                <span className="text-muted-foreground">
                                  {formatTypeRef(field.type)}
                                </span>
                              </div>
                              {field.description && (
                                <div className="text-muted-foreground mt-0.5">
                                  {field.description}
                                </div>
                              )}
                              {field.args && field.args.length > 0 && (
                                <div className="text-muted-foreground mt-1">
                                  Args: {field.args.map((a) => a.name).join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {hasInputFields && (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground">Input Fields:</div>
                          {type.inputFields!.map((field) => (
                            <div key={field.name} className="pl-4 py-1 text-xs">
                              <span className="font-medium">{field.name}</span>
                              <span className="text-muted-foreground ml-2">
                                {formatTypeRef(field.type)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {hasEnumValues && (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground">Values:</div>
                          {type.enumValues!.map((value) => (
                            <div key={value.name} className="pl-4 py-1 text-xs">
                              <span className="font-medium">{value.name}</span>
                              {value.description && (
                                <div className="text-muted-foreground">{value.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>

      {selectedType && (
        <div className="border-t border-border p-2">
          <div className="text-xs font-semibold mb-1">Type Details:</div>
          <CodeEditor
            value={JSON.stringify(selectedType, null, 2)}
            onChange={() => {}}
            language="json"
            height="150px"
            readOnly
          />
        </div>
      )}
    </div>
  )
}

