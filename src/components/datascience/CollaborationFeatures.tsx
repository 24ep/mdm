'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Share2, 
  MessageSquare, 
  Eye, 
  Edit, 
  Lock, 
  Unlock, 
  Copy, 
  Send,
  MoreVertical,
  UserPlus,
  Settings,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CollaborationFeaturesProps {
  notebookId?: string
  onShare?: (shareConfig: ShareConfig) => void
  onInviteUser?: (email: string, role: UserRole) => void
  onComment?: (comment: Comment) => void
  onUpdatePermissions?: (userId: string, permissions: UserPermissions) => void
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  status: 'online' | 'offline' | 'away'
  lastSeen?: Date
  permissions: UserPermissions
}

interface UserRole {
  type: 'owner' | 'editor' | 'viewer' | 'commenter'
  label: string
  description: string
  color: string
}

interface UserPermissions {
  canEdit: boolean
  canComment: boolean
  canShare: boolean
  canExecute: boolean
  canExport: boolean
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  cellId?: string
  lineNumber?: number
  createdAt: Date
  updatedAt: Date
  replies: Comment[]
  resolved: boolean
}

interface ShareConfig {
  isPublic: boolean
  allowComments: boolean
  allowCopy: boolean
  allowExport: boolean
  password?: string
  expirationDate?: Date
  allowedEmails?: string[]
}

interface Activity {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  action: string
  description: string
  timestamp: Date
  type: 'edit' | 'comment' | 'share' | 'execute' | 'export'
}

