import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import toast from 'react-hot-toast'
import { DataSource } from '../hooks/useDashboardState'
import { DataModel } from '@/app/data/entities/types'

interface DataSourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dataSource?: DataSource | null
  onSave: (dataSource: Omit<DataSource, 'id' | 'created_at' | 'updated_at'>) => void
}

export function DataSourceDialog({ open, onOpenChange, dataSource, onSave }: DataSourceDialogProps) {
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: dataSource?.name || '',
    type: dataSource?.type || 'DATA_MODEL',
    data_model_id: dataSource?.data_model_id || '',
    query: dataSource?.query || '',
    is_active: dataSource?.is_active ?? true
  })

  // Fetch data models when dialog opens
  useEffect(() => {
    if (open) {
      fetchDataModels()
    }
  }, [open])

  const fetchDataModels = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/data-models?limit=100')
      if (response.ok) {
        const data = await response.json()
        setDataModels(data.dataModels || [])
      } else {
        toast.error('Failed to fetch data models')
      }
    } catch (error) {
      console.error('Error fetching data models:', error)
      toast.error('Failed to fetch data models')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    if (!formData.data_model_id) {
      toast.error('Please select a data model')
      return
    }

    const dataToSave = {
      ...formData,
      type: 'DATA_MODEL' as const
    }

    onSave(dataToSave)
    onOpenChange(false)
  }

  const handleTest = async () => {
    toast('Testing connection...')
    // Implement actual connection testing here
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {dataSource ? 'Edit Data Source' : 'Select Data Model'}
          </DialogTitle>
          <DialogDescription>
            Choose a data model to use as a data source for your dashboard elements
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Data Source Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter a name for this data source"
            />
          </div>

          <div>
            <Label>Data Model</Label>
            <Select
              value={formData.data_model_id}
              onValueChange={(value) => {
                const selectedModel = dataModels.find(model => model.id === value)
                setFormData({ 
                  ...formData, 
                  data_model_id: value,
                  name: selectedModel ? selectedModel.display_name : formData.name
                })
              }}
            >
              <SelectTrigger disabled={loading}>
                <SelectValue placeholder={loading ? "Loading data models..." : "Select a data model"} />
              </SelectTrigger>
              <SelectContent>
                {dataModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.display_name}</span>
                      {model.description && (
                        <span className="text-sm text-muted-foreground">{model.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Custom Query (Optional)</Label>
            <Textarea
              value={formData.query}
              onChange={(e) => setFormData({ ...formData, query: e.target.value })}
              placeholder="Leave empty to use all data from the model, or specify a custom query"
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-1">
              You can specify custom SQL queries or filters here. Leave empty to use all available data.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={!formData.data_model_id}>
            Test Data Model
          </Button>
          <Button onClick={handleSave} disabled={!formData.data_model_id || loading}>
            {dataSource ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
