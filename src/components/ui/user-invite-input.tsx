'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UserPlus, X, Mail, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  system_role?: string
}

interface UserInviteInputProps {
  spaceId: string
  onInvite: (user: User | { email: string }, role: string) => Promise<void>
  disabled?: boolean
  className?: string
}

export function UserInviteInput({ spaceId, onInvite, disabled = false, className }: UserInviteInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [role, setRole] = useState('member')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search for users
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (inputValue.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(inputValue)}&spaceId=${spaceId}`)
        const data = await response.json()
        
        if (response.ok) {
          setSuggestions(data.users || [])
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue, spaceId])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setSelectedUser(null)
    setIsNewUser(false)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (user: User) => {
    setSelectedUser(user)
    setInputValue(`${user.name} (${user.email})`)
    setShowSuggestions(false)
    setIsNewUser(false)
  }

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedUser) {
        handleInvite()
      } else if (inputValue.includes('@') && inputValue.includes('.')) {
        // Looks like an email, treat as new user
        setIsNewUser(true)
        setSelectedUser({ id: '', name: '', email: inputValue })
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Handle invite
  const handleInvite = async () => {
    if (!selectedUser && !isNewUser) {
      toast.error('Please select a user or enter a valid email')
      return
    }

    try {
      setIsInviting(true)
      await onInvite(selectedUser || { email: inputValue }, role)
      
      // Reset form
      setInputValue('')
      setSelectedUser(null)
      setIsNewUser(false)
      setSuggestions([])
      setShowSuggestions(false)
    } catch (error) {
      console.error('Error inviting user:', error)
    } finally {
      setIsInviting(false)
    }
  }

  // Clear selection
  const handleClear = () => {
    setInputValue('')
    setSelectedUser(null)
    setIsNewUser(false)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="user-invite-input">Invite user</Label>
          <div className="relative">
            <Input
              ref={inputRef}
              id="user-invite-input"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder="Type name or email..."
              disabled={disabled || isInviting}
              className="pr-8"
            />
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={handleClear}
                disabled={disabled || isInviting}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {suggestions.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleSuggestionSelect(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </div>
                    </div>
                    {user.system_role && (
                      <Badge variant="secondary" className="text-xs">
                        {user.system_role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
            )}
          </div>
          
          {/* Selected user indicator */}
          {selectedUser && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedUser.avatar} />
                <AvatarFallback>
                  {selectedUser.name ? selectedUser.name[0].toUpperCase() : selectedUser.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {selectedUser.name || selectedUser.email}
                </div>
                {selectedUser.name && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedUser.email}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleClear}
                disabled={disabled || isInviting}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {/* New user indicator */}
          {isNewUser && !selectedUser && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
              <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div className="text-sm text-green-800 dark:text-green-200">
                Will invite new user: <span className="font-medium">{inputValue}</span>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-40" disabled={disabled || isInviting}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={handleInvite}
          disabled={disabled || isInviting || (!selectedUser && !isNewUser)}
          className="min-w-[100px]"
        >
          {isInviting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Inviting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Invite</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
