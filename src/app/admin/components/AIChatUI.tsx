'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Globe,
  Send,
  Copy,
  Check,
  MessageSquare,
  Settings,
  Palette,
  Layout,
  Rocket,
  Play,
  GitBranch,
  History,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { PreviewDialog } from './PreviewDialog'
import { VersionHistoryDialog } from './VersionHistoryDialog'
import { StyleTab } from './StyleTab'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ChatbotVersion {
  id: string
  version: string
  createdAt: Date
  createdBy: string
  isPublished: boolean
  changes?: string
}

interface Chatbot {
  id: string
  name: string
  website: string
  description?: string
  apiEndpoint: string
  apiAuthType: 'none' | 'bearer' | 'api_key' | 'custom'
  apiAuthValue: string
  // Style config
  logo?: string
  primaryColor: string
  fontFamily: string
  fontSize: string
  fontColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  // Message bubble borders
  bubbleBorderColor?: string
  bubbleBorderWidth?: string
  bubbleBorderRadius?: string
  messageBoxColor: string
  shadowColor: string
  shadowBlur: string
  // Config
  conversationOpener: string
  followUpQuestions: string[]
  enableFileUpload: boolean
  showCitations: boolean
  // Deployment
  deploymentType: 'popover' | 'fullpage' | 'popup-center'
  embedCode?: string
  // Widget styling (for popover)
  widgetAvatarStyle: 'circle' | 'square' | 'circle-with-label'
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center'
  widgetSize: string
  widgetBackgroundColor: string
  widgetBorderColor: string
  widgetBorderWidth: string
  widgetBorderRadius: string
  widgetShadowColor: string
  widgetShadowBlur: string
  widgetLabelText?: string
  widgetLabelColor?: string
  // Widget behavior
  widgetAnimation: 'none' | 'fade' | 'slide' | 'bounce'
  widgetAutoShow: boolean
  widgetAutoShowDelay: number // seconds
  widgetOffsetX: string // horizontal offset from edge
  widgetOffsetY: string // vertical offset from edge
  widgetZIndex: number
  showNotificationBadge: boolean
  notificationBadgeColor: string
  // Chat window size
  chatWindowWidth: string
  chatWindowHeight: string
  // Chat window border (popover/fullpage frame)
  chatWindowBorderColor?: string
  chatWindowBorderWidth?: string
  chatWindowBorderRadius?: string
  // Typing indicator
  typingIndicatorStyle?: 'spinner' | 'dots' | 'pulse' | 'bounce'
  typingIndicatorColor?: string
  // Header
  headerTitle?: string
  headerDescription?: string
  headerLogo?: string
  headerBgColor?: string
  headerFontColor?: string
  headerFontFamily?: string
  headerShowAvatar?: boolean
  headerBorderEnabled?: boolean
  headerBorderColor?: string
  headerPaddingX?: string
  headerPaddingY?: string
  // Avatar
  avatarType?: 'icon' | 'image'
  avatarIcon?: string
  avatarIconColor?: string
  avatarBackgroundColor?: string
  avatarImageUrl?: string
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  versions: ChatbotVersion[]
  currentVersion: string
}

