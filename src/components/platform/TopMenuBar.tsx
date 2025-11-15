'use client'

import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { User, Moon, Sun, Monitor, LogOut, Settings } from 'lucide-react'
import { Z_INDEX } from '@/lib/z-index'
import { useEffect, useState } from 'react'

interface TopMenuBarProps {
  activeTab: string
  applicationName?: string
  logoUrl?: string
}

// Get feature name from activeTab
const getFeatureName = (activeTab: string): string => {
  const tabNames: Record<string, string> = {
    'overview': 'Overview',
    'analytics': 'Analytics',
    'bigquery': 'SQL Query',
    'notebook': 'Data Science',
    'ai-analyst': 'AI Analyst',
    'ai-chat-ui': 'AI Chat UI',
    'knowledge-base': 'Knowledge Base',
    'marketplace': 'Marketplace',
    'infrastructure': 'Infrastructure',
    'projects': 'Project Management',
    'bi': 'BI & Reports',
    'reports': 'Reports & Dashboard',
    'storage': 'Storage',
    'data-governance': 'Data Governance',
    'users': 'Users',
    'roles': 'Roles',
    'permission-tester': 'Permission Tester',
    'space-layouts': 'Space Layouts',
    'space-settings': 'Space Settings',
    'assets': 'Asset Management',
    'data': 'Data Models',
    'attachments': 'Attachments',
    'kernels': 'Kernel Management',
    'health': 'System Health',
    'logs': 'Logs',
    'audit': 'Audit Logs',
    'database': 'Database',
    'change-requests': 'Change Requests',
    'sql-linting': 'SQL Linting',
    'schema-migrations': 'Schema Migrations',
    'data-masking': 'Data Masking',
    'cache': 'Cache',
    'backup': 'Backup & Recovery',
    'security': 'Security',
    'performance': 'Performance',
    'settings': 'System Settings',
    'page-templates': 'Page Templates',
    'notifications': 'Notifications',
    'themes': 'Theme & Branding',
    'export': 'Data Export',
    'integrations': 'Integrations',
    'api': 'API Management',
    'space-selection': 'Data Management'
  }

  return tabNames[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')
}

export function TopMenuBar({ activeTab, applicationName = 'Unified Data Platform', logoUrl }: TopMenuBarProps) {
  const { data: session } = useSession()
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const featureName = getFeatureName(activeTab)
  const userName = (session as any)?.user?.name || 'User'
  const userEmail = (session as any)?.user?.email || ''
  const userImage = (session as any)?.user?.image || (session as any)?.user?.avatar || ''
  const userInitial = userName?.charAt(0) || userEmail?.charAt(0) || 'U'

  // Get the current effective theme (system resolves to light/dark)
  const currentTheme = mounted ? (theme === 'system' ? systemTheme || 'light' : theme || 'system') : 'system'
  const isSystemMode = mounted ? theme === 'system' || !theme : true
  const isDarkMode = currentTheme === 'dark'

  // Handle theme toggle - cycles: system -> light -> dark -> system
  const handleThemeToggle = (checked: boolean) => {
    if (isSystemMode) {
      // If currently system, toggle to light or dark based on system preference
      setTheme(checked ? 'dark' : 'light')
    } else {
      // If currently light/dark, toggle between them
      setTheme(checked ? 'dark' : 'light')
    }
  }

  // Handle system mode selection
  const handleSystemMode = () => {
    setTheme('system')
  }

  return (
    <div className="h-14 border-b border-border bg-background flex items-center justify-between px-2" style={{ zIndex: Z_INDEX.navigation }}>
      {/* Left Section: Logo, Application Name, and Selected Feature */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Logo */}
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={applicationName}
            className="h-5 w-5 object-contain flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="h-5 w-5 rounded bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground text-[10px] font-bold">
              {applicationName.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Application Name */}
        <span className="font-semibold text-sm text-foreground whitespace-nowrap">
          {applicationName}
        </span>
        
        {/* Separator */}
        <span className="text-muted-foreground text-sm">|</span>
        
        {/* Selected Feature */}
        <span className="text-sm text-muted-foreground truncate">
          {featureName}
        </span>
      </div>

      {/* Right Section: User Avatar with Popover */}
      <div className="flex items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="relative h-6 w-6 rounded-full p-0">
              <Avatar className="h-6 w-6 border-2 border-border">
                <AvatarImage src={userImage} alt={userName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] border-2 border-border">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            {/* User Info Section */}
            <div className="p-4 border-b border-border">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {userName}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate ml-6">
                  {userEmail}
                </p>
              </div>
            </div>
            
            {/* Profile Settings */}
            <div className="p-2">
              <Link href="/profile">
                <Button
                  variant="ghost"
                  className="w-full justify-start font-normal"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </Button>
              </Link>
            </div>
            
            {/* Theme Section */}
            <div className="p-2 border-t border-border">
              <div className="px-2 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Monitor className="h-3.5 w-3.5" />
                Theme
              </div>
              
              {/* System Mode Button */}
              <div className="px-2 py-1.5">
                <Button
                  variant={isSystemMode ? 'secondary' : 'ghost'}
                  className="w-full justify-between font-normal h-9"
                  onClick={handleSystemMode}
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                    {isSystemMode && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({systemTheme === 'dark' ? 'Dark' : 'Light'})
                      </span>
                    )}
                  </div>
                  {isSystemMode && (
                    <span className="text-xs">✓</span>
                  )}
                </Button>
              </div>

              {/* Light/Dark Toggle Switch */}
              <div className="px-2 py-2">
                <div className={`flex items-center justify-between p-2.5 rounded-md transition-colors ${
                  isSystemMode ? 'bg-muted/30 border border-border/50' : 'bg-muted/50'
                }`}>
                  <div className="flex items-center gap-2 flex-1">
                    <Sun className={`h-4 w-4 transition-colors ${
                      !isDarkMode && !isSystemMode 
                        ? 'text-amber-500' 
                        : isSystemMode && !isDarkMode
                        ? 'text-amber-500/70'
                        : 'text-muted-foreground'
                    }`} />
                    <span className={`text-sm transition-colors ${
                      !isDarkMode && !isSystemMode 
                        ? 'font-medium text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      Light
                    </span>
                  </div>
                  
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={handleThemeToggle}
                    disabled={!mounted}
                    className={isSystemMode ? 'opacity-80' : ''}
                  />
                  
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className={`text-sm transition-colors ${
                      isDarkMode && !isSystemMode 
                        ? 'font-medium text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      Dark
                    </span>
                    <Moon className={`h-4 w-4 transition-colors ${
                      isDarkMode && !isSystemMode 
                        ? 'text-blue-500' 
                        : isSystemMode && isDarkMode
                        ? 'text-blue-500/70'
                        : 'text-muted-foreground'
                    }`} />
                  </div>
                </div>
                {isSystemMode && (
                  <p className="text-xs text-muted-foreground mt-2 px-2 text-center italic">
                    Click toggle to override system preference
                  </p>
                )}
              </div>
            </div>
            
            {/* Logout */}
            <div className="p-2 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

