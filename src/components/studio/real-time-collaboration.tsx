'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users,
  UserPlus,
  UserMinus,
  MessageCircle,
  Bell,
  BellOff,
  Eye,
  Edit,
  Lock,
  Unlock,
  Share,
  Copy,
  Settings,
  Activity,
  Zap,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff
} from 'lucide-react'

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen?: string
  currentPage?: string
  cursor?: {
    x: number
    y: number
    componentId?: string
  }
  permissions: {
    canEdit: boolean
    canComment: boolean
    canInvite: boolean
    canPublish: boolean
  }
}

interface CollaborationSession {
  id: string
  pageId: string
  pageName: string
  collaborators: Collaborator[]
  isActive: boolean
  startedAt: string
  lastActivity: string
  settings: {
    allowComments: boolean
    allowVoiceChat: boolean
    allowVideoChat: boolean
    requireApproval: boolean
    autoSave: boolean
    conflictResolution: 'last-write-wins' | 'manual' | 'merge'
  }
}

interface Comment {
  id: string
  pageId: string
  componentId?: string
  content: string
  author: Collaborator
  createdAt: string
  resolved: boolean
  replies: Comment[]
  position?: {
    x: number
    y: number
  }
}

interface RealTimeCollaborationProps {
  session: CollaborationSession
  comments: Comment[]
  onUpdateSession: (updates: Partial<CollaborationSession>) => void
  onInviteCollaborator: (email: string, role: Collaborator['role']) => void
  onRemoveCollaborator: (collaboratorId: string) => void
  onUpdateCollaboratorRole: (collaboratorId: string, role: Collaborator['role']) => void
  onSendComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'author'>) => void
  onResolveComment: (commentId: string) => void
  onReplyToComment: (commentId: string, reply: Omit<Comment, 'id' | 'createdAt' | 'author'>) => void
  onStartVoiceChat: () => void
  onEndVoiceChat: () => void
  onStartVideoChat: () => void
  onEndVideoChat: () => void
}

