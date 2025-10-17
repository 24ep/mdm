"use client"

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestWidthConsistency() {
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
      <h1 className="text-2xl font-bold">Width Consistency Test</h1>
      <p className="text-gray-600">Testing Select vs Combobox width consistency</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Select Component */}
        <Card>
          <CardHeader>
            <CardTitle>Select Component (No Search)</CardTitle>
            <CardDescription>Standard dropdown without search functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-80">
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
            </div>
            <p className="text-sm text-gray-600">Selected: {selectValue || 'None'}</p>
            <div className="text-xs text-gray-500">
              Width: 320px (w-80)
            </div>
          </CardContent>
        </Card>

        {/* Combobox Component */}
        <Card>
          <CardHeader>
            <CardTitle>Combobox Component (With Search)</CardTitle>
            <CardDescription>Searchable dropdown with search functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-80">
              <Combobox
                options={comboboxOptions}
                value={comboboxValue}
                onValueChange={setComboboxValue}
                placeholder="Search and select an item"
              />
            </div>
            <p className="text-sm text-gray-600">Selected: {comboboxValue || 'None'}</p>
            <div className="text-xs text-gray-500">
              Width: 320px (w-80)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side by Side Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Side by Side Comparison</CardTitle>
          <CardDescription>Both components with identical width settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Select (No Search)</label>
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
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Combobox (With Search)</label>
              <Combobox
                options={comboboxOptions}
                value={comboboxValue}
                onValueChange={setComboboxValue}
                placeholder="Search and select an item"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Width Test with Different Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Width Test - Different Sizes</CardTitle>
          <CardDescription>Testing width consistency across different container sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Small Width */}
            <div>
              <label className="block text-sm font-medium mb-2">Small (w-48)</label>
              <div className="w-48">
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Medium Width */}
            <div>
              <label className="block text-sm font-medium mb-2">Medium (w-64)</label>
              <div className="w-64">
                <Combobox
                  options={comboboxOptions}
                  value={comboboxValue}
                  onValueChange={setComboboxValue}
                  placeholder="Search"
                />
              </div>
            </div>

            {/* Large Width */}
            <div>
              <label className="block text-sm font-medium mb-2">Large (w-96)</label>
              <div className="w-96">
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
