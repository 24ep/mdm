"use client"

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestSwitches() {
  const [isRequired, setIsRequired] = useState(false)
  const [isUnique, setIsUnique] = useState(false)
  const [isAutoIncrement, setIsAutoIncrement] = useState(false)
  const [isActive, setIsActive] = useState(true)

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">Switch Components Test</h1>
      <p className="text-gray-600">Testing Switch components for Required, Unique, and other boolean fields</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Attribute Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Attribute Settings</CardTitle>
            <CardDescription>Switch components for attribute configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Required Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="required-switch">Required</Label>
                <p className="text-sm text-gray-600">Make this field mandatory</p>
              </div>
              <Switch
                id="required-switch"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
            </div>

            {/* Unique Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="unique-switch">Unique</Label>
                <p className="text-sm text-gray-600">Ensure values are unique</p>
              </div>
              <Switch
                id="unique-switch"
                checked={isUnique}
                onCheckedChange={setIsUnique}
              />
            </div>

            {/* Auto Increment Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-increment-switch">Auto Increment</Label>
                <p className="text-sm text-gray-600">Automatically generate values</p>
              </div>
              <Switch
                id="auto-increment-switch"
                checked={isAutoIncrement}
                onCheckedChange={setIsAutoIncrement}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Status Settings</CardTitle>
            <CardDescription>Switch components for status and state management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active-switch">Active</Label>
                <p className="text-sm text-gray-600">Enable this item</p>
              </div>
              <Switch
                id="active-switch"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current State Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current State</CardTitle>
          <CardDescription>Real-time values of all switches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-gray-600">Required</div>
              <div className={`text-lg font-semibold ${isRequired ? 'text-green-600' : 'text-gray-400'}`}>
                {isRequired ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-gray-600">Unique</div>
              <div className={`text-lg font-semibold ${isUnique ? 'text-green-600' : 'text-gray-400'}`}>
                {isUnique ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-gray-600">Auto Increment</div>
              <div className={`text-lg font-semibold ${isAutoIncrement ? 'text-green-600' : 'text-gray-400'}`}>
                {isAutoIncrement ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-gray-600">Active</div>
              <div className={`text-lg font-semibold ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                {isActive ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Switch States JSON */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
          <CardDescription>JSON representation of current switch states</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              isRequired,
              isUnique,
              isAutoIncrement,
              isActive
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
