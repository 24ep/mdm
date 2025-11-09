'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatTimeAgo } from '@/lib/date-formatters'
import { 
  Users,
  UserPlus,
  Share,
  Copy,
  Eye,
  Edit,
  Settings,
  MessageCircle,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  PhoneOff,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Smile,
  Paperclip,
  Download,
  Upload,
  Lock,
  Unlock,
  Globe,
  Shield,
  Crown,
  User,
  UserCheck,
  UserX
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'online' | 'away' | 'offline'
  cursor?: {
    line: number
    column: number
    cellId?: string
  }
  lastSeen: Date
  isTyping: boolean
  color: string
}

interface CollaborationSession {
  id: string
  notebookId: string
  name: string
  isActive: boolean
  participants: Collaborator[]
  permissions: {
    allowEdit: boolean
    allowComment: boolean
    allowDownload: boolean
    allowShare: boolean
  }
  createdAt: Date
  expiresAt?: Date
  shareLink?: string
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: Date
  type: 'text' | 'system' | 'file'
  metadata?: {
    cellId?: string
    fileName?: string
    fileSize?: number
  }
}

interface CollaborationPanelProps {
  notebookId: string
  currentUser: Collaborator
  onUserJoin: (user: Collaborator) => void
  onUserLeave: (userId: string) => void
  onCursorUpdate: (userId: string, cursor: Collaborator['cursor']) => void
  onTypingStart: (userId: string) => void
  onTypingStop: (userId: string) => void
  onMessage: (message: ChatMessage) => void
  onPermissionChange: (permissions: CollaborationSession['permissions']) => void
}

export function CollaborationPanel({
  notebookId,
  currentUser,
  onUserJoin,
  onUserLeave,
  onCursorUpdate,
  onTypingStart,
  onTypingStop,
  onMessage,
  onPermissionChange
}: CollaborationPanelProps) {
  const [session, setSession] = useState<CollaborationSession | null>(null)
  const [participants, setParticipants] = useState<Collaborator[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [showVideo, setShowVideo] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  
  const chatRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Mock WebSocket connection - replace with actual implementation
  useEffect(() => {
    // Simulate joining a collaboration session
    const mockSession: CollaborationSession = {
      id: `session_${Date.now()}`,
      notebookId,
      name: 'Data Analysis Collaboration',
      isActive: true,
      participants: [currentUser],
      permissions: {
        allowEdit: true,
        allowComment: true,
        allowDownload: true,
        allowShare: true
      },
      createdAt: new Date(),
      shareLink: `https://notebook.app/share/${notebookId}`
    }
    
    setSession(mockSession)
    setParticipants([currentUser])
    setShareLink(mockSession.shareLink || '')

    // Simulate other users joining
    setTimeout(() => {
      const mockUsers: Collaborator[] = [
        {
          id: 'user2',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          role: 'editor',
          status: 'online',
          lastSeen: new Date(),
          isTyping: false,
          color: '#3B82F6'
        },
        {
          id: 'user3',
          name: 'Bob Smith',
          email: 'bob@example.com',
          role: 'viewer',
          status: 'online',
          lastSeen: new Date(),
          isTyping: false,
          color: '#10B981'
        }
      ]
      
      setParticipants(prev => [...prev, ...mockUsers])
      mockUsers.forEach(user => onUserJoin(user))
    }, 2000)

    // Simulate chat messages
    setTimeout(() => {
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg1',
          userId: 'user2',
          userName: 'Alice Johnson',
          content: 'Hey everyone! Ready to start the analysis?',
          timestamp: new Date(Date.now() - 300000),
          type: 'text'
        },
        {
          id: 'msg2',
          userId: 'user3',
          userName: 'Bob Smith',
          content: 'Yes! I\'ve uploaded the dataset. Should we start with exploratory data analysis?',
          timestamp: new Date(Date.now() - 240000),
          type: 'text'
        },
        {
          id: 'msg3',
          userId: currentUser.id,
          userName: currentUser.name,
          content: 'Perfect! Let\'s begin with some basic statistics and visualizations.',
          timestamp: new Date(Date.now() - 180000),
          type: 'text'
        }
      ]
      
      setChatMessages(mockMessages)
    }, 3000)

    return () => {
      // Cleanup WebSocket connection
    }
  }, [notebookId, currentUser, onUserJoin])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    }

    setChatMessages(prev => [...prev, message])
    onMessage(message)
    setNewMessage('')
    setIsTyping(false)

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    
    if (!isTyping && value.trim()) {
      setIsTyping(true)
      onTypingStart(currentUser.id)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onTypingStop(currentUser.id)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    toast.success('Share link copied to clipboard')
  }

  const inviteUser = async () => {
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    try {
      // Mock invite API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newUser: Collaborator = {
        id: `user_${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: 'viewer',
        status: 'offline',
        lastSeen: new Date(),
        isTyping: false,
        color: '#8B5CF6'
      }

      setParticipants(prev => [...prev, newUser])
      onUserJoin(newUser)
      setInviteEmail('')
      toast.success(`Invitation sent to ${inviteEmail}`)
    } catch (error) {
      toast.error('Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const removeUser = (userId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== userId))
    onUserLeave(userId)
    toast.success('User removed from collaboration')
  }

  const changeUserRole = (userId: string, role: Collaborator['role']) => {
    setParticipants(prev => prev.map(p => 
      p.id === userId ? { ...p, role } : p
    ))
    toast.success(`User role changed to ${role}`)
  }

  const getRoleIcon = (role: Collaborator['role']) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3 text-yellow-500" />
      case 'editor': return <Edit className="h-3 w-3 text-blue-500" />
      case 'viewer': return <Eye className="h-3 w-3 text-gray-500" />
    }
  }

  const getStatusColor = (status: Collaborator['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
    }
  }


  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [chatMessages])

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Collaboration</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChat(!showChat)}
              className="h-8 w-8 p-0"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>
          <Badge variant="outline" className="text-xs">
            {participants.filter(p => p.status === 'online').length} online
          </Badge>
        </div>
      </div>

      {/* Participants List */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: participant.color }}
                  >
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                  getStatusColor(participant.status)
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {participant.name}
                  </span>
                  {getRoleIcon(participant.role)}
                  {participant.isTyping && (
                    <Badge variant="secondary" className="text-xs">
                      typing...
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {participant.status === 'online' ? 'Online' : `Last seen ${formatTimeAgo(participant.lastSeen)}`}
                </div>
              </div>
              
              {currentUser.role === 'owner' && participant.id !== currentUser.id && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => changeUserRole(participant.id, participant.role === 'editor' ? 'viewer' : 'editor')}
                    className="h-6 w-6 p-0"
                  >
                    {participant.role === 'editor' ? <Eye className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeUser(participant.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Invite User */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter email to invite"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              onClick={inviteUser}
              disabled={isInviting || !inviteEmail.trim()}
              className="h-8 px-3"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Invite
            </Button>
          </div>
        </div>
      </div>

      {/* Chat */}
      {showChat && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Messages */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.userId === currentUser.id ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {message.userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className={cn(
                  "flex-1 max-w-xs",
                  message.userId === currentUser.id ? "text-right" : "text-left"
                )}>
                  <div className={cn(
                    "inline-block px-3 py-2 rounded-lg text-sm",
                    message.userId === currentUser.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}>
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.userName} • {formatTimeAgo(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="h-8 w-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Link */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Share className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Share Link</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={shareLink}
              readOnly
              className="h-8 text-xs font-mono"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={copyShareLink}
              className="h-8 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
