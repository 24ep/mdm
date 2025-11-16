'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, Search, Settings, LogOut, User as UserIcon, Moon, Sun, Monitor } from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { SystemSettingsModal } from '@/components/settings/SystemSettingsModal'
import { ProfileSettingsModal } from '@/components/settings/ProfileSettingsModal'

interface HeaderProps {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export function Header({ user }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <AnimatedIcon 
            icon="Search" 
            size={16} 
            animation="scale" 
            trigger="hover"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-80 rounded-md border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} alt={user.name} />
                <AvatarFallback>
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  Role: {user.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault()
                setShowProfileModal(true)
              }}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SystemSettingsModal 
        open={showSettingsModal} 
        onOpenChange={setShowSettingsModal} 
      />
      <ProfileSettingsModal 
        open={showProfileModal} 
        onOpenChange={setShowProfileModal}
        user={user}
      />
    </header>
  )
}