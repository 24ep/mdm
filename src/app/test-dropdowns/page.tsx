'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox, MultiCombobox } from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'

const sampleOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4' },
  { value: 'option5', label: 'Option 5' },
]

const companyOptions = [
  { value: '', label: 'All Companies' },
  { value: 'apple', label: 'Apple Inc.' },
  { value: 'google', label: 'Google LLC' },
  { value: 'microsoft', label: 'Microsoft Corporation' },
  { value: 'amazon', label: 'Amazon.com Inc.' },
  { value: 'meta', label: 'Meta Platforms Inc.' },
  { value: 'tesla', label: 'Tesla Inc.' },
  { value: 'netflix', label: 'Netflix Inc.' },
  { value: 'uber', label: 'Uber Technologies Inc.' },
  { value: 'airbnb', label: 'Airbnb Inc.' },
  { value: 'spotify', label: 'Spotify Technology S.A.' },
]

export default function TestDropdownsPage() {
  const [selectValue, setSelectValue] = useState('')
  const [comboboxValue, setComboboxValue] = useState('')
  const [multiComboboxValues, setMultiComboboxValues] = useState<string[]>([])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modern Dropdown Components</h1>
          <p className="text-muted-foreground">
            Test and demonstrate the new modern dropdown components
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Modern Select Component */}
          <Card>
            <CardHeader>
              <CardTitle>Modern Select</CardTitle>
              <CardDescription>
                A modern select component built with Radix UI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modern-select">Choose an option</Label>
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Options</SelectItem>
                    {sampleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Selected: {selectValue || 'None'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Modern Combobox Component */}
          <Card>
            <CardHeader>
              <CardTitle>Modern Combobox</CardTitle>
              <CardDescription>
                A searchable dropdown component with filtering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modern-combobox">Search and select a company</Label>
                <Combobox
                  options={companyOptions}
                  value={comboboxValue}
                  onValueChange={setComboboxValue}
                  placeholder="Search companies..."
                  searchPlaceholder="Type to search..."
                  emptyText="No companies found"
                />
                <p className="text-sm text-muted-foreground">
                  Selected: {comboboxValue || 'None'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Select Combobox Component */}
          <Card>
            <CardHeader>
              <CardTitle>Multi-Select Combobox</CardTitle>
              <CardDescription>
                A searchable multi-select dropdown component
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="multi-combobox">Select multiple companies</Label>
                <MultiCombobox
                  options={companyOptions.slice(1)} // Remove the "All Companies" option
                  values={multiComboboxValues}
                  onValuesChange={setMultiComboboxValues}
                  placeholder="Select companies..."
                  searchPlaceholder="Type to search..."
                  emptyText="No companies found"
                  maxDisplayed={2}
                />
                <p className="text-sm text-muted-foreground">
                  Selected: {multiComboboxValues.length > 0 ? multiComboboxValues.join(', ') : 'None'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Card */}
          <Card>
            <CardHeader>
              <CardTitle>Old vs New</CardTitle>
              <CardDescription>
                Comparison between old HTML select and new components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-select">Old HTML Select</Label>
                <select
                  id="old-select"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  defaultValue=""
                >
                  <option value="">Choose an option</option>
                  {sampleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-select">New Modern Select</Label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Choose an option</SelectItem>
                    {sampleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle>Modern Dropdown Features</CardTitle>
            <CardDescription>
              Key improvements over traditional HTML select elements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Modern Select Component</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Built with Radix UI for accessibility</li>
                  <li>• Customizable styling with Tailwind CSS</li>
                  <li>• Keyboard navigation support</li>
                  <li>• Screen reader friendly</li>
                  <li>• Smooth animations and transitions</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Combobox Component</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Search and filter functionality</li>
                  <li>• Multi-select support</li>
                  <li>• Custom placeholder and empty states</li>
                  <li>• Disabled state support</li>
                  <li>• Flexible option configuration</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
