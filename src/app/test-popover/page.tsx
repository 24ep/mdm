"use client"

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export default function TestPopover() {
  const [open, setOpen] = useState(false)

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">Popover Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Popover Test</h2>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {open ? 'Close' : 'Open'} Popover
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80"
            style={{
              zIndex: 9999,
              backgroundColor: 'white',
              border: '2px solid red',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="p-4">
              <h3 className="font-semibold mb-2">Popover Content</h3>
              <p className="text-sm text-gray-600">
                This is a test popover. If you can see this, the popover is working.
              </p>
              <Button 
                className="mt-2" 
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="text-sm text-gray-600">
          Open state: {open ? 'Open' : 'Closed'}
        </div>
      </div>
    </div>
  )
}
