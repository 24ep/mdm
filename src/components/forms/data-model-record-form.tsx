"use client"

import { useState, useEffect, useMemo } from 'react'
import { useFormState } from '@/hooks/common/useFormState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AttachmentFieldIntegration } from './attachment-field-integration'
import { UserSelectField } from './user-select-field'
import { UserMultiSelectField } from './user-multi-select-field'
import { Badge } from '@/components/ui/badge'
import { Save, X } from 'lucide-react'
import { showError, showSuccess } from '@/lib/toast-utils'

interface DataModelRecordFormProps {
  spaceId: string
  dataModel: {
    id: string
    name: string
    attributes: Array<{
      id: string
      code: string
      label: string
      type: string
      required: boolean
      options?: any
      allowed_file_types?: string[]
      max_file_size?: number
      allow_multiple_files?: boolean
    }>
  }
  record?: any
  onSave: (data: any) => void
  onCancel: () => void
  readOnly?: boolean
}

export function DataModelRecordForm({
  spaceId,
  dataModel,
  record,
  onSave,
  onCancel,
  readOnly = false
}: DataModelRecordFormProps) {
  const [loading, setLoading] = useState(false)

  // Initialize form data
  const initialValues = useMemo(() => {
    if (record) {
      return record
    }
    // Initialize with empty values
    const initialData: Record<string, any> = {}
    dataModel.attributes.forEach(attr => {
      if (attr.type === 'attachment') {
        initialData[attr.code] = []
      } else {
        initialData[attr.code] = ''
      }
    })
    return initialData
  }, [record, dataModel])

  const {
    values: formData,
    errors,
    setValue,
    handleSubmit: handleFormSubmit,
  } = useFormState({
    initialValues,
    validate: (values) => {
      const validationErrors: Record<string, string | null> = {}
      dataModel.attributes.forEach(attr => {
        if (attr.required) {
          const value = values[attr.code]
          if (!value || (Array.isArray(value) && value.length === 0)) {
            validationErrors[attr.code] = `${attr.label} is required`
          }
        }
      })
      return validationErrors
    },
    onSubmit: async (values) => {
      try {
        setLoading(true)
        await onSave(values)
        showSuccess('Record saved successfully')
      } catch (error) {
        showError('Failed to save record')
        console.error('Error saving record:', error)
        throw error // Re-throw to let useFormState handle it
      } finally {
        setLoading(false)
      }
    },
  })

  const handleInputChange = (attributeCode: string, value: any) => {
    setValue(attributeCode, value)
  }

  const handleSave = async () => {
    await handleFormSubmit()
  }

  const renderAttributeField = (attribute: any) => {
    const value = formData[attribute.code] || ''
    const error = errors[attribute.code]

    switch (attribute.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <div key={attribute.id} className="space-y-2">
            <Label htmlFor={attribute.code}>
              {attribute.label}
              {attribute.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={attribute.code}
              type={attribute.type}
              value={value}
              onChange={(e) => handleInputChange(attribute.code, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={attribute.id} className="space-y-2">
            <Label htmlFor={attribute.code}>
              {attribute.label}
              {attribute.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={attribute.code}
              value={value}
              onChange={(e) => handleInputChange(attribute.code, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={attribute.id} className="space-y-2">
            <Label htmlFor={attribute.code}>
              {attribute.label}
              {attribute.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={attribute.code}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(attribute.code, parseFloat(e.target.value) || 0)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'boolean':
        return (
          <div key={attribute.id} className="space-y-2">
            <Label htmlFor={attribute.code}>
              {attribute.label}
              {attribute.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value ? 'true' : 'false'}
              onValueChange={(val) => handleInputChange(attribute.code, val === 'true')}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={attribute.id} className="space-y-2">
            <Label htmlFor={attribute.code}>
              {attribute.label}
              {attribute.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleInputChange(attribute.code, val)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {attribute.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'attachment':
        return (
          <div key={attribute.id}>
            <AttachmentFieldIntegration
              spaceId={spaceId}
              dataModelId={dataModel.id}
              attributeId={attribute.id}
              recordId={record?.id}
              attribute={attribute}
              value={value}
              onChange={(val) => handleInputChange(attribute.code, val)}
              readOnly={readOnly}
            />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        )

      case 'user':
        return (
          <div key={attribute.id} className="space-y-2">
            <Label htmlFor={attribute.code}>
              {attribute.label}
              {attribute.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <UserSelectField
              spaceId={spaceId}
              value={value}
              onChange={(val) => handleInputChange(attribute.code, val)}
              placeholder="Select a user"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      case 'user_multi':
        return (
          <div key={attribute.id} className="space-y-2">
            <Label htmlFor={attribute.code}>
              {attribute.label}
              {attribute.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <UserMultiSelectField
              spaceId={spaceId}
              value={value}
              onChange={(val) => handleInputChange(attribute.code, val)}
              placeholder="Select users"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )

      default:
        return (
          <div key={attribute.id} className="space-y-2">
            <Label htmlFor={attribute.code}>
              {attribute.label}
              {attribute.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={attribute.code}
              value={value}
              onChange={(e) => handleInputChange(attribute.code, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {record ? 'Edit' : 'Create'} {dataModel.name} Record
            </span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{dataModel.attributes.length} attributes</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {dataModel.attributes.map(renderAttributeField)}
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Record'}
          </Button>
        </div>
      )}
    </div>
  )
}
