"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserSelectField } from '@/components/forms/user-select-field'
import { UserMultiSelectField } from '@/components/forms/user-multi-select-field'
import { Label } from '@/components/ui/label'

export default function TestUserAttributesPage() {
  const [spaceId, setSpaceId] = useState<string>('')
  const [singleUser, setSingleUser] = useState<string>('')
  const [multiUsers, setMultiUsers] = useState<string[]>([])

  // Get the first available space for testing
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await fetch('/api/spaces')
        if (response.ok) {
          const data = await response.json()
          if (data.spaces && data.spaces.length > 0) {
            setSpaceId(data.spaces[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching spaces:', error)
      }
    }
    fetchSpaces()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">User Attribute Types Test</h1>
        <p className="text-muted-foreground">
          Test the new user attribute types: single user selection and multi-user selection.
        </p>
        
        {spaceId && (
          <Badge variant="outline">
            Testing with Space ID: {spaceId}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Single User Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select a User (Single)</Label>
              <UserSelectField
                spaceId={spaceId}
                value={singleUser}
                onChange={setSingleUser}
                placeholder="Choose a user"
              />
            </div>
            
            {singleUser && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Selected User ID:</p>
                <p className="text-sm text-muted-foreground">{singleUser}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multi User Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Users (Multi)</Label>
              <UserMultiSelectField
                spaceId={spaceId}
                value={multiUsers}
                onChange={setMultiUsers}
                placeholder="Choose multiple users"
              />
            </div>
            
            {multiUsers.length > 0 && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Selected User IDs:</p>
                <p className="text-sm text-muted-foreground">{JSON.stringify(multiUsers)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">New Attribute Types Added:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code>user</code> - Single user selection from space members</li>
              <li><code>user_multi</code> - Multi-user selection from space members</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">API Endpoints:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code>GET /api/spaces/[id]/users</code> - Fetch users from a space</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Components Created:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code>UserSelectField</code> - Single user dropdown with user info</li>
              <li><code>UserMultiSelectField</code> - Multi-user selection with badges</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
