"use client"

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Loader2, X } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  space_role: string
}

interface UserMultiSelectFieldProps {
  spaceId: string
  value: string | string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  placeholder?: string
}

export function UserMultiSelectField({
  spaceId,
  value,
  onChange,
  disabled = false,
  placeholder = "Select users"
}: UserMultiSelectFieldProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

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

  useEffect(() => {
    // Parse the value to get selected user IDs
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        setSelectedUserIds(Array.isArray(parsed) ? parsed : [])
      } catch {
        setSelectedUserIds([])
      }
    } else if (Array.isArray(value)) {
      setSelectedUserIds(value)
    } else {
      setSelectedUserIds([])
    }
  }, [value])

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id))

  const handleUserToggle = (userId: string) => {
    const newSelectedIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId]
    
    setSelectedUserIds(newSelectedIds)
    onChange(newSelectedIds)
  }

  const removeUser = (userId: string) => {
    const newSelectedIds = selectedUserIds.filter(id => id !== userId)
    setSelectedUserIds(newSelectedIds)
    onChange(newSelectedIds)
  }

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
    <div className="space-y-2">
      <Select
        onValueChange={handleUserToggle}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''} disabled={disabled || loading}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem 
              key={user.id} 
              value={user.id}
              className={selectedUserIds.includes(user.id) ? 'bg-primary/10' : ''}
            >
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

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-2 bg-primary/5 border border-primary/20 rounded-md px-2 py-1"
            >
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <User className="w-3 h-3" />
                )}
              </div>
              <span className="text-sm font-medium">{user.name}</span>
              <Badge variant="outline" className="text-xs">
                {user.space_role}
              </Badge>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeUser(user.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