export function AIChatUI() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [websites, setWebsites] = useState<string[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null)
  const [expandedWebsites, setExpandedWebsites] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'engine' | 'style' | 'config' | 'deployment'>('engine')
  const emulatorRef = useRef<HTMLIFrameElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [newChatbotName, setNewChatbotName] = useState('')

  const [formData, setFormData] = useState<Partial<Chatbot>>({
    name: '',
    website: '',
    description: '',
    apiEndpoint: '',
    apiAuthType: 'none',
    apiAuthValue: '',
    primaryColor: '#3b82f6',
    fontFamily: 'Inter',
    fontSize: '14px',
    fontColor: '#000000',
    borderColor: '#e5e7eb',
    borderWidth: '1px',
    borderRadius: '8px',
    bubbleBorderColor: '#e5e7eb',
    bubbleBorderWidth: '1px',
    bubbleBorderRadius: '8px',
    messageBoxColor: '#ffffff',
    shadowColor: '#000000',
    shadowBlur: '4px',
    conversationOpener: 'Hello! How can I help you today?',
    followUpQuestions: [],
    enableFileUpload: false,
    showCitations: true,
    deploymentType: 'popover' as 'popover' | 'fullpage' | 'popup-center',
    widgetAvatarStyle: 'circle' as 'circle' | 'square' | 'circle-with-label',
    widgetPosition: 'bottom-right' as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center',
    widgetSize: '60px',
    widgetBackgroundColor: '#3b82f6',
    widgetBorderColor: '#ffffff',
    widgetBorderWidth: '2px',
    widgetBorderRadius: '50%',
    widgetShadowColor: '#000000',
    widgetShadowBlur: '8px',
    widgetLabelText: 'Chat',
    widgetLabelColor: '#ffffff',
    widgetAnimation: 'fade' as 'none' | 'fade' | 'slide' | 'bounce',
    widgetAutoShow: true,
    widgetAutoShowDelay: 0,
    widgetOffsetX: '20px',
    widgetOffsetY: '20px',
    widgetZIndex: 9999,
    showNotificationBadge: false,
    notificationBadgeColor: '#ef4444',
    chatWindowWidth: '380px',
    chatWindowHeight: '600px',
    chatWindowBorderColor: '#e5e7eb',
    chatWindowBorderWidth: '1px',
    chatWindowBorderRadius: '8px',
    typingIndicatorStyle: 'spinner',
    typingIndicatorColor: '#6b7280',
    headerTitle: '',
    headerDescription: '',
    headerLogo: '',
    headerBgColor: '#3b82f6',
    headerFontColor: '#ffffff',
    headerFontFamily: 'Inter',
    headerShowAvatar: true,
    headerBorderEnabled: true,
    headerBorderColor: '#e5e7eb',
    headerPaddingX: '16px',
    headerPaddingY: '16px',
    avatarType: 'icon',
    avatarIcon: 'Bot',
    avatarIconColor: '#ffffff',
    avatarBackgroundColor: '#3b82f6',
    avatarImageUrl: '',
    isPublished: false,
    currentVersion: '1.0.0'
  })

  const [newFollowUpQuestion, setNewFollowUpQuestion] = useState('')
  const [previewMode, setPreviewMode] = useState<'popover' | 'fullpage' | 'popup-center'>('popover')

  useEffect(() => {
    loadChatbots()
  }, [])

  // Push realtime style updates to emulator via postMessage
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current || !formData) return
    const iframe = emulatorRef.current
    try {
      iframe.contentWindow?.postMessage(
        {
          type: 'chatbot-config-update',
          id: selectedChatbot.id,
          config: {
            ...formData,
            id: selectedChatbot.id,
          },
        },
        '*'
      )
    } catch (e) {
      // ignore
    }
  }, [selectedChatbot?.id, formData])

  // Initialize and push preview mode to emulator
  useEffect(() => {
    if (!formData?.deploymentType) return
    setPreviewMode(formData.deploymentType)
  }, [formData?.deploymentType])

  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current) return
    try {
      emulatorRef.current.contentWindow?.postMessage({ type: 'chatbot-preview-mode', value: previewMode }, '*')
    } catch {}
  }, [previewMode, selectedChatbot?.id])

  useEffect(() => {
    // Extract unique websites
    const uniqueWebsites = Array.from(new Set(chatbots.map(c => c.website).filter(Boolean)))
    setWebsites(uniqueWebsites)
    // Auto-expand all websites
    setExpandedWebsites(new Set(uniqueWebsites))
  }, [chatbots])

  const loadChatbots = async () => {
    setIsLoading(true)
    try {
      // For now, use localStorage - replace with API call when database is ready
      const saved = localStorage.getItem('ai-chatbots')
      if (saved) {
        const parsed = JSON.parse(saved)
        setChatbots(parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          versions: (c.versions || []).map((v: any) => ({
            ...v,
            createdAt: new Date(v.createdAt)
          }))
        })))
      } else {
        // Try API as fallback
        const response = await fetch('/api/chatbots')
        if (response.ok) {
          const data = await response.json()
          setChatbots(data.chatbots.map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
            versions: (c.versions || []).map((v: any) => ({
              ...v,
              createdAt: new Date(v.createdAt)
            }))
          })))
        }
      }
    } catch (error) {
      console.error('Error loading chatbots:', error)
      toast.error('Failed to load chatbots')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    // Ask for chatbot name first
    setNewChatbotName('')
    setShowNameDialog(true)
  }

  const startCreateWithName = (name: string) => {
    // Create a new chatbot immediately, then open Edit dialog
    const newId = `chatbot-${Date.now()}`
    const base: Chatbot = {
      id: newId,
      name: name,
      website: '',
      description: '',
      apiEndpoint: '',
      apiAuthType: 'none',
      apiAuthValue: '',
      logo: '',
      primaryColor: '#3b82f6',
      fontFamily: 'Inter',
      fontSize: '14px',
      fontColor: '#000000',
      borderColor: '#e5e7eb',
      borderWidth: '1px',
      borderRadius: '8px',
      bubbleBorderColor: '#e5e7eb',
      bubbleBorderWidth: '1px',
      bubbleBorderRadius: '8px',
      messageBoxColor: '#ffffff',
      shadowColor: '#000000',
      shadowBlur: '4px',
      conversationOpener: 'Hello! How can I help you today?',
      followUpQuestions: [],
      enableFileUpload: false,
      showCitations: true,
      deploymentType: 'popover',
      widgetAvatarStyle: 'circle',
      widgetPosition: 'bottom-right',
      widgetSize: '60px',
      widgetBackgroundColor: '#3b82f6',
      widgetBorderColor: '#ffffff',
      widgetBorderWidth: '2px',
      widgetBorderRadius: '50%',
      widgetShadowColor: '#000000',
      widgetShadowBlur: '8px',
      widgetLabelText: 'Chat',
      widgetLabelColor: '#ffffff',
      widgetAnimation: 'fade',
      widgetAutoShow: true,
      widgetAutoShowDelay: 0,
      widgetOffsetX: '20px',
      widgetOffsetY: '20px',
      widgetZIndex: 9999,
      showNotificationBadge: false,
      notificationBadgeColor: '#ef4444',
      chatWindowWidth: '380px',
      chatWindowHeight: '600px',
      chatWindowBorderColor: '#e5e7eb',
      chatWindowBorderWidth: '1px',
      chatWindowBorderRadius: '8px',
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: [{
        id: `version-${Date.now()}`,
        version: '1.0.0',
        createdAt: new Date(),
        createdBy: 'current-user',
        isPublished: false
      }],
      currentVersion: '1.0.0'
    }

    try {
      const saved = localStorage.getItem('ai-chatbots')
      const existing: Chatbot[] = saved ? JSON.parse(saved) : []
      const updated = [...existing, base]
      localStorage.setItem('ai-chatbots', JSON.stringify(updated))
      setChatbots(updated)
    } catch {}

    setSelectedChatbot(base)
    setFormData({
      name: '',
      website: '',
      description: '',
      apiEndpoint: '',
      apiAuthType: 'none',
      apiAuthValue: '',
      primaryColor: '#3b82f6',
      fontFamily: 'Inter',
      fontSize: '14px',
      fontColor: '#000000',
      borderColor: '#e5e7eb',
      borderWidth: '1px',
      borderRadius: '8px',
      messageBoxColor: '#ffffff',
      shadowColor: '#000000',
      shadowBlur: '4px',
      conversationOpener: 'Hello! How can I help you today?',
      followUpQuestions: [],
      enableFileUpload: false,
      showCitations: true,
      deploymentType: 'popover' as 'popover' | 'fullpage' | 'popup-center',
      widgetAvatarStyle: 'circle' as 'circle' | 'square' | 'circle-with-label',
      widgetPosition: 'bottom-right' as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center',
      widgetSize: '60px',
      widgetBackgroundColor: '#3b82f6',
      widgetBorderColor: '#ffffff',
      widgetBorderWidth: '2px',
      widgetBorderRadius: '50%',
      widgetShadowColor: '#000000',
      widgetShadowBlur: '8px',
      widgetLabelText: 'Chat',
      widgetLabelColor: '#ffffff',
      widgetAnimation: 'fade' as 'none' | 'fade' | 'slide' | 'bounce',
      widgetAutoShow: true,
      widgetAutoShowDelay: 0,
      widgetOffsetX: '20px',
      widgetOffsetY: '20px',
      widgetZIndex: 9999,
      showNotificationBadge: false,
      notificationBadgeColor: '#ef4444',
      chatWindowWidth: '380px',
      chatWindowHeight: '600px',
      isPublished: false,
      currentVersion: '1.0.0'
    })
    // Pre-fill name into form
    setFormData((prev) => ({ ...prev, name: name }))
    setActiveTab('engine')
    setShowEditDialog(true)
  }

  const handleEdit = (chatbot: Chatbot) => {
    setSelectedChatbot(chatbot)
    setFormData({
      ...chatbot,
      followUpQuestions: chatbot.followUpQuestions || []
    })
    setActiveTab('engine')
    setShowEditDialog(true)
  }

  const handleSave = async () => {
    try {
      let updatedChatbots = [...chatbots]
      
      if (selectedChatbot) {
        // Update existing - create new version
        const index = updatedChatbots.findIndex(c => c.id === selectedChatbot.id)
        if (index >= 0) {
          const currentVersion = parseFloat(selectedChatbot.currentVersion) || 1.0
          const newVersionNumber = (currentVersion + 0.1).toFixed(1)
          
          const newVersion: ChatbotVersion = {
            id: `version-${Date.now()}`,
            version: newVersionNumber,
            createdAt: new Date(),
            createdBy: 'current-user',
            isPublished: false,
            changes: 'Configuration updated'
          }
          
          updatedChatbots[index] = {
            ...selectedChatbot,
            ...formData,
            updatedAt: new Date(),
            currentVersion: newVersionNumber,
            versions: [...selectedChatbot.versions, newVersion]
          } as Chatbot
        }
      } else {
        // Create new
        const newChatbot: Chatbot = {
          id: `chatbot-${Date.now()}`,
          name: formData.name || '',
          website: formData.website || '',
          description: formData.description || '',
          apiEndpoint: formData.apiEndpoint || '',
          apiAuthType: formData.apiAuthType || 'none',
          apiAuthValue: formData.apiAuthValue || '',
          logo: formData.logo || '',
          primaryColor: formData.primaryColor || '#3b82f6',
          fontFamily: formData.fontFamily || 'Inter',
          fontSize: formData.fontSize || '14px',
          fontColor: formData.fontColor || '#000000',
          borderColor: formData.borderColor || '#e5e7eb',
          borderWidth: formData.borderWidth || '1px',
          borderRadius: formData.borderRadius || '8px',
          messageBoxColor: formData.messageBoxColor || '#ffffff',
          shadowColor: formData.shadowColor || '#000000',
          shadowBlur: formData.shadowBlur || '4px',
          conversationOpener: formData.conversationOpener || 'Hello! How can I help you today?',
          followUpQuestions: formData.followUpQuestions || [],
          enableFileUpload: formData.enableFileUpload || false,
          showCitations: formData.showCitations !== undefined ? formData.showCitations : true,
          deploymentType: (formData.deploymentType || 'popover') as 'popover' | 'fullpage' | 'popup-center',
          widgetAvatarStyle: (formData.widgetAvatarStyle || 'circle') as 'circle' | 'square' | 'circle-with-label',
          widgetPosition: (formData.widgetPosition || 'bottom-right') as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center',
          widgetSize: formData.widgetSize || '60px',
          widgetBackgroundColor: formData.widgetBackgroundColor || '#3b82f6',
          widgetBorderColor: formData.widgetBorderColor || '#ffffff',
          widgetBorderWidth: formData.widgetBorderWidth || '2px',
          widgetBorderRadius: formData.widgetBorderRadius || '50%',
          widgetShadowColor: formData.widgetShadowColor || '#000000',
          widgetShadowBlur: formData.widgetShadowBlur || '8px',
          widgetLabelText: formData.widgetLabelText || 'Chat',
          widgetLabelColor: formData.widgetLabelColor || '#ffffff',
          widgetAnimation: (formData.widgetAnimation || 'fade') as 'none' | 'fade' | 'slide' | 'bounce',
          widgetAutoShow: formData.widgetAutoShow !== undefined ? formData.widgetAutoShow : true,
          widgetAutoShowDelay: formData.widgetAutoShowDelay || 0,
          widgetOffsetX: formData.widgetOffsetX || '20px',
          widgetOffsetY: formData.widgetOffsetY || '20px',
          widgetZIndex: formData.widgetZIndex || 9999,
          showNotificationBadge: formData.showNotificationBadge || false,
          notificationBadgeColor: formData.notificationBadgeColor || '#ef4444',
          chatWindowWidth: formData.chatWindowWidth || '380px',
          chatWindowHeight: formData.chatWindowHeight || '600px',
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          versions: [{
            id: `version-${Date.now()}`,
            version: formData.currentVersion || '1.0.0',
            createdAt: new Date(),
            createdBy: 'current-user',
            isPublished: false
          }],
          currentVersion: formData.currentVersion || '1.0.0'
        }
        updatedChatbots.push(newChatbot)
      }
      
      // Save to localStorage (replace with API call when database is ready)
      localStorage.setItem('ai-chatbots', JSON.stringify(updatedChatbots))
      setChatbots(updatedChatbots)
      
      toast.success(selectedChatbot ? 'Chatbot updated successfully' : 'Chatbot created successfully')
      setShowCreateDialog(false)
      setShowEditDialog(false)
      setSelectedChatbot(null)
    } catch (error) {
      console.error('Error saving chatbot:', error)
      toast.error('Failed to save chatbot')
    }
  }

  const handlePublish = async (chatbot: Chatbot) => {
    try {
      const updatedChatbots = chatbots.map(c => {
        if (c.id === chatbot.id) {
          const newVersion: ChatbotVersion = {
            id: `version-${Date.now()}`,
            version: chatbot.currentVersion,
            createdAt: new Date(),
            createdBy: 'current-user',
            isPublished: true
          }
          return {
            ...c,
            isPublished: true,
            versions: [...c.versions, newVersion],
            updatedAt: new Date()
          }
        }
        return c
      })
      
      localStorage.setItem('ai-chatbots', JSON.stringify(updatedChatbots))
      setChatbots(updatedChatbots)
      
      toast.success('Chatbot published successfully')
    } catch (error) {
      console.error('Error publishing chatbot:', error)
      toast.error('Failed to publish chatbot')
    }
  }

  const handleDelete = async (chatbotId: string) => {
    if (!confirm('Are you sure you want to delete this chatbot?')) return

    try {
      const updatedChatbots = chatbots.filter(c => c.id !== chatbotId)
      localStorage.setItem('ai-chatbots', JSON.stringify(updatedChatbots))
      setChatbots(updatedChatbots)
      toast.success('Chatbot deleted successfully')
    } catch (error) {
      console.error('Error deleting chatbot:', error)
      toast.error('Failed to delete chatbot')
    }
  }

  const generateEmbedCode = (chatbot: Chatbot) => {
    const type = chatbot.deploymentType || 'popover'
    const src = `${window.location.origin}/chat/embed?id=${chatbot.id}&type=${type}`
    // Return a JS snippet that appends the loader script
    return `<script>(function(){var s=document.createElement('script');s.src='${src}';s.async=true;document.head.appendChild(s);})();</script>`
  }

  const toggleWebsite = (website: string) => {
    const newExpanded = new Set(expandedWebsites)
    if (newExpanded.has(website)) {
      newExpanded.delete(website)
    } else {
      newExpanded.add(website)
    }
    setExpandedWebsites(newExpanded)
  }

  const filteredChatbots = selectedWebsite === 'all' 
    ? chatbots 
    : chatbots.filter(c => c.website === selectedWebsite)

  const chatbotsByWebsite = filteredChatbots.reduce((acc, chatbot) => {
    const website = chatbot.website || 'Uncategorized'
    if (!acc[website]) {
      acc[website] = []
    }
    acc[website].push(chatbot)
    return acc
  }, {} as Record<string, Chatbot[]>)

  const addFollowUpQuestion = () => {
    if (newFollowUpQuestion.trim()) {
      setFormData({
        ...formData,
        followUpQuestions: [...(formData.followUpQuestions || []), newFollowUpQuestion.trim()]
      })
      setNewFollowUpQuestion('')
    }
  }

  const removeFollowUpQuestion = (index: number) => {
    const updated = [...(formData.followUpQuestions || [])]
    updated.splice(index, 1)
    setFormData({
      ...formData,
      followUpQuestions: updated
    })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
      
        {!(showCreateDialog || showEditDialog) && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Chatbot
          </Button>
        )}
      </div>

      {/* List Page: hidden when editing/creating */}
      {!(showCreateDialog || showEditDialog) && (
        <>
          <div className="flex items-center gap-4">
            <Label>Filter by Website:</Label>
            <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Websites</SelectItem>
                {websites.map(website => (
                  <SelectItem key={website} value={website}>{website}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading chatbots...</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(chatbotsByWebsite).map(([website, websiteChatbots]) => (
                <Card key={website}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWebsite(website)}
                        >
                          {expandedWebsites.has(website) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Globe className="h-4 w-4" />
                        <CardTitle>{website}</CardTitle>
                        <Badge variant="secondary">{websiteChatbots.length}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  {expandedWebsites.has(website) && (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {websiteChatbots.map(chatbot => (
                          <Card 
                            key={chatbot.id} 
                            className="relative cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={() => handleEdit(chatbot)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(chatbot) }}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg">{chatbot.name}</CardTitle>
                                  <CardDescription>{chatbot.description || 'No description'}</CardDescription>
                                </div>
                                <Badge variant={chatbot.isPublished ? 'default' : 'secondary'}>
                                  {chatbot.isPublished ? 'Published' : 'Draft'}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{chatbot.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <GitBranch className="h-4 w-4" />
                                  <span>v{chatbot.currentVersion}</span>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedChatbot(chatbot)
                                    setShowPreviewDialog(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleEdit(chatbot) }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handlePublish(chatbot) }}
                                  disabled={chatbot.isPublished}
                                >
                                  <Rocket className="h-4 w-4 mr-2" />
                                  Publish
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedChatbot(chatbot)
                                    setShowVersionDialog(true)
                                  }}
                                >
                                  <History className="h-4 w-4 mr-2" />
                                  Versions
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(chatbot.id) }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
              {filteredChatbots.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No chatbots found. Create your first chatbot to get started.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Inline Page Section */}
      {(showCreateDialog || showEditDialog) && (
        <div className="space-y-4">
          {/* Chatbot header preview (avatar + name + description) */}
          <div className="flex items-start gap-4">
            {/* Avatar/Icon preview */}
            {(() => {
              const avatarType = (formData.avatarType || 'icon') as 'icon' | 'image'
              if (avatarType === 'image' && formData.avatarImageUrl) {
                return (
                  <img
                    src={formData.avatarImageUrl}
                    alt={formData.name || 'Avatar'}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                )
              }
              const IconName = (formData.avatarIcon || 'Bot') as string
              const IconComponent = (LucideIcons as any)[IconName] || LucideIcons.Bot
              const iconColor = formData.avatarIconColor || '#ffffff'
              const bgColor = formData.avatarBackgroundColor || formData.primaryColor || '#3b82f6'
              return (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: bgColor as string }}
                >
                  <IconComponent className="h-6 w-6" style={{ color: iconColor as string }} />
                </div>
              )
            })()}

            <div className="flex-1 min-w-0">
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Agent name"
                className="text-2xl font-bold h-auto py-0 border-none shadow-none focus-visible:ring-0 px-0"
              />
              {formData.description ? (
                <p className="text-sm text-muted-foreground mt-1 truncate">{formData.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1 italic">No description</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="min-h-[800px]">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="w-full flex justify-start gap-2">
              <TabsTrigger value="engine">
                <Settings className="h-4 w-4 mr-2" />
                Engine
              </TabsTrigger>
              <TabsTrigger value="style">
                <Palette className="h-4 w-4 mr-2" />
                Style
              </TabsTrigger>
              <TabsTrigger value="config">
                <Layout className="h-4 w-4 mr-2" />
                Config
              </TabsTrigger>
              <TabsTrigger value="deployment">
                <Rocket className="h-4 w-4 mr-2" />
                Deployment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="engine" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Chatbot Name"
                />
              </div>

              <div className="space-y-2">
                <Label>Website *</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the chatbot"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>API Endpoint *</Label>
                <Input
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                  placeholder="https://api.example.com/chat"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>API Authentication Type</Label>
                  <Select
                    value={formData.apiAuthType}
                    onValueChange={(v: any) => setFormData({ ...formData, apiAuthType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="custom">Custom Header</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.apiAuthType !== 'none' && (
                  <div className="space-y-2">
                    <Label>Authentication Value</Label>
                    <Input
                      type="password"
                      value={formData.apiAuthValue}
                      onChange={(e) => setFormData({ ...formData, apiAuthValue: e.target.value })}
                      placeholder="Enter auth value"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-6 pt-4">
              <StyleTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="config" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Conversation Opener</Label>
                <Textarea
                  value={formData.conversationOpener}
                  onChange={(e) => setFormData({ ...formData, conversationOpener: e.target.value })}
                  placeholder="Hello! How can I help you today?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Follow-up Questions</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFollowUpQuestion}
                    onChange={(e) => setNewFollowUpQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFollowUpQuestion()}
                    placeholder="Enter a follow-up question"
                  />
                  <Button onClick={addFollowUpQuestion}>Add</Button>
                </div>
                <div className="space-y-2 mt-2">
                  {(formData.followUpQuestions || []).map((question, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1">{question}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFollowUpQuestion(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable File Upload</Label>
                  <Switch
                    checked={formData.enableFileUpload}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableFileUpload: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Citations and Attributions</Label>
                  <Switch
                    checked={formData.showCitations}
                    onCheckedChange={(checked) => setFormData({ ...formData, showCitations: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deployment" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Deployment Type</Label>
                <Select
                  value={formData.deploymentType}
                  onValueChange={(v: any) => setFormData({ ...formData, deploymentType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popover">Popover Chat (Facebook Messenger style)</SelectItem>
                    <SelectItem value="popup-center">Popup Center Dialog Modal</SelectItem>
                    <SelectItem value="fullpage">Full Page (New Link)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Embed Code</Label>
                <div className="flex gap-2">
                  <Textarea
                    readOnly
                    rows={8}
                    className="bg-muted border-0 resize-none font-mono text-xs"
                    value={(() => {
                      const chatbotId = selectedChatbot?.id || 'new-chatbot-id'
                      const chatbot = { ...formData, id: chatbotId, deploymentType: formData.deploymentType || 'popover' } as Chatbot
                      return generateEmbedCode(chatbot)
                    })()}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const chatbotId = selectedChatbot?.id || 'new-chatbot-id'
                      const chatbot = { ...formData, id: chatbotId, deploymentType: formData.deploymentType || 'popover' } as Chatbot
                      const code = generateEmbedCode(chatbot)
                      navigator.clipboard.writeText(code)
                      toast.success('Embed code copied to clipboard')
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Copy this code and paste it into your website HTML to embed the chatbot.
                </p>
              </div>
            </TabsContent>
          </Tabs>
            </div>
            <div className="min-h-[800px] border rounded-lg overflow-hidden" style={{ borderColor: formData.borderColor }}>
              <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: formData.borderColor }}>
                <div className="text-sm font-medium">Emulator</div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Preview as</Label>
                  <Select value={previewMode} onValueChange={(v: any) => setPreviewMode(v)}>
                    <SelectTrigger className="h-8 w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popover">Popover</SelectItem>
                      <SelectItem value="popup-center">Popup Center</SelectItem>
                      <SelectItem value="fullpage">Full Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedChatbot?.id ? (
                <iframe
                  ref={emulatorRef}
                  src={`/chat/${selectedChatbot.id}`}
                  className="w-full h-[760px] border-0"
                  title="Chat Emulator"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground p-6 text-sm">
                  Save the chatbot first to enable the live emulator preview here.
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons at bottom */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateDialog(false)
                setShowEditDialog(false)
                setSelectedChatbot(null)
              }}
            >
              ← Back to list
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setShowEditDialog(false)
                  setSelectedChatbot(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

    {/* Realtime style update to emulator */}
    {selectedChatbot?.id && (
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              // noop - placeholder to ensure Next includes this node; logic is in useEffect.
            })();
          `,
        }}
      />
    )}

      {/* Name Prompt Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Chatbot</DialogTitle>
            <DialogDescription>Enter a name to create your chatbot.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Chatbot Name *</Label>
            <Input
              value={newChatbotName}
              onChange={(e) => setNewChatbotName(e.target.value)}
              placeholder="My Chatbot"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const name = newChatbotName.trim()
                if (!name) {
                  toast.error('Please enter a chatbot name')
                  return
                }
                setShowNameDialog(false)
                startCreateWithName(name)
                setFormData((prev) => ({ ...prev, name }))
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <PreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        selectedChatbot={selectedChatbot}
        onPublish={handlePublish}
      />

      {/* Version Control Dialog */}
      <VersionHistoryDialog
        open={showVersionDialog}
        onOpenChange={setShowVersionDialog}
        selectedChatbot={selectedChatbot}
      />
    </div>
  )
}

