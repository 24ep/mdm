'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ERDDiagram from '@/components/erd/ERDDiagram'
import ERDNavigation, { ERDStats } from '@/components/erd/ERDNavigation'
import { RefreshCw } from 'lucide-react'

interface DataModel {
  id: string
  name: string
  display_name: string
  description?: string
  attributes: Attribute[]
  position?: { x: number; y: number }
}

interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
  is_required: boolean
  is_unique: boolean
  is_primary_key?: boolean
  is_foreign_key?: boolean
  referenced_table?: string
  referenced_column?: string
}

interface Relationship {
  id: string
  fromModel: string
  toModel: string
  fromAttribute: string
  toAttribute: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  label?: string
}

export default function ERDInlineView({ models: inputModels }: { models: DataModel[] }) {
  const [models, setModels] = useState<DataModel[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showGrid, setShowGrid] = useState(true)

  // When parent provides models, keep ERD in sync
  useEffect(() => {
    if (inputModels && inputModels.length) {
      setModels(inputModels)
      // derive relationships from provided models
      const sampleRelationships: Relationship[] = []
      inputModels.forEach(model => {
        model.attributes?.forEach(attr => {
          if ((attr as any).is_foreign_key && (attr as any).referenced_table) {
            const targetModel = inputModels.find(m => m.name.toLowerCase() === (attr as any).referenced_table?.toLowerCase())
            if (targetModel) {
              const targetAttr = targetModel.attributes.find(a => a.name.toLowerCase() === (attr as any).referenced_column?.toLowerCase() || (a as any).is_primary_key)
              if (targetAttr) {
                sampleRelationships.push({
                  id: `${model.id}-${attr.id}-${targetModel.id}-${targetAttr.id}`,
                  fromModel: model.id,
                  toModel: targetModel.id,
                  fromAttribute: attr.id,
                  toAttribute: targetAttr.id,
                  type: 'one-to-many',
                  label: `${model.display_name} → ${targetModel.display_name}`
                })
              }
            }
          }
        })
      })
      setRelationships(sampleRelationships)
      setLoading(false)
    } else {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputModels])

  const loadData = async () => {
    setLoading(true)
    try {
      const modelsRes = await fetch('/api/data-models')
      const modelsData = await modelsRes.json()
      const modelsWithAttributes: DataModel[] = []
      for (const model of modelsData.dataModels || []) {
        try {
          const attrsRes = await fetch(`/api/data-models/${model.id}/attributes`)
          const attrsData = await attrsRes.json()
          modelsWithAttributes.push({
            ...model,
            attributes: attrsData.attributes || []
          })
        } catch {
          modelsWithAttributes.push({ ...model, attributes: [] })
        }
      }
      setModels(modelsWithAttributes)

      const sampleRelationships: Relationship[] = []
      modelsWithAttributes.forEach(model => {
        model.attributes.forEach(attr => {
          if (attr.is_foreign_key && attr.referenced_table) {
            const targetModel = modelsWithAttributes.find(m => m.name.toLowerCase() === attr.referenced_table?.toLowerCase())
            if (targetModel) {
              const targetAttr = targetModel.attributes.find(a => a.name.toLowerCase() === attr.referenced_column?.toLowerCase() || a.is_primary_key)
              if (targetAttr) {
                sampleRelationships.push({
                  id: `${model.id}-${attr.id}-${targetModel.id}-${targetAttr.id}`,
                  fromModel: model.id,
                  toModel: targetModel.id,
                  fromAttribute: attr.id,
                  toAttribute: targetAttr.id,
                  type: 'one-to-many',
                  label: `${model.display_name} → ${targetModel.display_name}`
                })
              }
            }
          }
        })
      })
      setRelationships(sampleRelationships)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateModel = async (updatedModel: DataModel) => {
    setModels(prev => prev.map(m => m.id === updatedModel.id ? updatedModel : m))
  }

  const handleUpdateAttribute = async (modelId: string, attribute: Attribute) => {
    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attribute)
      })
      if (res.ok) {
        setModels(prev => prev.map(model => model.id === modelId ? { ...model, attributes: model.attributes.map(a => a.id === attribute.id ? attribute : a) } : model))
      }
    } catch {}
  }

  const handleDeleteAttribute = async (modelId: string, attributeId: string) => {
    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes/${attributeId}`, { method: 'DELETE' })
      if (res.ok) {
        setModels(prev => prev.map(model => model.id === modelId ? { ...model, attributes: model.attributes.filter(a => a.id !== attributeId) } : model))
      }
    } catch {}
  }

  const handleCreateRelationship = async (relationship: Omit<Relationship, 'id'>) => {
    const newRelationship: Relationship = {
      ...relationship,
      id: `${relationship.fromModel}-${relationship.fromAttribute}-${relationship.toModel}-${relationship.toAttribute}`
    }
    setRelationships(prev => [...prev, newRelationship])
  }

  const handleUpdateRelationship = async (relationship: Relationship) => {
    setRelationships(prev => prev.map(r => r.id === relationship.id ? relationship : r))
  }

  const handleDeleteRelationship = async (relationshipId: string) => {
    setRelationships(prev => prev.filter(r => r.id !== relationshipId))
  }

  const handleSaveLayout = async () => {
    setSaving(true)
    try {
      const layoutData = {
        models: models.map(m => ({ id: m.id, position: m.position })),
        relationships
      }
      console.log('Saving layout:', layoutData)
      await new Promise(resolve => setTimeout(resolve, 800))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ERD diagram...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ERDNavigation
        modelCount={models.length}
        relationshipCount={relationships.length}
        attributeCount={models.reduce((s, m) => s + m.attributes.length, 0)}
        onToggleGrid={() => setShowGrid(v => !v)}
        showGrid={showGrid}
        onAutoLayout={() => {
          const cols = Math.ceil(Math.sqrt(models.length))
          const spacing = 300
          setModels(prev => prev.map((model, index) => ({
            ...model,
            position: { x: 100 + (index % cols) * spacing, y: 100 + Math.floor(index / cols) * 250 }
          })))
        }}
        onSaveLayout={handleSaveLayout}
        saving={saving}
      />

      <ERDStats
        modelCount={models.length}
        relationshipCount={relationships.length}
        attributeCount={models.reduce((s, m) => s + m.attributes.length, 0)}
      />

      <Card className="h-[600px]">
        <CardContent className="p-0 h-full">
          <ERDDiagram
            models={models}
            onUpdateModel={handleUpdateModel}
            onUpdateAttribute={handleUpdateAttribute}
            onDeleteAttribute={handleDeleteAttribute}
            onCreateRelationship={handleCreateRelationship}
            onUpdateRelationship={handleUpdateRelationship}
            onDeleteRelationship={handleDeleteRelationship}
          />
        </CardContent>
      </Card>
    </div>
  )
}


