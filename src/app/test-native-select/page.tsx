"use client"

import { useState } from 'react'

export default function TestNativeSelect() {
  const [value, setValue] = useState('')

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">Native HTML Select Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Native Select Test</h2>
        
        <div className="w-64">
          <select 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Choose an option</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Selected value: {value || 'None'}
        </div>
      </div>
    </div>
  )
}