export function CollaborationFeatures({ 
  notebookId = 'notebook-1',
  onShare,
  onInviteUser,
  onComment,
  onUpdatePermissions
}: CollaborationFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'comments' | 'sharing' | 'activity'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newComment, setNewComment] = useState('')
  const [selectedCellId, setSelectedCellId] = useState<string>('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('viewer')
  const [shareConfig, setShareConfig] = useState<ShareConfig>({
    isPublic: false,
    allowComments: true,
    allowCopy: false,
    allowExport: true,
    allowedEmails: []
  })
  const [isOnline, setIsOnline] = useState(true)
  const [notifications, setNotifications] = useState(true)

  const roles: UserRole[] = [
    { type: 'owner', label: 'Owner', description: 'Full access to all features', color: 'text-purple-600' },
    { type: 'editor', label: 'Editor', description: 'Can edit and execute code', color: 'text-blue-600' },
    { type: 'commenter', label: 'Commenter', description: 'Can view and comment only', color: 'text-green-600' },
    { type: 'viewer', label: 'Viewer', description: 'Read-only access', color: 'text-gray-600' }
  ]

  useEffect(() => {
    // Initialize with mock data
    setUsers([
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        role: { type: 'owner', label: 'Owner', description: 'Full access', color: 'text-purple-600' },
        status: 'online',
        permissions: { canEdit: true, canComment: true, canShare: true, canExecute: true, canExport: true }
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        role: { type: 'editor', label: 'Editor', description: 'Can edit and execute', color: 'text-blue-600' },
        status: 'online',
        permissions: { canEdit: true, canComment: true, canShare: false, canExecute: true, canExport: true }
      },
      {
        id: 'user-3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: { type: 'viewer', label: 'Viewer', description: 'Read-only access', color: 'text-gray-600' },
        status: 'away',
        lastSeen: new Date(Date.now() - 30 * 60 * 1000),
        permissions: { canEdit: false, canComment: true, canShare: false, canExecute: false, canExport: false }
      }
    ])

    setComments([
      {
        id: 'comment-1',
        userId: 'user-2',
        userName: 'Jane Smith',
        userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        content: 'This analysis looks great! Have you considered using a different algorithm for better accuracy?',
        cellId: 'cell-1',
        lineNumber: 5,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        replies: [],
        resolved: false
      },
      {
        id: 'comment-2',
        userId: 'user-3',
        userName: 'Bob Wilson',
        content: 'Could you add more documentation to explain the data preprocessing steps?',
        cellId: 'cell-2',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        replies: [
          {
            id: 'reply-1',
            userId: 'user-1',
            userName: 'John Doe',
            userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
            content: 'Good point! I\'ll add detailed comments to each step.',
            cellId: 'cell-2',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
            replies: [],
            resolved: false
          }
        ],
        resolved: true
      }
    ])

    setActivities([
      {
        id: 'activity-1',
        userId: 'user-1',
        userName: 'John Doe',
        userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        action: 'edited',
        description: 'Modified cell 3: Added new visualization',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'edit'
      },
      {
        id: 'activity-2',
        userId: 'user-2',
        userName: 'Jane Smith',
        userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        action: 'commented',
        description: 'Left a comment on cell 1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'comment'
      },
      {
        id: 'activity-3',
        userId: 'user-1',
        userName: 'John Doe',
        userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        action: 'executed',
        description: 'Ran all cells in notebook',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        type: 'execute'
      }
    ])
  }, [])

  const handleInviteUser = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    const role = roles.find(r => r.type === inviteRole)
    if (!role) return

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role,
      status: 'offline',
      permissions: {
        canEdit: inviteRole === 'editor' || inviteRole === 'owner',
        canComment: true,
        canShare: inviteRole === 'owner',
        canExecute: inviteRole === 'editor' || inviteRole === 'owner',
        canExport: inviteRole === 'editor' || inviteRole === 'owner'
      }
    }

    setUsers(prev => [...prev, newUser])
    onInviteUser?.(inviteEmail, role)
    setInviteEmail('')
    toast.success(`Invitation sent to ${inviteEmail}`)
  }

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      userId: 'user-1', // Current user
      userName: 'You',
      content: newComment,
      cellId: selectedCellId || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: [],
      resolved: false
    }

    setComments(prev => [comment, ...prev])
    onComment?.(comment)
    setNewComment('')
    toast.success('Comment added')
  }

  const handleUpdatePermissions = (userId: string, permissions: UserPermissions) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, permissions } : user
    ))
    onUpdatePermissions?.(userId, permissions)
    toast.success('Permissions updated')
  }

  const handleShare = () => {
    onShare?.(shareConfig)
    toast.success('Sharing settings updated')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'edit': return <Edit className="h-4 w-4" />
      case 'comment': return <MessageSquare className="h-4 w-4" />
      case 'share': return <Share2 className="h-4 w-4" />
      case 'execute': return <CheckCircle className="h-4 w-4" />
      case 'export': return <Copy className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'edit': return 'text-blue-600'
      case 'comment': return 'text-green-600'
      case 'share': return 'text-purple-600'
      case 'execute': return 'text-orange-600'
      case 'export': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Collaborators ({users.length})
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNotifications(!notifications)}
                  >
                    {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Invite User */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold mb-3">Invite Collaborator</h3>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.type} value={role.type}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInviteUser}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                        <div className="text-xs text-gray-500">
                          {user.status === 'online' ? 'Online' : 
                           user.status === 'away' ? 'Away' : 
                           `Last seen ${user.lastSeen?.toLocaleTimeString()}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={user.role.color}>
                        {user.role.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newPermissions = {
                            ...user.permissions,
                            canEdit: !user.permissions.canEdit
                          }
                          handleUpdatePermissions(user.id, newPermissions)
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="cellSelect">Cell (Optional)</Label>
                    <Select value={selectedCellId} onValueChange={setSelectedCellId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cell to comment on" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cell-1">Cell 1: Data Import</SelectItem>
                        <SelectItem value="cell-2">Cell 2: Data Preprocessing</SelectItem>
                        <SelectItem value="cell-3">Cell 3: Visualization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea
                      id="comment"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.userAvatar} />
                        <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{comment.userName}</span>
                          <span className="text-sm text-gray-500">
                            {comment.createdAt.toLocaleString()}
                          </span>
                          {comment.cellId && (
                            <Badge variant="outline" className="text-xs">
                              Cell {comment.cellId.split('-')[1]}
                            </Badge>
                          )}
                          {comment.resolved && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mb-3">{comment.content}</p>
                        
                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="ml-4 space-y-2">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={reply.userAvatar} />
                                  <AvatarFallback>{reply.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-sm">{reply.userName}</span>
                                    <span className="text-xs text-gray-500">
                                      {reply.createdAt.toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <Button variant="ghost" size="sm">
                            Reply
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setComments(prev => prev.map(c => 
                                c.id === comment.id ? { ...c, resolved: !c.resolved } : c
                              ))
                            }}
                          >
                            {comment.resolved ? 'Reopen' : 'Resolve'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                Sharing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Public Access</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow anyone with the link to view this notebook
                    </p>
                  </div>
                  <Button
                    variant={shareConfig.isPublic ? "default" : "outline"}
                    onClick={() => setShareConfig(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  >
                    {shareConfig.isPublic ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    {shareConfig.isPublic ? 'Public' : 'Private'}
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Permissions</h3>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={shareConfig.allowComments}
                      onChange={(e) => setShareConfig(prev => ({ ...prev, allowComments: e.target.checked }))}
                    />
                    <span className="text-sm">Allow comments</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={shareConfig.allowCopy}
                      onChange={(e) => setShareConfig(prev => ({ ...prev, allowCopy: e.target.checked }))}
                    />
                    <span className="text-sm">Allow copying</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={shareConfig.allowExport}
                      onChange={(e) => setShareConfig(prev => ({ ...prev, allowExport: e.target.checked }))}
                    />
                    <span className="text-sm">Allow exporting</span>
                  </label>
                </div>

                <div>
                  <Label htmlFor="password">Password Protection (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={shareConfig.password || ''}
                    onChange={(e) => setShareConfig(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="expiration">Expiration Date (Optional)</Label>
                  <Input
                    id="expiration"
                    type="date"
                    value={shareConfig.expirationDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setShareConfig(prev => ({ 
                      ...prev, 
                      expirationDate: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                  />
                </div>

                <Button onClick={handleShare} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Update Sharing Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)} bg-opacity-10`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={activity.userAvatar} />
                          <AvatarFallback>{activity.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{activity.userName}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.action}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
