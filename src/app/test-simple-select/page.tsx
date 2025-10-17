"use client"

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TestSimpleSelect() {
  const [value, setValue] = useState('')

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">Simple Select Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Select Test</h2>
        
        <div className="w-64">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-600">
          Selected value: {value || 'None'}
        </div>
      </div>
    </div>
  )
}
