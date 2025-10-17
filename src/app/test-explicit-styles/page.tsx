"use client"

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TestExplicitStyles() {
  const [value, setValue] = useState('')

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">Explicit Styles Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Select with Explicit Styles</h2>
        
        <div className="w-64">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger 
              className="w-full"
              style={{
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                color: 'black'
              }}
            >
              <SelectValue placeholder="Choose an option" />
            </SelectTrigger>
            <SelectContent 
              style={{
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                color: 'black',
                zIndex: 9999,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <SelectItem 
                value="option1"
                style={{ color: 'black', backgroundColor: 'white' }}
              >
                Option 1
              </SelectItem>
              <SelectItem 
                value="option2"
                style={{ color: 'black', backgroundColor: 'white' }}
              >
                Option 2
              </SelectItem>
              <SelectItem 
                value="option3"
                style={{ color: 'black', backgroundColor: 'white' }}
              >
                Option 3
              </SelectItem>
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
