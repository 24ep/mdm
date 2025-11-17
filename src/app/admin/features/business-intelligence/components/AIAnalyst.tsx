'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { MarkdownRenderer } from '@/components/knowledge-base/MarkdownRenderer'
import {
  Bot,
  Send,
  Download,
  BarChart3,
  Table,
  Image,
  FileText,
  RefreshCw,
  Copy,
  Trash2,
  Settings,
  Sparkles,
  TrendingUp,
  PieChart,
  LineChart,
  Activity,
  Database,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  MessageSquare,
  Lock,
  Users,
  User,
  Clock,
  Menu,
  X,
  Edit2,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  analysis?: {
    type: 'chart' | 'table' | 'text' | 'image'
    data?: any
    visualization?: any
  }
}

interface AnalysisResult {
  id: string
  title: string
  type: 'chart' | 'table' | 'text' | 'image'
  data: any
  visualization?: any
  insights: string[]
  exportable: boolean
}

interface ChatSession {
  id: string
  title: string
  description?: string
  isPrivate: boolean
  userId: string
  spaceId?: string
  modelId?: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export function AIAnalyst() {
  // Authentication
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // View state - either 'sessions' or 'chat'
  const [currentView, setCurrentView] = useState<'sessions' | 'chat'>('sessions')
  
  // Sidebar state (Open WebUI style)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const [spaces, setSpaces] = useState<any[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [selectedExport, setSelectedExport] = useState<AnalysisResult | null>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [configuredProviders, setConfiguredProviders] = useState<any[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string>('')
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [newChatIsPrivate, setNewChatIsPrivate] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [showReportDrawer, setShowReportDrawer] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Error and loading states
  const [error, setError] = useState<string | null>(null)
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowNewChatDialog(true)
      }
      
