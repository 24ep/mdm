'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface EavEntity {
  id: string
  entityTypeId: string
  externalId?: string
  isActive: boolean
  metadata?: any
  createdBy?: string
  createdAt: string
  updatedAt: string
  values?: Record<string, any>
}

interface EavAttribute {
  id: string
  name: string
  displayName: string
  dataType: string
  isRequired: boolean
  isUnique: boolean
  defaultValue?: string
  options?: any
  validationRules?: any
  sortOrder: number
  isVisible: boolean
  isEditable: boolean
  helpText?: string
  placeholder?: string
}

interface EntityType {
  id: string
  name: string
  displayName: string
  description?: string
  isActive: boolean
  sortOrder: number
}

interface AttributeGroup {
  id: string
  name: string
  displayName: string
  description?: string
  sortOrder: number
  isCollapsible: boolean
  isRequired: boolean
}

interface EavEntityManagerProps {
  entityTypeId: string
  spaceId?: string
  onEntitySelect?: (entity: EavEntity) => void
  onEntityCreate?: (entity: EavEntity) => void
  onEntityUpdate?: (entity: EavEntity) => void
  onEntityDelete?: (entityId: string) => void
}

export function EavEntityManager({
  entityTypeId,
  spaceId,
  onEntitySelect,
  onEntityCreate,
  onEntityUpdate,
  onEntityDelete
}: EavEntityManagerProps) {
  const [entities, setEntities] = useState<EavEntity[]>([])
  const [attributes, setAttributes] = useState<EavAttribute[]>([])
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([])
  const [entityType, setEntityType] = useState<EntityType | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<EavEntity | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const itemsPerPage = 20

  useEffect(() => {
    loadData()
  }, [entityTypeId, currentPage, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load entity type
      const entityTypeResponse = await fetch(`/api/eav/entity-types/${entityTypeId}`)
      if (entityTypeResponse.ok) {
        const entityTypeData = await entityTypeResponse.json()
        setEntityType(entityTypeData.entityType)
      }

      // Load attributes
      const attributesResponse = await fetch(`/api/eav/attributes?entity_type_id=${entityTypeId}`)
      if (attributesResponse.ok) {
        const attributesData = await attributesResponse.json()
        setAttributes(attributesData.attributes)
      }

      // Load attribute groups
      const groupsResponse = await fetch(`/api/eav/attribute-groups?entity_type_id=${entityTypeId}`)
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        setAttributeGroups(groupsData.attributeGroups)
      }

      // Load entities
      const entitiesResponse = await fetch(
        `/api/eav/entities?entity_type_id=${entityTypeId}&limit=${itemsPerPage}&offset=${(currentPage - 1) * itemsPerPage}`
      )
      if (entitiesResponse.ok) {
        const entitiesData = await entitiesResponse.json()
        setEntities(entitiesData.entities)
        setTotalCount(entitiesData.total)
        setTotalPages(Math.ceil(entitiesData.total / itemsPerPage))
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEntitySelect = async (entity: EavEntity) => {
    try {
      const response = await fetch(`/api/eav/entities/${entity.id}?include_values=true`)
      if (response.ok) {
        const data = await response.json()
        setSelectedEntity(data.entity)
        onEntitySelect?.(data.entity)
      }
    } catch (error) {
      console.error('Error loading entity details:', error)
    }
  }

  const handleCreateEntity = async () => {
    try {
      const response = await fetch('/api/eav/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityTypeId,
          values: Object.entries(formData).map(([attributeName, value]) => {
            const attribute = attributes.find(attr => attr.name === attributeName)
            return {
              attributeId: attribute?.id,
              [getValueFieldName(attribute?.dataType || 'TEXT')]: value
            }
          })
        })
      })

      if (response.ok) {
        const data = await response.json()
        setEntities(prev => [data.entity, ...prev])
        setIsCreating(false)
        setFormData({})
        onEntityCreate?.(data.entity)
      }
    } catch (error) {
      console.error('Error creating entity:', error)
    }
  }

  const handleUpdateEntity = async () => {
    if (!selectedEntity) return

    try {
      const response = await fetch(`/api/eav/entities/${selectedEntity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: Object.entries(formData).map(([attributeName, value]) => {
            const attribute = attributes.find(attr => attr.name === attributeName)
            return {
              attributeId: attribute?.id,
              [getValueFieldName(attribute?.dataType || 'TEXT')]: value
            }
          })
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedEntity(data.entity)
        setEntities(prev => prev.map(e => e.id === data.entity.id ? data.entity : e))
        onEntityUpdate?.(data.entity)
      }
    } catch (error) {
      console.error('Error updating entity:', error)
    }
  }

  const handleDeleteEntity = async (entityId: string) => {
    try {
      const response = await fetch(`/api/eav/entities/${entityId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setEntities(prev => prev.filter(e => e.id !== entityId))
        if (selectedEntity?.id === entityId) {
          setSelectedEntity(null)
        }
        onEntityDelete?.(entityId)
      }
    } catch (error) {
      console.error('Error deleting entity:', error)
    }
  }

  const getValueFieldName = (dataType: string): string => {
    switch (dataType.toUpperCase()) {
      case 'NUMBER':
      case 'CURRENCY':
      case 'PERCENTAGE':
        return 'numberValue'
      case 'BOOLEAN':
        return 'booleanValue'
      case 'DATE':
        return 'dateValue'
      case 'DATETIME':
      case 'TIMESTAMP':
        return 'datetimeValue'
      case 'JSON':
        return 'jsonValue'
      case 'BLOB':
      case 'FILE':
        return 'blobValue'
      default:
        return 'textValue'
    }
  }

  const renderAttributeInput = (attribute: EavAttribute) => {
    const value = formData[attribute.name] || selectedEntity?.values?.[attribute.name] || attribute.defaultValue || ''

    switch (attribute.dataType.toUpperCase()) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        return (
          <Input
            type={attribute.dataType.toLowerCase() === 'email' ? 'email' : 'text'}
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: e.target.value }))}
            placeholder={attribute.placeholder}
            disabled={!attribute.isEditable}
          />
        )
      
      case 'TEXTAREA':
        return (
          <Textarea
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: e.target.value }))}
            placeholder={attribute.placeholder}
            disabled={!attribute.isEditable}
          />
        )
      
      case 'NUMBER':
      case 'CURRENCY':
      case 'PERCENTAGE':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: parseFloat(e.target.value) || 0 }))}
            placeholder={attribute.placeholder}
            disabled={!attribute.isEditable}
          />
        )
      
      case 'BOOLEAN':
        return (
          <Select
            value={value ? 'true' : 'false'}
            onValueChange={(val) => setFormData(prev => ({ ...prev, [attribute.name]: val === 'true' }))}
            disabled={!attribute.isEditable}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )
      
      case 'DATE':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: e.target.value }))}
            disabled={!attribute.isEditable}
          />
        )
      
      case 'DATETIME':
      case 'TIMESTAMP':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: e.target.value }))}
            disabled={!attribute.isEditable}
          />
        )
      
      case 'SELECT':
        return (
          <Select
            value={value}
            onValueChange={(val) => setFormData(prev => ({ ...prev, [attribute.name]: val }))}
            disabled={!attribute.isEditable}
          >
            <SelectTrigger>
              <SelectValue placeholder={attribute.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.choices
                ?.map((choice: any) => {
                  const choiceValue = String(choice.value ?? '')
                  return { choiceValue, choice }
                })
                .filter(({ choiceValue }) => choiceValue !== '')
                .map(({ choiceValue, choice }) => (
                  <SelectItem key={choiceValue} value={choiceValue}>
                    {choice.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )
      
      case 'MULTI_SELECT':
        return (
          <div className="space-y-2">
            {attribute.options?.choices?.map((choice: any) => (
              <label key={choice.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(choice.value) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    const newValues = e.target.checked
                      ? [...currentValues, choice.value]
                      : currentValues.filter((v: any) => v !== choice.value)
                    setFormData(prev => ({ ...prev, [attribute.name]: newValues }))
                  }}
                  disabled={!attribute.isEditable}
                />
                <span>{choice.label}</span>
              </label>
            ))}
          </div>
        )
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: e.target.value }))}
            placeholder={attribute.placeholder}
            disabled={!attribute.isEditable}
          />
        )
    }
  }

  const renderAttributeGroup = (group: AttributeGroup) => {
    const groupAttributes = attributes.filter(attr => attr.attributeGroupId === group.id)
    const isExpanded = expandedGroups.has(group.id)

    return (
      <Card key={group.id} className="mb-4">
        <CardHeader 
          className="cursor-pointer"
          onClick={() => {
            setExpandedGroups(prev => {
              const newSet = new Set(prev)
              if (newSet.has(group.id)) {
                newSet.delete(group.id)
              } else {
                newSet.add(group.id)
              }
              return newSet
            })
          }}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              {group.isCollapsible && (
                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
              <span>{group.displayName}</span>
              {group.isRequired && <Badge variant="destructive">Required</Badge>}
            </CardTitle>
            {group.description && (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            )}
          </div>
        </CardHeader>
        
        {(!group.isCollapsible || isExpanded) && (
          <CardContent className="space-y-4">
            {groupAttributes.map(attribute => (
              <div key={attribute.id} className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <span>{attribute.displayName}</span>
                  {attribute.isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  {attribute.isUnique && <Badge variant="outline" className="text-xs">Unique</Badge>}
                </Label>
                {renderAttributeInput(attribute)}
                {attribute.helpText && (
                  <p className="text-sm text-muted-foreground">{attribute.helpText}</p>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{entityType?.displayName}</h2>
          {entityType?.description && (
            <p className="text-muted-foreground">{entityType.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Entity
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Entity List</TabsTrigger>
          <TabsTrigger value="form">Entity Form</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search entities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Entity List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {entities.map(entity => (
                  <div
                    key={entity.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleEntitySelect(entity)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{entity.externalId || entity.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(entity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEntitySelect(entity)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEntity(entity.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages} ({totalCount} total)
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="form" className="space-y-4">
          {/* Entity Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Create New Entity' : 'Edit Entity'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {attributeGroups.length > 0 ? (
                attributeGroups
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(group => renderAttributeGroup(group))
              ) : (
                <div className="space-y-4">
                  {attributes
                    .filter(attr => attr.isVisible)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(attribute => (
                      <div key={attribute.id} className="space-y-2">
                        <Label className="flex items-center space-x-2">
                          <span>{attribute.displayName}</span>
                          {attribute.isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                          {attribute.isUnique && <Badge variant="outline" className="text-xs">Unique</Badge>}
                        </Label>
                        {renderAttributeInput(attribute)}
                        {attribute.helpText && (
                          <p className="text-sm text-muted-foreground">{attribute.helpText}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Button onClick={isCreating ? handleCreateEntity : handleUpdateEntity}>
                  {isCreating ? 'Create Entity' : 'Update Entity'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsCreating(false)
                  setSelectedEntity(null)
                  setFormData({})
                }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
