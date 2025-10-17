'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Edit, Save, X, Trash2 } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: any
  attributes: any[]
  onSave: (recordData: any) => void
  onDelete: (recordId: string) => void
  renderEditField: (attribute: any, value: any) => React.ReactNode
}

export function RecordDetailDrawer({ open, onOpenChange, record, attributes, onSave, onDelete, renderEditField }: Props) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [formData, setFormData] = React.useState<Record<string, any>>(record?.values || {})

  React.useEffect(() => {
    setFormData(record?.values || {})
    setIsEditing(false)
  }, [record])

  const handleSave = () => {
    onSave(formData)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (record?.id && confirm('Are you sure you want to delete this record?')) {
      onDelete(record.id)
    }
  }

  const handleFieldChange = (attributeName: string, value: any) => {
    setFormData(prev => ({ ...prev, [attributeName]: value }))
  }

  if (!record) return null

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-screen w-[50vw] flex flex-col">
        <DrawerHeader className="border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl">Record Details</DrawerTitle>
              <DrawerDescription>ID: {record?.id}</DrawerDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {attributes.map((attribute) => (
              <div key={attribute.id} className="space-y-2">
                <Label className="text-sm font-medium">
                  {attribute.display_name}
                  {attribute.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {isEditing ? (
                  renderEditField(attribute, formData[attribute.name])
                ) : (
                  <div className="text-sm">
                    {formData[attribute.name] || <span className="text-muted-foreground">—</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