      // Ctrl/Cmd + K for clear chat (when in chat view)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && currentView === 'chat') {
        e.preventDefault()
        clearChat()
      }
      
      // Escape to go back to sessions
      if (e.key === 'Escape' && currentView === 'chat') {
        e.preventDefault()
        backToSessions()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentView])

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (!session) return
    
    loadSpaces()
    loadModels()
    loadConfiguredProviders()
    loadChatSessions()
    loadCurrentUser()
    if (currentView === 'chat') {
      scrollToBottom()
    }
  }, [messages, currentView, session])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadSpaces = async () => {
    setIsLoadingSpaces(true)
    setError(null)
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
        if (data.spaces?.length > 0) {
          setSelectedSpace(data.spaces[0].id)
        }
      } else if (response.status === 401) {
        toast.error('Please sign in to view spaces')
        router.push('/auth/signin')
      } else {
        throw new Error('Failed to load spaces')
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
      setError('Failed to load spaces. Please try again.')
      toast.error('Failed to load spaces')
    } finally {
      setIsLoadingSpaces(false)
    }
  }

  const loadModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch('/api/admin/ai-models')
      if (response.ok) {
        const data = await response.json()
        setAvailableModels(data.models || [])
        // Set default model if none selected
        if (!selectedModel && data.models?.length > 0) {
          setSelectedModel(data.models[0].id)
        }
      } else if (response.status === 401) {
        toast.error('Please sign in to view AI models')
        router.push('/auth/signin')
      } else {
        throw new Error('Failed to load AI models')
      }
    } catch (error) {
      console.error('Error loading AI models:', error)
      toast.error('Failed to load AI models')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const loadConfiguredProviders = async () => {
    try {
      const response = await fetch('/api/admin/ai-providers')
      if (response.ok) {
        const data = await response.json()
        setConfiguredProviders(data.providers?.filter((p: any) => p.isConfigured) || [])
      }
    } catch (error) {
      console.error('Error loading configured providers:', error)
    }
  }

  const loadChatSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const response = await fetch('/api/admin/chat-sessions')
      if (response.ok) {
        const data = await response.json()
        setChatSessions(data.sessions || [])
      } else if (response.status === 401) {
        toast.error('Please sign in to view chat sessions')
        router.push('/auth/signin')
      } else {
        throw new Error('Failed to load chat sessions')
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
      toast.error('Failed to load chat sessions')
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const switchToChat = (chatId: string) => {
    const chat = chatSessions.find(c => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages || [])
      setCurrentView('chat')
    }
  }

  const backToSessions = () => {
    setCurrentView('sessions')
    setCurrentChatId('')
    setMessages([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'ve analyzed your request. Let me help you with that.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    }, 1000)
  }

  const clearChat = () => {
    if (messages.length === 0) {
      toast('Chat is already empty')
      return
    }
    
    if (confirm('Are you sure you want to clear the chat? This action cannot be undone.')) {
      setMessages([])
      setAnalysisResults([])
      setReportData(null)
      toast.success('Chat cleared successfully')
    }
  }

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }


  const performAIAnalysis = async (query: string, spaceId: string, modelId: string): Promise<any> => {
    // Check if we have configured providers
    if (configuredProviders.length === 0) {
      return {
        response: 'No AI providers are configured. Please configure at least one AI provider in the Integrations section to use AI features.',
        title: 'Configuration Required',
        analysis: null,
        insights: ['Configure AI providers in Admin → Integrations → AI Configuration']
      }
    }

    // Check if selected model is available
    const selectedModelData = availableModels.find(m => m.id === modelId)
    if (!selectedModelData) {
      return {
        response: 'Selected AI model is not available. Please select a different model.',
        title: 'Model Not Available',
        analysis: null,
        insights: ['Select a different AI model from the dropdown']
      }
    }

    try {
      // Call the AI analysis API
      const response = await fetch('/api/admin/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          spaceId,
          modelId,
          model: selectedModelData
        })
      })

      if (response.ok) {
        return await response.json()
      } else {
        const error = await response.json()
        return {
          response: `AI analysis failed: ${error.error || 'Unknown error'}`,
          title: 'Analysis Error',
          analysis: null,
          insights: ['Check AI provider configuration', 'Verify API keys are valid']
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      return {
        response: 'Failed to connect to AI service. Please check your configuration.',
        title: 'Connection Error',
        analysis: null,
        insights: ['Check AI provider configuration', 'Verify network connection']
      }
    }
  }





  const createNewChat = async () => {
    if (!newChatTitle.trim()) {
      toast.error('Please enter a chat title')
      return
    }

    try {
      const response = await fetch('/api/admin/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newChatTitle.trim(),
          isPrivate: newChatIsPrivate,
          spaceId: selectedSpace,
          modelId: selectedModel
        })
      })

      if (response.ok) {
        const data = await response.json()
        setChatSessions(prev => [data.session, ...prev])
        setCurrentChatId(data.session.id)
        setMessages([])
        setAnalysisResults([])
        setShowNewChatDialog(false)
        setNewChatTitle('')
        setNewChatIsPrivate(false)
        setCurrentView('chat')
        toast.success('New chat created successfully')
      } else if (response.status === 401) {
        toast.error('Please sign in to create chat sessions')
        router.push('/auth/signin')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create chat')
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      toast.error('Failed to create chat')
    }
  }



  const generateReport = async (messages: Message[], analysisResults: AnalysisResult[]) => {
    setIsGeneratingReport(true)
    try {
      // Generate report based on conversation and analysis results
      const report = {
        id: Date.now().toString(),
        title: `Analysis Report - ${new Date().toLocaleDateString()}`,
        generatedAt: new Date(),
        summary: {
          totalMessages: messages.length,
          totalAnalysis: analysisResults.length,
          keyInsights: analysisResults.flatMap(r => r.insights).slice(0, 5),
          dataTypes: Array.from(new Set(analysisResults.map(r => r.type))),
          spaceId: selectedSpace,
          modelUsed: availableModels.find(m => m.id === selectedModel)?.name || 'Unknown'
        },
        conversation: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          hasAnalysis: !!msg.analysis
        })),
        analysis: analysisResults.map(result => ({
          id: result.id,
          title: result.title,
          type: result.type,
          insights: result.insights,
          exportable: result.exportable
        })),
        recommendations: generateRecommendations(analysisResults),
        charts: analysisResults.filter(r => r.type === 'chart').map(r => r.data),
        tables: analysisResults.filter(r => r.type === 'table').map(r => r.data)
      }
      
      setReportData(report)
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const generateRecommendations = (results: AnalysisResult[]) => {
    const recommendations = []
    
    if (results.some(r => r.type === 'chart')) {
      recommendations.push({
        type: 'visualization',
        title: 'Data Visualization',
        description: 'Consider creating more visualizations to better understand data patterns',
        priority: 'medium'
      })
    }
    
    if (results.some(r => r.type === 'table')) {
      recommendations.push({
        type: 'data_quality',
        title: 'Data Quality Review',
        description: 'Review data quality and completeness based on table analysis',
        priority: 'high'
      })
    }
    
    if (results.length > 3) {
      recommendations.push({
        type: 'automation',
        title: 'Automated Analysis',
        description: 'Consider setting up automated analysis workflows for similar data',
        priority: 'low'
      })
    }
    
    return recommendations
  }

  // Auto-generate report when messages or analysis results change
  useEffect(() => {
    if (messages.length > 1 || analysisResults.length > 0) {
      generateReport(messages, analysisResults)
    }
  }, [messages, analysisResults])

  const exportReport = (report: any) => {
    try {
      const reportContent = {
        title: report.title,
        generatedAt: report.generatedAt,
        summary: report.summary,
        conversation: report.conversation,
        analysis: report.analysis,
        recommendations: report.recommendations,
        charts: report.charts,
        tables: report.tables
      }

      const content = JSON.stringify(reportContent, null, 2)
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Report exported successfully')
    } catch (error) {
      toast.error('Export failed. Please try again.')
    }
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading AI Analyst...</p>
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Open WebUI Style */}
        <div 
          className={cn(
            "bg-card border-r border-border transition-all duration-300 flex flex-col",
            sidebarOpen ? "w-[280px]" : "w-0 overflow-hidden"
          )}
        >
          {sidebarOpen && (
            <>
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Chats</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewChatDialog(true)}
                    className="h-8 w-8 p-0 hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-8 text-xs bg-muted border-border text-foreground" disabled={isLoadingModels}>
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {availableModels.map(model => (
                        <SelectItem key={model.id} value={model.id} className="text-foreground">
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Chat Sessions List */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {chatSessions.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No chats yet</p>
                    </div>
                  ) : (
                    chatSessions.map(chat => (
                      <button
                        key={chat.id}
                        onClick={() => switchToChat(chat.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          "hover:bg-muted/50",
                          currentChatId === chat.id && "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-foreground">{chat.title}</span>
                        </div>
                        {chat.messages?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {chat.messages[chat.messages.length - 1]?.content.substring(0, 30)}...
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Bar */}
          <div className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">AI Analyst</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentView === 'chat' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReportDrawer(!showReportDrawer)}
                    className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                <SelectTrigger className="h-8 w-32 text-xs bg-muted border-border text-foreground" disabled={isLoadingSpaces}>
                  <SelectValue placeholder="Space" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id} className="text-foreground">
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chat Content */}
          {currentView === 'sessions' ? (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center max-w-md">
                <Bot className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to AI Analyst</h3>
                <p className="text-muted-foreground mb-6">Start a new conversation to begin analyzing your data</p>
                <Button 
                  onClick={() => setShowNewChatDialog(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          ) : (
            <ChatView 
              messages={messages}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              messagesEndRef={messagesEndRef}
              textareaRef={textareaRef}
              showReportDrawer={showReportDrawer}
              reportData={reportData}
              isGeneratingReport={isGeneratingReport}
              spaces={spaces}
              analysisResults={analysisResults}
              onExportReport={exportReport}
              selectedExport={selectedExport}
              setSelectedExport={setSelectedExport}
              showExportDialog={showExportDialog}
              setShowExportDialog={setShowExportDialog}
            />
          )}
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
            <DialogDescription>
              Start a new AI analysis conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="chat-title">Chat Title</Label>
              <Input
                id="chat-title"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Enter chat title..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="private-chat"
                checked={newChatIsPrivate}
                onCheckedChange={setNewChatIsPrivate}
              />
              <Label htmlFor="private-chat" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private Chat (only visible to you)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createNewChat} disabled={!newChatTitle.trim()}>
              Create Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Chat Sessions List Component
function ChatSessionsList({ 
  chatSessions, 
  currentUser, 
  onChatSelect, 
  onNewChat,
  isLoading
}: { 
  chatSessions: ChatSession[]
  currentUser: any
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Chat Sessions</h2>
              <p className="text-muted-foreground mt-1">Loading your chat sessions...</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading chat sessions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Chat Sessions</h2>
            <p className="text-muted-foreground mt-1">Select a chat session to continue your analysis</p>
          </div>
          <Button onClick={onNewChat} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {chatSessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No chat sessions yet</h3>
              <p className="text-muted-foreground mb-6">Start your first AI analysis conversation</p>
              <Button onClick={onNewChat} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Create First Chat
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chatSessions.map(chat => (
                <Card 
                  key={chat.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onChatSelect(chat.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{chat.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {chat.description || 'No description'}
                        </CardDescription>
                      </div>
                      {chat.isPrivate && (
                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{chat.messages?.length || 0} messages</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated {new Date(chat.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {chat.spaceId && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Database className="h-4 w-4" />
                          <span>Space: {chat.spaceId}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Chat View Component
function ChatView({ 
  messages, 
  input, 
  setInput, 
  isLoading, 
  onSubmit, 
  messagesEndRef,
  textareaRef,
  showReportDrawer, 
  reportData, 
  isGeneratingReport, 
  spaces, 
  analysisResults, 
  onExportReport, 
  selectedExport, 
  setSelectedExport, 
  showExportDialog, 
  setShowExportDialog 
}: {
  messages: Message[]
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  showReportDrawer: boolean
  reportData: any
  isGeneratingReport: boolean
  spaces: any[]
  analysisResults: AnalysisResult[]
  onExportReport: (report: any) => void
  selectedExport: AnalysisResult | null
  setSelectedExport: (selectedExport: AnalysisResult | null) => void
  showExportDialog: boolean
  setShowExportDialog: (show: boolean) => void
}) {
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && input.trim()) {
        onSubmit(e as any)
      }
    }
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-background">
        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">How can I help you today?</h3>
                <p className="text-muted-foreground mb-8">Start a conversation to analyze your data, create visualizations, or generate insights</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {[
                    "Analyze sales trends",
                    "Create data visualizations",
                    "Generate insights report",
                    "Compare metrics"
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(suggestion)}
                      className="px-4 py-3 text-left text-sm rounded-lg bg-muted/50 hover:bg-muted border border-border text-foreground hover:text-foreground transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-4 group",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 transition-all",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border border-border text-foreground rounded-bl-sm"
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <MarkdownRenderer content={message.content} />
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                      )}
                      {message.analysis && (
                        <div className="mt-4">
                          <AnalysisVisualization analysis={message.analysis} />
                        </div>
                      )}
                      <div className={cn(
                        "text-xs mt-2 opacity-60",
                        message.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-5 w-5 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area - Open WebUI Style */}
        <div className="border-t border-border bg-card px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={onSubmit} className="relative">
              <div className="relative flex items-end gap-2 bg-background rounded-xl border border-border focus-within:border-primary transition-colors">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  className="flex-1 min-h-[52px] max-h-[200px] resize-none bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 text-sm"
                  disabled={isLoading}
                  rows={1}
                />
                <div className="flex items-center gap-2 p-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    size="sm"
                    className="h-9 w-9 p-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Ctrl+K</span>
                  <span>•</span>
                  <span>Clear</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Report Drawer */}
      {showReportDrawer && (
        <div className="w-[400px] border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4" />
                Live Report
              </h3>
              {isGeneratingReport && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time analysis report
            </p>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {reportData ? (
              <div className="space-y-6">
                {/* Report Header */}
                <div className="bg-primary/10 p-4 rounded-lg border border-border">
                  <h4 className="font-semibold text-lg mb-2 text-foreground">{reportData.title}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
                    <p>Space: {spaces.find(s => s.id === reportData.summary.spaceId)?.name || 'Unknown'}</p>
                    <p>Model: {reportData.summary.modelUsed}</p>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{reportData.summary.totalMessages}</div>
                    <div className="text-xs text-muted-foreground">Messages</div>
                  </div>
                  <div className="bg-secondary/10 border border-secondary/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-secondary-foreground">{reportData.summary.totalAnalysis}</div>
                    <div className="text-xs text-muted-foreground">Analyses</div>
                  </div>
                </div>

                {/* Key Insights */}
                {reportData.summary.keyInsights.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Key Insights
                    </h5>
                    <div className="space-y-2">
                      {reportData.summary.keyInsights.map((insight: string, index: number) => (
                        <div key={index} className="bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20 p-3 rounded-lg">
                          <p className="text-sm text-foreground">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis Results */}
                {reportData.analysis.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Analysis Results
                    </h5>
                    <div className="space-y-3">
                      {reportData.analysis.map((result: any, index: number) => (
                        <div key={index} className="bg-muted/50 border border-border p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-sm text-foreground">{result.title}</h6>
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                              {result.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.insights.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {reportData.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Recommendations
                    </h5>
                    <div className="space-y-2">
                      {reportData.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <h6 className="font-medium text-sm text-foreground">{rec.title}</h6>
                            <Badge 
                              variant="outline"
                              className={cn(
                                "text-xs border-border",
                                rec.priority === 'high' ? "text-destructive" : 
                                rec.priority === 'medium' ? "text-[hsl(var(--warning))]" : "text-muted-foreground"
                              )}
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <div className="pt-4 border-t border-border">
                  <Button 
                    onClick={() => onExportReport(reportData)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    variant="default"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No report data available</p>
                <p className="text-sm text-muted-foreground">Start a conversation to generate a report</p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// Analysis Visualization Component
function AnalysisVisualization({ analysis }: { analysis: any }) {
  const { type, data, visualization } = analysis

  if (type === 'chart') {
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Chart Visualization</span>
        </div>
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-2">Sample Chart Data:</div>
          <div className="space-y-2">
            {data.labels.map((label: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-16 text-xs text-foreground">{label}</div>
                <div className="flex-1 bg-muted rounded h-4 relative">
                  <div
                    className="bg-primary h-4 rounded"
                    style={{ width: `${(data.datasets[0].data[idx] / Math.max(...data.datasets[0].data)) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-xs text-right text-foreground">{data.datasets[0].data[idx]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Data Table</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead className="bg-muted/50">
              <tr>
                {data.columns.map((col: string, idx: number) => (
                  <th key={idx} className="px-3 py-2 text-left font-medium text-foreground border-b border-border">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.slice(0, 5).map((row: string[], rowIdx: number) => (
                <tr key={rowIdx} className="border-t border-border">
                  {row.map((cell: string, cellIdx: number) => (
                    <td key={cellIdx} className="px-3 py-2 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.rows.length > 5 && (
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Showing 5 of {data.rows.length} rows
            </div>
          )}
        </div>
      </div>
    )
  }

  if (type === 'text') {
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Analysis Summary</span>
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-foreground">
          <MarkdownRenderer content={data.content} />
        </div>
      </div>
    )
  }

  return null
}
