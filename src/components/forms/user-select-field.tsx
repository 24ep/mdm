"use client"

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { User, Loader2 } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  space_role: string
}

interface UserSelectFieldProps {
  spaceId: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function UserSelectField({
  spaceId,
  value,
  onChange,
  disabled = false,
  placeholder = "Select a user"
}: UserSelectFieldProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/spaces/${spaceId}/users`)
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        const data = await response.json()
        setUsers(data.users || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    if (spaceId) {
      fetchUsers()
    }
  }, [spaceId])

  const selectedUser = users.find(user => user.id === value)

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading users...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Error: {error}
      </div>
    )
  }

  return (
    <Select
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger className={error ? 'border-red-500' : ''} disabled={disabled || loading}>
        <SelectValue placeholder={placeholder}>
          {selectedUser && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                {selectedUser.avatar ? (
                  <img 
                    src={selectedUser.avatar} 
                    alt={selectedUser.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span>{selectedUser.name}</span>
              <Badge variant="outline" className="text-xs">
                {selectedUser.space_role}
              </Badge>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              <Badge variant="outline" className="text-xs ml-auto">
                {user.space_role}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
