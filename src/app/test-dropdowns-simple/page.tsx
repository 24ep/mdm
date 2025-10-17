"use client"

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestDropdownsSimple() {
  const [selectValue, setSelectValue] = useState('')
  const [comboboxValue, setComboboxValue] = useState('')

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  const comboboxOptions = [
    { value: 'item1', label: 'Item 1' },
    { value: 'item2', label: 'Item 2' },
    { value: 'item3', label: 'Item 3' },
    { value: 'item4', label: 'Item 4' },
  ]

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">Simple Dropdown Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Component Test</CardTitle>
          <CardDescription>Testing basic Select component functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Option:</label>
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent>
                {selectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-2">Selected: {selectValue || 'None'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Combobox Component Test</CardTitle>
          <CardDescription>Testing searchable Combobox component functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search and Select:</label>
            <Combobox
              options={comboboxOptions}
              value={comboboxValue}
              onValueChange={setComboboxValue}
              placeholder="Search and select an item"
            />
            <p className="text-sm text-gray-600 mt-2">Selected: {comboboxValue || 'None'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
          <CardDescription>Current state values</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm">
            {JSON.stringify({ selectValue, comboboxValue }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
