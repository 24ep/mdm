"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { formatTimeAgo } from '@/lib/date-formatters'
import { 
  Bell, 
  BellOff, 
  Check, 
  X, 
  Trash2, 
  FileText, 
  Download, 
  Share2, 
  AlertTriangle,
  Upload,
  HardDrive
} from 'lucide-react'

interface FileNotificationsProps {
  spaceId: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  file_id?: string
  is_read: boolean
  action_url?: string
  metadata: any
  created_at: string
  file_name?: string
  mime_type?: string
}

export function FileNotifications({ spaceId }: FileNotificationsProps) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [spaceId, session?.user?.id])

  const fetchNotifications = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/files/notifications', {
        headers: {
          'x-user-id': session.user.id
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/files/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id
        },
        body: JSON.stringify({ notificationIds })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, is_read: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  }

  const markAllAsRead = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/files/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id
        },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const deleteNotifications = async (notificationIds: string[]) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/files/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id
        },
        body: JSON.stringify({ notificationIds })
      })

      if (!response.ok) {
        throw new Error('Failed to delete notifications')
      }

      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)))
      setSelectedNotifications(new Set())
    } catch (err) {
      console.error('Error deleting notifications:', err)
    }
  }

  const deleteAllNotifications = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/files/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id
        },
        body: JSON.stringify({ deleteAll: true })
      })

      if (!response.ok) {
        throw new Error('Failed to delete all notifications')
      }

      setNotifications([])
      setUnreadCount(0)
      setSelectedNotifications(new Set())
    } catch (err) {
      console.error('Error deleting all notifications:', err)
    }
  }

  const handleNotificationSelect = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId)
    } else {
      newSelected.add(notificationId)
    }
    setSelectedNotifications(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="w-4 h-4" />
      case 'download':
        return <Download className="w-4 h-4" />
      case 'share':
        return <Share2 className="w-4 h-4" />
      case 'delete':
        return <Trash2 className="w-4 h-4" />
      case 'quota':
        return <AlertTriangle className="w-4 h-4" />
      case 'processing':
        return <HardDrive className="w-4 h-4" />
      case 'backup':
        return <HardDrive className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'upload':
        return 'text-green-600'
      case 'download':
        return 'text-blue-600'
      case 'share':
        return 'text-purple-600'
      case 'delete':
        return 'text-red-600'
      case 'quota':
        return 'text-orange-600'
      case 'processing':
        return 'text-blue-600'
      case 'backup':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const unreadNotifications = notifications.filter(n => !n.is_read)
  const readNotifications = notifications.filter(n => n.is_read)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedNotifications.size > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAsRead(Array.from(selectedNotifications))}
              >
                <Check className="w-4 h-4 mr-2" />
                Mark as Read
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteNotifications(Array.from(selectedNotifications))}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({readNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center space-x-2 p-2 border-b">
                <Checkbox
                  checked={selectedNotifications.size === notifications.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select all ({selectedNotifications.size} selected)
                </span>
              </div>

              {/* Notifications List */}
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                    } ${
                      selectedNotifications.has(notification.id) ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleNotificationSelect(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedNotifications.has(notification.id)}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className={`${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={`font-medium ${!notification.is_read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              {notification.file_name && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  File: {notification.file_name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-2">
          {unreadNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No unread notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unreadNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="cursor-pointer transition-colors bg-blue-50 border-blue-200"
                  onClick={() => markAsRead([notification.id])}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        {notification.file_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            File: {notification.file_name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-2">
          {readNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No read notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {readNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="cursor-pointer transition-colors opacity-75"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`${getNotificationColor(notification.type)} opacity-50`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        {notification.file_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            File: {notification.file_name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedNotifications.size} notifications selected
          </span>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAsRead(Array.from(selectedNotifications))}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark as Read
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteNotifications(Array.from(selectedNotifications))}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