export function RealTimeCollaboration({
  session,
  comments,
  onUpdateSession,
  onInviteCollaborator,
  onRemoveCollaborator,
  onUpdateCollaboratorRole,
  onSendComment,
  onResolveComment,
  onReplyToComment,
  onStartVoiceChat,
  onEndVoiceChat,
  onStartVideoChat,
  onEndVideoChat
}: RealTimeCollaborationProps) {
  const [activeTab, setActiveTab] = useState<'collaborators' | 'comments' | 'activity' | 'settings'>('collaborators')
  const [newComment, setNewComment] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Collaborator['role']>('viewer')
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false)
  const [isVideoChatActive, setIsVideoChatActive] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected')

  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate connection status changes
      const statuses: typeof connectionStatus[] = ['connected', 'disconnected', 'reconnecting']
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      setConnectionStatus(randomStatus)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleSendComment = useCallback(() => {
    if (!newComment.trim()) return

    onSendComment({
      pageId: session.pageId,
      content: newComment.trim(),
      resolved: false,
      replies: []
    })

    setNewComment('')
  }, [newComment, session.pageId, onSendComment])

  const handleInviteCollaborator = useCallback(() => {
    if (!inviteEmail.trim()) return

    onInviteCollaborator(inviteEmail.trim(), inviteRole)
    setInviteEmail('')
  }, [inviteEmail, inviteRole, onInviteCollaborator])

  const getStatusColor = useCallback((status: Collaborator['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }, [])

  const getRoleColor = useCallback((role: Collaborator['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'editor': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-green-100 text-green-800'
      case 'commenter': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const onlineCollaborators = session.collaborators.filter(c => c.status === 'online')
  const unreadComments = comments.filter(c => !c.resolved).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Real-time Collaboration
          </h2>
          <p className="text-muted-foreground">
            {session.pageName} • {onlineCollaborators.length} online
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' && <Wifi className="h-4 w-4 text-green-600" />}
            {connectionStatus === 'disconnected' && <WifiOff className="h-4 w-4 text-red-600" />}
            {connectionStatus === 'reconnecting' && <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />}
            <span className="text-sm text-muted-foreground capitalize">{connectionStatus}</span>
          </div>

          {/* Voice/Video Chat */}
          <Button
            variant={isVoiceChatActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (isVoiceChatActive) {
                onEndVoiceChat()
                setIsVoiceChatActive(false)
              } else {
                onStartVoiceChat()
                setIsVoiceChatActive(true)
              }
            }}
          >
            {isVoiceChatActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            variant={isVideoChatActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (isVideoChatActive) {
                onEndVideoChat()
                setIsVideoChatActive(false)
              } else {
                onStartVideoChat()
                setIsVideoChatActive(true)
              }
            }}
          >
            {isVideoChatActive ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{session.collaborators.length}</div>
                <div className="text-sm text-muted-foreground">Total Collaborators</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{onlineCollaborators.length}</div>
                <div className="text-sm text-muted-foreground">Online Now</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{comments.length}</div>
                <div className="text-sm text-muted-foreground">Comments</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{unreadComments}</div>
                <div className="text-sm text-muted-foreground">Unresolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'collaborators' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('collaborators')}
        >
          <Users className="h-4 w-4 mr-2" />
          Collaborators
        </Button>
        <Button
          variant={activeTab === 'comments' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('comments')}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Comments
          {unreadComments > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {unreadComments}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'activity' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('activity')}
        >
          <Activity className="h-4 w-4 mr-2" />
          Activity
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Collaborators Tab */}
      {activeTab === 'collaborators' && (
        <div className="space-y-4">
          {/* Invite Collaborator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Collaborator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1"
                />
                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="commenter">Commenter</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInviteCollaborator}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Collaborators List */}
          <div className="space-y-2">
            {session.collaborators.map(collaborator => (
              <Card key={collaborator.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={collaborator.avatar} />
                          <AvatarFallback>{collaborator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(collaborator.status)}`} />
                      </div>
                      <div>
                        <div className="font-medium">{collaborator.name}</div>
                        <div className="text-sm text-muted-foreground">{collaborator.email}</div>
                        {collaborator.currentPage && (
                          <div className="text-xs text-muted-foreground">
                            Currently on: {collaborator.currentPage}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(collaborator.role)}>
                        {collaborator.role}
                      </Badge>
                      <Select
                        value={collaborator.role}
                        onValueChange={(value: any) => onUpdateCollaboratorRole(collaborator.id, value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="commenter">Commenter</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveCollaborator(collaborator.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {/* Add Comment */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                />
                <Button onClick={handleSendComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map(comment => (
              <Card key={comment.id} className={comment.resolved ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{comment.author.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        {comment.resolved && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mb-2">{comment.content}</p>
                      <div className="flex items-center gap-2">
                        {!comment.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResolveComment(comment.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const reply = prompt('Reply to comment:')
                            if (reply) {
                              onReplyToComment(comment.id, {
                                pageId: comment.pageId,
                                componentId: comment.componentId,
                                content: reply,
                                resolved: false,
                                replies: []
                              })
                            }
                          }}
                        >
                          Reply
                        </Button>
                      </div>
                      
                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="mt-3 ml-4 space-y-2">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="flex items-start gap-2 p-2 bg-muted rounded">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={reply.author.avatar} />
                                <AvatarFallback className="text-xs">{reply.author.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-xs font-medium">{reply.author.name}</div>
                                <div className="text-xs">{reply.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div ref={commentsEndRef} />
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'joined', user: 'John Doe', time: '2 minutes ago' },
                { action: 'commented', user: 'Jane Smith', time: '5 minutes ago' },
                { action: 'edited', user: 'Mike Johnson', time: '10 minutes ago' },
                { action: 'resolved comment', user: 'Sarah Wilson', time: '15 minutes ago' },
                { action: 'invited', user: 'Admin', time: '20 minutes ago' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <span className="font-medium">{activity.user}</span>
                    <span className="text-muted-foreground"> {activity.action}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Collaboration Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Comments</div>
                  <div className="text-sm text-muted-foreground">Enable commenting on this page</div>
                </div>
                <Switch
                  checked={session.settings.allowComments}
                  onCheckedChange={(checked) => onUpdateSession({
                    settings: { ...session.settings, allowComments: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Voice Chat</div>
                  <div className="text-sm text-muted-foreground">Enable voice chat during collaboration</div>
                </div>
                <Switch
                  checked={session.settings.allowVoiceChat}
                  onCheckedChange={(checked) => onUpdateSession({
                    settings: { ...session.settings, allowVoiceChat: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Video Chat</div>
                  <div className="text-sm text-muted-foreground">Enable video chat during collaboration</div>
                </div>
                <Switch
                  checked={session.settings.allowVideoChat}
                  onCheckedChange={(checked) => onUpdateSession({
                    settings: { ...session.settings, allowVideoChat: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Require Approval</div>
                  <div className="text-sm text-muted-foreground">Require approval for changes</div>
                </div>
                <Switch
                  checked={session.settings.requireApproval}
                  onCheckedChange={(checked) => onUpdateSession({
                    settings: { ...session.settings, requireApproval: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-save</div>
                  <div className="text-sm text-muted-foreground">Automatically save changes</div>
                </div>
                <Switch
                  checked={session.settings.autoSave}
                  onCheckedChange={(checked) => onUpdateSession({
                    settings: { ...session.settings, autoSave: checked }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
