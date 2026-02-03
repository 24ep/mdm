'use client'

import { useSession, signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { LogOut, User, Bell, CheckCircle, AlertCircle, Info, AlertTriangle, ExternalLink, MoreHorizontal } from 'lucide-react'
import { Z_INDEX } from '@/lib/z-index'
import { useEffect, useState } from 'react'
import { loadBrandingConfig } from '@/lib/branding'
import { cn } from '@/lib/utils'
import type { BrandingConfig } from '@/app/admin/features/system/types'
import { useNotifications } from '@/contexts/notification-context'
import { Badge } from '@/components/ui/badge'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { NotificationList } from '@/components/notifications/notification-list'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/types/notifications'
import { ProfileSettingsModal } from '@/components/settings/ProfileSettingsModal'
import { useSystemSettingsSafe } from '@/contexts/system-settings-context'

interface TopMenuBarProps {
  activeTab: string
  applicationName?: string
  logoUrl?: string
  spaceName?: string
  showSpaceName?: boolean
}

// Get feature name from activeTab
const getFeatureName = (activeTab: string): string => {
  const tabNames: Record<string, string> = {
    'overview': 'Overview',
    'analytics': 'Analytics',
    'bigquery': 'SQL Query',
    'notebook': 'Data Science',
    'ai-analyst': 'Chat with AI',
    'ai-chat-ui': 'Agent Embed GUI',
    'knowledge-base': 'Knowledge Base',
    'marketplace': 'Marketplace',
    'infrastructure': 'Infrastructure',
    'projects': 'Project Management',
    'bi': 'BI & Reports',
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
    'integrations': 'Integrations',
    'api': 'API Management',
    'space-selection': 'Data Management'
  }

  return tabNames[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')
}

export function TopMenuBar({ activeTab, applicationName = 'Unified Data Platform', logoUrl, spaceName, showSpaceName = false }: TopMenuBarProps) {
  const { data: session } = useSession()
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false)
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false)
  const { notifications, unreadCount, isLoading, markAsRead } = useNotifications()
  const { settings } = useSystemSettingsSafe()

  useEffect(() => {
    // Load branding config
    loadBrandingConfig().then((config) => {
      if (config) {
        setBranding(config)
      }
    })
  }, [])

  // Use branding config if available, otherwise use props
  const displayName = branding?.applicationName || applicationName
  const displayLogo = branding?.applicationLogo || logoUrl

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const featureName = getFeatureName(activeTab)
  const userName = (session as any)?.user?.name || 'User'
  const userEmail = (session as any)?.user?.email || ''
  const userImage = (session as any)?.user?.image || (session as any)?.user?.avatar || ''
  const userInitial = userName?.charAt(0) || userEmail?.charAt(0) || 'U'
  const userId = (session as any)?.user?.id || (session as any)?.user?.email || ''
  const userRole = (session as any)?.user?.role || 'User'

  // Construct user object for ProfileSettingsModal
  const user = {
    id: userId,
    email: userEmail,
    name: userName,
    role: userRole
  }

  // Get notification icon helper
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'UNREAD') {
      await markAsRead(notification.id)
    }
    if (notification.action_url) {
      window.open(notification.action_url, '_blank')
    }
    setNotificationPopoverOpen(false)
  }

  // Get recent notifications (first 5)
  const recentNotifications = notifications.slice(0, 5)

  return (
    <div
      className="h-14 border-b border-border flex items-center justify-between px-2 top-menu-bar"
      data-component="top-menu-bar"
      style={{
        zIndex: Z_INDEX.navigation,
        backgroundColor: 'var(--brand-top-menu-bg, hsl(var(--background)))',
        color: 'var(--brand-top-menu-text, hsl(var(--foreground)))'
      }}
    >
      {/* Left Section: Logo, Application Name, and Selected Feature */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Logo */}
        {displayLogo ? (
          <img
            src={displayLogo}
            alt={displayName}
            className="h-5 w-5 object-contain flex-shrink-0 ml-2 mr-2"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="h-5 w-5 rounded bg-primary flex items-center justify-center flex-shrink-0 ml-2 mr-2">
            <span className="text-primary-foreground text-[10px] font-bold">
              {displayName.charAt(0)}
            </span>
          </div>
        )}

        {/* Space Name or Application Name */}
        {showSpaceName && spaceName ? (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm whitespace-nowrap" style={{ color: 'var(--brand-top-menu-text, hsl(var(--foreground)))' }}>
              {spaceName}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap" style={{ color: 'var(--brand-top-menu-text, hsl(var(--muted-foreground)))', opacity: 0.7 }}>
              {displayName}
            </span>
          </div>
        ) : displayName && (
          <>
            <span className="font-semibold text-sm whitespace-nowrap" style={{ color: 'var(--brand-top-menu-text, hsl(var(--foreground)))' }}>
              {displayName}
            </span>

            {/* Separator */}
            {!showSpaceName && (
              <>
                <span className="text-sm" style={{ color: 'var(--brand-top-menu-text, hsl(var(--muted-foreground)))', opacity: 0.6 }}>|</span>

                {/* Selected Feature */}
                <span className="text-sm truncate" style={{ color: 'var(--brand-top-menu-text, hsl(var(--muted-foreground)))', opacity: 0.8 }}>
                  {featureName}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Right Section: Notifications and User Avatar */}
      <div className="flex items-center gap-2">
        {/* Notification Bell with Popover */}
        <Popover open={notificationPopoverOpen} onOpenChange={setNotificationPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-2 border-background"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="flex flex-col max-h-[600px]">
              {/* Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} unread
                    </Badge>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-[500px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                          notification.status === 'UNREAD' && "bg-muted/30"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={cn(
                                "text-sm font-medium truncate",
                                notification.status === 'UNREAD' && "font-semibold"
                              )}>
                                {notification.title}
                              </h4>
                              {notification.status === 'UNREAD' && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              {notification.action_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(notification.action_url, '_blank')
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  {notification.action_label || 'View'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with Show More button */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setNotificationPopoverOpen(false)
                      setNotificationDrawerOpen(true)
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    {notifications.length > 5
                      ? `Show More (${notifications.length - 5} more)`
                      : 'View All Notifications'
                    }
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Notification Drawer */}
        <Drawer open={notificationDrawerOpen} onOpenChange={setNotificationDrawerOpen}>
          <DrawerContent className="w-[600px] max-w-[90vw]">
            <DrawerHeader>
              <DrawerTitle>All Notifications</DrawerTitle>
              <DrawerDescription>
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto max-h-[calc(100vh-120px)]">
              <NotificationList showActions={true} maxHeight="none" />
            </div>
          </DrawerContent>
        </Drawer>

        {/* User Avatar with Popover */}
        <Popover open={profilePopoverOpen} onOpenChange={setProfilePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={userImage} alt={userName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-1" align="end">
            {/* User Info Section */}
            <div className="px-3 py-2.5">
              <div className="flex flex-col">
                <p className="text-sm font-medium leading-tight">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {userEmail}
                </p>
              </div>
            </div>

            <div className="border-t border-border my-1" />

            {/* Menu Items */}
            <div className="py-1">
              <Button
                variant="ghost"
                className="w-full justify-start font-normal h-9 px-3"
                onClick={() => {
                  setProfilePopoverOpen(false)
                  setProfileModalOpen(true)
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </Button>

              <div className="border-t border-border my-1" />

              <Button
                variant="ghost"
                className="w-full justify-start font-normal h-9 px-3"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile Settings Modal */}
        <ProfileSettingsModal
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          user={user}
        />
      </div>
    </div>
  )
}

