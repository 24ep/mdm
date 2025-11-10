'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import {
  Plus,
  TableIcon,
  Grid3X3,
  List,
  Settings,
  Palette,
  Layout,
  Rocket,
  TrendingUp,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PreviewDialog } from '../../../components/PreviewDialog'
import { VersionHistoryDialog } from '../../../components/VersionHistoryDialog'
import toast from 'react-hot-toast'
import { Chatbot, ChatbotVersion } from '../../../components/chatbot/types'
import { ChatbotList } from '../../../components/chatbot/ChatbotList'
import { ChatbotEditor } from '../../../components/chatbot/ChatbotEditor'
import { ChatbotHeader } from '../../../components/chatbot/ChatbotHeader'
import { ChatbotEmulator } from '../../../components/chatbot/ChatbotEmulator'
import { NameDialog } from '../../../components/chatbot/NameDialog'
import { ChatbotSearch } from '../../../components/chatbot/ChatbotSearch'
import { ChatbotFilters } from '../../../components/chatbot/ChatbotFilters'
import { DEFAULT_CHATBOT_CONFIG, createDefaultChatbot } from '../../../components/chatbot/constants'
import { generateEmbedCode, createNewVersion, validateChatbot, duplicateChatbot, exportChatbot, importChatbot } from '../../../components/chatbot/utils'
import { isUuid } from '@/lib/validation'

export function AIChatUI() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'list'>('table')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null)
  const [activeTab, setActiveTab] = useState<'engine' | 'style' | 'config' | 'deployment' | 'performance'>('engine')
  const [isLoading, setIsLoading] = useState(false)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [previewMode, setPreviewMode] = useState<'popover' | 'fullpage' | 'popup-center'>('popover')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [deploymentFilter, setDeploymentFilter] = useState<'all' | 'popover' | 'fullpage' | 'popup-center'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'status'>('updated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [formData, setFormData] = useState<Partial<Chatbot>>(DEFAULT_CHATBOT_CONFIG)

  useEffect(() => {
    loadChatbots()
  }, [])

  // Initialize and push preview mode to emulator
  useEffect(() => {
    if (!formData?.deploymentType) return
    setPreviewMode(formData.deploymentType)
  }, [formData?.deploymentType])

  // Generate UUID for migration of old chatbot IDs
  const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const loadChatbots = async () => {
    setIsLoading(true)
    try {
      const saved = localStorage.getItem('ai-chatbots')
      if (saved) {
        const parsed = JSON.parse(saved)
        let needsMigration = false
        const migrated = parsed.map((c: any) => {
          // Migrate old chatbot IDs (chatbot-{timestamp}) to UUIDs
          if (c.id && !isUuid(c.id)) {
            needsMigration = true
            return {
              ...c,
              id: generateUUID(), // Convert old ID to UUID
              engineType: c.engineType || 'custom',
              createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)) : new Date(),
              updatedAt: c.updatedAt ? (c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt)) : new Date(),
              versions: (c.versions || []).map((v: any) => ({
                ...v,
                createdAt: v.createdAt ? (v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt)) : new Date()
              })),
              _savedToDatabase: c._savedToDatabase !== undefined ? c._savedToDatabase : false // Mark migrated chatbots as localStorage-only
            }
          }
          return {
            ...c,
            engineType: c.engineType || 'custom',
            createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)) : new Date(),
            updatedAt: c.updatedAt ? (c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt)) : new Date(),
            versions: (c.versions || []).map((v: any) => ({
              ...v,
              createdAt: v.createdAt ? (v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt)) : new Date()
            })),
            _savedToDatabase: c._savedToDatabase !== undefined ? c._savedToDatabase : false // Ensure flag exists
          }
        })
        
        // Save migrated chatbots back to localStorage if migration occurred
        if (needsMigration) {
          localStorage.setItem('ai-chatbots', JSON.stringify(migrated))
          console.log('Migrated chatbot IDs from old format to UUIDs')
        }
        
        setChatbots(migrated)
      } else {
        const response = await fetch('/api/chatbots')
        if (response.ok) {
          const data = await response.json()
          setChatbots(data.chatbots.map((c: any) => ({
            ...c,
            engineType: c.engineType || 'custom', // Backward compatibility
            createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)) : new Date(),
            updatedAt: c.updatedAt ? (c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt)) : new Date(),
            versions: (c.versions || []).map((v: any) => ({
              ...v,
              createdAt: v.createdAt ? (v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt)) : new Date()
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
    setShowNameDialog(true)
  }

  const startCreateWithName = (name: string) => {
    const base = createDefaultChatbot(name)
    // Mark as localStorage-only draft
    ;(base as any)._savedToDatabase = false

    try {
      const saved = localStorage.getItem('ai-chatbots')
      const existing: Chatbot[] = saved ? JSON.parse(saved) : []
      const updated = [...existing, base]
      localStorage.setItem('ai-chatbots', JSON.stringify(updated))
      setChatbots(updated)
    } catch {}

    setSelectedChatbot(base)
    setFormData({ ...DEFAULT_CHATBOT_CONFIG, name: name })
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
    // Validate form data
    const validation = validateChatbot(formData)
    if (!validation.valid) {
      toast.error(validation.errors.join(', '))
      return
    }

    try {
      // Best Practice: Save to Database (PostgreSQL) as primary storage
      // Database is the source of truth for all saved chatbots
      const chatbotData = {
        name: formData.name || 'Untitled Chatbot',
        website: formData.website || '',
        description: formData.description || null,
        engineType: formData.engineType || 'custom',
        apiEndpoint: formData.apiEndpoint || '',
        apiAuthType: formData.apiAuthType || 'none',
        apiAuthValue: formData.apiAuthValue || null,
        selectedModelId: formData.selectedModelId || null,
        selectedEngineId: formData.selectedEngineId || null,
        chatkitAgentId: formData.chatkitAgentId || null,
        openaiAgentSdkAgentId: (formData as any).openaiAgentSdkAgentId || null,
        openaiAgentSdkApiKey: (formData as any).openaiAgentSdkApiKey || null,
        // For workflows, always use workflow config automatically (per AgentSDK documentation)
        openaiAgentSdkUseWorkflowConfig: (formData as any).openaiAgentSdkAgentId?.startsWith('wf_') ? true : ((formData as any).openaiAgentSdkUseWorkflowConfig !== undefined ? (formData as any).openaiAgentSdkUseWorkflowConfig : null),
        openaiAgentSdkModel: (formData as any).openaiAgentSdkModel || null,
        openaiAgentSdkInstructions: (formData as any).openaiAgentSdkInstructions || null,
        openaiAgentSdkReasoningEffort: (formData as any).openaiAgentSdkReasoningEffort || null,
        openaiAgentSdkStore: (formData as any).openaiAgentSdkStore !== undefined ? (formData as any).openaiAgentSdkStore : null,
        openaiAgentSdkVectorStoreId: (formData as any).openaiAgentSdkVectorStoreId || null,
        openaiAgentSdkEnableWebSearch: (formData as any).openaiAgentSdkEnableWebSearch !== undefined ? (formData as any).openaiAgentSdkEnableWebSearch : null,
        openaiAgentSdkEnableCodeInterpreter: (formData as any).openaiAgentSdkEnableCodeInterpreter !== undefined ? (formData as any).openaiAgentSdkEnableCodeInterpreter : null,
        openaiAgentSdkEnableComputerUse: (formData as any).openaiAgentSdkEnableComputerUse !== undefined ? (formData as any).openaiAgentSdkEnableComputerUse : null,
        openaiAgentSdkEnableImageGeneration: (formData as any).openaiAgentSdkEnableImageGeneration !== undefined ? (formData as any).openaiAgentSdkEnableImageGeneration : null,
        openaiAgentSdkGreeting: (formData as any).openaiAgentSdkGreeting || null,
        openaiAgentSdkPlaceholder: (formData as any).openaiAgentSdkPlaceholder || null,
        openaiAgentSdkBackgroundColor: (formData as any).openaiAgentSdkBackgroundColor || null,
        openaiAgentSdkWorkflowCode: (formData as any).openaiAgentSdkWorkflowCode || null,
        openaiAgentSdkWorkflowFile: (formData as any).openaiAgentSdkWorkflowFile || null,
        openaiAgentSdkRealtimePromptId: (formData as any).openaiAgentSdkRealtimePromptId || null,
        openaiAgentSdkRealtimePromptVersion: (formData as any).openaiAgentSdkRealtimePromptVersion || null,
        openaiAgentSdkGuardrails: (formData as any).openaiAgentSdkGuardrails !== undefined ? (formData as any).openaiAgentSdkGuardrails : null,
        openaiAgentSdkInputGuardrails: (formData as any).openaiAgentSdkInputGuardrails !== undefined ? (formData as any).openaiAgentSdkInputGuardrails : null,
        openaiAgentSdkOutputGuardrails: (formData as any).openaiAgentSdkOutputGuardrails !== undefined ? (formData as any).openaiAgentSdkOutputGuardrails : null,
        logo: formData.logo || null,
        primaryColor: formData.primaryColor || null,
        fontFamily: formData.fontFamily || null,
        fontSize: formData.fontSize || null,
        fontColor: formData.fontColor || null,
        borderColor: formData.borderColor || null,
        borderWidth: formData.borderWidth || null,
        borderRadius: formData.borderRadius || null,
        messageBoxColor: formData.messageBoxColor || null,
        shadowColor: formData.shadowColor || null,
        shadowBlur: formData.shadowBlur || null,
        conversationOpener: formData.conversationOpener || null,
        showStartConversation: (formData as any).showStartConversation !== undefined ? (formData as any).showStartConversation : null,
        startScreenPrompts: (formData as any).startScreenPrompts || null,
        startScreenPromptsPosition: (formData as any).startScreenPromptsPosition || null,
        startScreenPromptsIconDisplay: (formData as any).startScreenPromptsIconDisplay || null,
        startScreenPromptsBackgroundColor: (formData as any).startScreenPromptsBackgroundColor || null,
        startScreenPromptsFontColor: (formData as any).startScreenPromptsFontColor || null,
        startScreenPromptsBorderColor: (formData as any).startScreenPromptsBorderColor || null,
        startScreenPromptsBorderWidth: (formData as any).startScreenPromptsBorderWidth || null,
        startScreenPromptsBorderRadius: (formData as any).startScreenPromptsBorderRadius || null,
        conversationOpenerFontSize: (formData as any).conversationOpenerFontSize || null,
        conversationOpenerFontColor: (formData as any).conversationOpenerFontColor || null,
        conversationOpenerFontFamily: (formData as any).conversationOpenerFontFamily || null,
        conversationOpenerPosition: (formData as any).conversationOpenerPosition || null,
        conversationOpenerAlignment: (formData as any).conversationOpenerAlignment || null,
        conversationOpenerBackgroundColor: (formData as any).conversationOpenerBackgroundColor || null,
        conversationOpenerPadding: (formData as any).conversationOpenerPadding || null,
        conversationOpenerBorderRadius: (formData as any).conversationOpenerBorderRadius || null,
        conversationOpenerFontWeight: (formData as any).conversationOpenerFontWeight || null,
        conversationOpenerLineHeight: (formData as any).conversationOpenerLineHeight || null,
        followUpQuestions: formData.followUpQuestions || [],
        enableFileUpload: formData.enableFileUpload || false,
        showCitations: formData.showCitations !== undefined ? formData.showCitations : true,
        enableVoiceAgent: formData.enableVoiceAgent !== undefined ? formData.enableVoiceAgent : null,
        voiceProvider: formData.voiceProvider || null,
        voiceUIStyle: formData.voiceUIStyle || null,
        deploymentType: formData.deploymentType || 'popover',
        popoverPosition: (formData as any).popoverPosition || 'left',
        widgetPopoverMargin: (formData as any).widgetPopoverMargin || '10px',
        widgetBackgroundBlur: (formData as any).widgetBackgroundBlur !== undefined ? (formData as any).widgetBackgroundBlur : null,
        widgetBackgroundOpacity: (formData as any).widgetBackgroundOpacity !== undefined ? (formData as any).widgetBackgroundOpacity : null,
        chatWindowBackgroundBlur: (formData as any).chatWindowBackgroundBlur !== undefined ? (formData as any).chatWindowBackgroundBlur : null,
        chatWindowBackgroundOpacity: (formData as any).chatWindowBackgroundOpacity !== undefined ? (formData as any).chatWindowBackgroundOpacity : null,
        overlayEnabled: (formData as any).overlayEnabled !== undefined ? (formData as any).overlayEnabled : null,
        overlayColor: (formData as any).overlayColor || null,
        overlayOpacity: (formData as any).overlayOpacity !== undefined ? (formData as any).overlayOpacity : null,
        overlayBlur: (formData as any).overlayBlur !== undefined ? (formData as any).overlayBlur : null,
        typingIndicatorStyle: (formData as any).typingIndicatorStyle || null,
        typingIndicatorColor: (formData as any).typingIndicatorColor || null,
        showThinkingMessage: (formData as any).showThinkingMessage !== undefined ? (formData as any).showThinkingMessage : null,
        thinkingMessageText: (formData as any).thinkingMessageText || null,
        isPublished: formData.isPublished || false,
        currentVersion: formData.currentVersion || '1.0.0',
        spaceId: (formData as any).spaceId || null,
        // Message font styling
        userMessageFontColor: (formData as any).userMessageFontColor || null,
        userMessageFontFamily: (formData as any).userMessageFontFamily || null,
        userMessageFontSize: (formData as any).userMessageFontSize || null,
        botMessageFontColor: (formData as any).botMessageFontColor || null,
        botMessageFontFamily: (formData as any).botMessageFontFamily || null,
        botMessageFontSize: (formData as any).botMessageFontSize || null,
        // Header configuration
        headerTitle: (formData as any).headerTitle || null,
        headerDescription: (formData as any).headerDescription || null,
        headerLogo: (formData as any).headerLogo || null,
        headerBgColor: (formData as any).headerBgColor || null,
        headerFontColor: (formData as any).headerFontColor || null,
        headerFontFamily: (formData as any).headerFontFamily || null,
        headerShowAvatar: (formData as any).headerShowAvatar !== undefined ? (formData as any).headerShowAvatar : null,
        headerAvatarType: (formData as any).headerAvatarType || null,
        headerAvatarIcon: (formData as any).headerAvatarIcon || null,
        headerAvatarIconColor: (formData as any).headerAvatarIconColor || null,
        headerAvatarBackgroundColor: (formData as any).headerAvatarBackgroundColor || null,
        headerAvatarImageUrl: (formData as any).headerAvatarImageUrl || null,
        headerBorderEnabled: (formData as any).headerBorderEnabled !== undefined ? (formData as any).headerBorderEnabled : null,
        headerBorderColor: (formData as any).headerBorderColor || null,
        headerPaddingX: (formData as any).headerPaddingX || null,
        headerPaddingY: (formData as any).headerPaddingY || null,
        headerShowClearSession: (formData as any).headerShowClearSession !== undefined ? (formData as any).headerShowClearSession : null,
        headerShowCloseButton: (formData as any).headerShowCloseButton !== undefined ? (formData as any).headerShowCloseButton : null,
        // Close button position
        closeButtonOffsetX: (formData as any).closeButtonOffsetX || null,
        closeButtonOffsetY: (formData as any).closeButtonOffsetY || null,
        // Send button configuration
        sendButtonWidth: (formData as any).sendButtonWidth || null,
        sendButtonHeight: (formData as any).sendButtonHeight || null,
        sendButtonPosition: (formData as any).sendButtonPosition || null,
      }

      let savedChatbot: Chatbot | null = null

      // Check if chatbot has been saved to database
      const isSavedToDatabase = selectedChatbot && (selectedChatbot as any)._savedToDatabase === true

      if (selectedChatbot && isUuid(selectedChatbot.id)) {
        // If chatbot hasn't been saved to database, try to create it first
        if (!isSavedToDatabase) {
          try {
            const response = await fetch('/api/chatbots', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(chatbotData),
            })

            if (response.ok) {
              const data = await response.json()
              savedChatbot = data.chatbot
              // Mark as saved to database
              if (savedChatbot) {
                ;(savedChatbot as any)._savedToDatabase = true
                toast.success('Chatbot created in database successfully')
                
                // Update localStorage with the database version and flag
                const saved = localStorage.getItem('ai-chatbots')
                const existing: Chatbot[] = saved ? JSON.parse(saved) : []
                // Remove old localStorage entry and add new one
                const filtered = existing.filter(c => c.id !== selectedChatbot.id)
                filtered.push(savedChatbot)
                localStorage.setItem('ai-chatbots', JSON.stringify(filtered))
                setChatbots(filtered)
              }
            } else {
              // If creation fails (e.g., chatbot already exists), try update instead
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
              const errorMessage = errorData.details || errorData.error || `Database create failed (${response.status})`
              console.error('Chatbot creation failed:', {
                status: response.status,
                error: errorData,
                chatbotData: chatbotData
              })
              if (response.status === 409 || errorData.error?.includes('already exists')) {
                // Chatbot might already exist, try update
                throw new Error('TRY_UPDATE')
              } else {
                throw new Error(errorMessage)
              }
            }
          } catch (createError: any) {
            // If error is TRY_UPDATE, fall through to update logic
            if (createError.message === 'TRY_UPDATE') {
              // Continue to update logic below - savedChatbot remains null
            } else {
              // Fallback to localStorage for drafts
              const errorMsg = createError?.message || 'Database create failed'
              console.warn('Database create failed, saving to localStorage:', createError)
              toast.error(`Failed to create chatbot: ${errorMsg}`)
              const newVersion = createNewVersion(selectedChatbot.currentVersion)
              savedChatbot = {
                ...selectedChatbot,
                ...formData,
                chatkitOptions: formData.chatkitOptions || selectedChatbot.chatkitOptions,
                updatedAt: new Date(),
                currentVersion: newVersion.version,
                versions: [...selectedChatbot.versions, newVersion],
                _savedToDatabase: false // Mark as localStorage-only draft
              } as Chatbot
              
              // Save to localStorage as draft
              try {
              const saved = localStorage.getItem('ai-chatbots')
              const existing: Chatbot[] = saved ? JSON.parse(saved) : []
              const index = existing.findIndex(c => c.id === selectedChatbot.id)
              if (index >= 0) {
                existing[index] = savedChatbot
              } else {
                existing.push(savedChatbot)
              }
              localStorage.setItem('ai-chatbots', JSON.stringify(existing))
              setChatbots(existing)
                setSelectedChatbot(savedChatbot)
                toast.success(`Saved as draft (localStorage)`, { duration: 3000 })
                console.log('Chatbot saved to localStorage successfully')
              } catch (localStorageError: any) {
                console.error('Failed to save to localStorage:', localStorageError)
                toast.error(`Failed to save to localStorage: ${localStorageError?.message || 'Unknown error'}`, { duration: 5000 })
              }
            }
          }
        }

        // Update existing chatbot in database (if it exists in DB or create failed with TRY_UPDATE)
        if (isSavedToDatabase || (selectedChatbot && isUuid(selectedChatbot.id) && savedChatbot === null)) {
          try {
            const response = await fetch(`/api/chatbots/${selectedChatbot.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(chatbotData),
            })

            if (response.ok) {
              const data = await response.json()
              savedChatbot = data.chatbot
              // Mark as saved to database
              if (savedChatbot) {
                ;(savedChatbot as any)._savedToDatabase = true
                toast.success('Chatbot saved to database successfully')
                
                // Update localStorage with the database version and flag
                const saved = localStorage.getItem('ai-chatbots')
                const existing: Chatbot[] = saved ? JSON.parse(saved) : []
                const index = existing.findIndex(c => c.id === savedChatbot!.id)
                if (index >= 0) {
                  existing[index] = savedChatbot
                } else {
                  existing.push(savedChatbot)
                }
                localStorage.setItem('ai-chatbots', JSON.stringify(existing))
                setChatbots(existing)
              }
            } else {
              // Database save failed - get error details
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
              const errorMessage = errorData.error || `Database save failed (${response.status})`
              throw new Error(errorMessage)
            }
          } catch (dbError: any) {
            // Fallback to localStorage for drafts
            const errorMsg = dbError?.message || 'Database save failed'
            console.warn('Database save failed, saving to localStorage:', dbError)
            const newVersion = createNewVersion(selectedChatbot.currentVersion)
            savedChatbot = {
              ...selectedChatbot,
              ...formData,
              chatkitOptions: formData.chatkitOptions || selectedChatbot.chatkitOptions,
              updatedAt: new Date(),
              currentVersion: newVersion.version,
              versions: [...selectedChatbot.versions, newVersion],
              _savedToDatabase: false // Mark as localStorage-only draft
            } as Chatbot
            
            // Save to localStorage as draft
            try {
            const saved = localStorage.getItem('ai-chatbots')
            const existing: Chatbot[] = saved ? JSON.parse(saved) : []
            const index = existing.findIndex(c => c.id === selectedChatbot.id)
            if (index >= 0) {
              existing[index] = savedChatbot
            } else {
              existing.push(savedChatbot)
            }
            localStorage.setItem('ai-chatbots', JSON.stringify(existing))
            setChatbots(existing)
              setSelectedChatbot(savedChatbot)
              toast.success(`Saved as draft (localStorage)`, { duration: 3000 })
              console.log('Chatbot saved to localStorage successfully')
            } catch (localStorageError: any) {
              console.error('Failed to save to localStorage:', localStorageError)
              toast.error(`Failed to save to localStorage: ${localStorageError?.message || 'Unknown error'}`, { duration: 5000 })
            }
          }
        }
      } else {
        // Create new chatbot - try database first
        try {
          const response = await fetch('/api/chatbots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatbotData),
          })

          if (response.ok) {
            const data = await response.json()
            savedChatbot = data.chatbot
            // Mark as saved to database
            if (savedChatbot) {
              ;(savedChatbot as any)._savedToDatabase = true
              toast.success('Chatbot created in database successfully')
              
              // Update localStorage with the database version and flag
              const saved = localStorage.getItem('ai-chatbots')
              const existing: Chatbot[] = saved ? JSON.parse(saved) : []
              const index = existing.findIndex(c => c.id === savedChatbot!.id)
              if (index >= 0) {
                existing[index] = savedChatbot
              } else {
                existing.push(savedChatbot)
              }
              localStorage.setItem('ai-chatbots', JSON.stringify(existing))
              setChatbots(existing)
            }
          } else {
            // Database create failed - get error details
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            const errorMessage = errorData.error || `Database create failed (${response.status})`
            throw new Error(errorMessage)
          }
        } catch (dbError: any) {
          // Fallback to localStorage for drafts
          const errorMsg = dbError?.message || 'Database create failed'
          console.warn('Database create failed, saving to localStorage:', dbError)
          const newChatbot = createDefaultChatbot(formData.name || 'Untitled Chatbot')
          Object.assign(newChatbot, formData)
          ;(newChatbot as any)._savedToDatabase = false // Mark as localStorage-only draft
          savedChatbot = newChatbot as Chatbot
          
          // Save to localStorage as draft
          const saved = localStorage.getItem('ai-chatbots')
          const existing: Chatbot[] = saved ? JSON.parse(saved) : []
          existing.push(savedChatbot)
          localStorage.setItem('ai-chatbots', JSON.stringify(existing))
          setChatbots(existing)
          toast.error(`Created as draft (localStorage): ${errorMsg}`, { duration: 5000 })
        }
      }

      // Update selectedChatbot and formData
      if (savedChatbot !== null) {
        setSelectedChatbot(savedChatbot)
        // Merge saved chatbot with current formData to preserve all AgentSDK and other config fields
        // The database response might not include all fields (especially AgentSDK config stored in versions)
        // We spread formData last so it preserves all the user's input values
        setFormData({
          ...savedChatbot,
          ...formData, // Preserve current formData values (especially AgentSDK fields) - this overwrites savedChatbot fields
          // Ensure essential saved fields are preserved
          id: savedChatbot.id,
          updatedAt: savedChatbot.updatedAt,
          createdAt: savedChatbot.createdAt,
        } as Partial<Chatbot>)
      }
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

  const handleDuplicate = (chatbot: Chatbot) => {
    const duplicated = duplicateChatbot(chatbot)
    try {
      const saved = localStorage.getItem('ai-chatbots')
      const existing: Chatbot[] = saved ? JSON.parse(saved) : []
      const updated = [...existing, duplicated]
      localStorage.setItem('ai-chatbots', JSON.stringify(updated))
      setChatbots(updated)
      toast.success('Chatbot duplicated successfully')
    } catch (error) {
      console.error('Error duplicating chatbot:', error)
      toast.error('Failed to duplicate chatbot')
    }
  }

  const handleExport = (chatbot: Chatbot) => {
    try {
      exportChatbot(chatbot)
      toast.success('Chatbot exported successfully')
    } catch (error) {
      console.error('Error exporting chatbot:', error)
      toast.error('Failed to export chatbot')
    }
  }

  const handleImport = async (file: File) => {
    try {
      const imported = await importChatbot(file)
      const saved = localStorage.getItem('ai-chatbots')
      const existing: Chatbot[] = saved ? JSON.parse(saved) : []
      const updated = [...existing, imported]
      localStorage.setItem('ai-chatbots', JSON.stringify(updated))
      setChatbots(updated)
      toast.success('Chatbot imported successfully')
    } catch (error) {
      console.error('Error importing chatbot:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import chatbot')
    }
  }

  // Filter and sort chatbots
  const filteredAndSortedChatbots = chatbots
    .filter(chatbot => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = (
          chatbot.name.toLowerCase().includes(query) ||
          (chatbot.description || '').toLowerCase().includes(query) ||
          (chatbot.website || '').toLowerCase().includes(query)
        )
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'published' && !chatbot.isPublished) return false
        if (statusFilter === 'draft' && chatbot.isPublished) return false
      }
      
      // Deployment filter
      if (deploymentFilter !== 'all') {
        if (chatbot.deploymentType !== deploymentFilter) return false
      }
      
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'created':
          const aCreated = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0)
          const bCreated = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0)
          const aCreatedTime = isNaN(aCreated.getTime()) ? 0 : aCreated.getTime()
          const bCreatedTime = isNaN(bCreated.getTime()) ? 0 : bCreated.getTime()
          comparison = aCreatedTime - bCreatedTime
          break
        case 'updated':
          const aUpdated = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt || 0)
          const bUpdated = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt || 0)
          const aUpdatedTime = isNaN(aUpdated.getTime()) ? 0 : aUpdated.getTime()
          const bUpdatedTime = isNaN(bUpdated.getTime()) ? 0 : bUpdated.getTime()
          comparison = aUpdatedTime - bUpdatedTime
          break
        case 'status':
          comparison = (a.isPublished ? 1 : 0) - (b.isPublished ? 1 : 0)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  return (
    <div className="p-6 space-y-2">
      <div className="flex items-center justify-between">
        {!(showCreateDialog || showEditDialog) && (
          <>
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Table
              </Button>
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="h-8"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Card
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8"
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                className="hidden"
                id="import-chatbot"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImport(file)
                    e.target.value = ''
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('import-chatbot')?.click()}
              >
                Import
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Chatbot
              </Button>
            </div>
          </>
        )}
      </div>

      {/* List Page: hidden when editing/creating */}
      {!(showCreateDialog || showEditDialog) && (
        <>
          {isLoading ? (
            <div className="text-center py-12">Loading chatbots...</div>
          ) : (
            <>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 max-w-md">
                  <ChatbotSearch
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>
                <ChatbotFilters
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  deploymentFilter={deploymentFilter}
                  onDeploymentFilterChange={setDeploymentFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  sortOrder={sortOrder}
                  onSortOrderChange={setSortOrder}
                />
              </div>
              
              <ChatbotList
                chatbots={filteredAndSortedChatbots}
                viewMode={viewMode}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPublish={handlePublish}
                onPreview={(chatbot) => {
                  setSelectedChatbot(chatbot)
                  setShowPreviewDialog(true)
                }}
                onViewVersions={(chatbot) => {
                  setSelectedChatbot(chatbot)
                  setShowVersionDialog(true)
                }}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
              />
            </>
          )}
        </>
      )}

      {/* Create/Edit Inline Page Section */}
      {(showCreateDialog || showEditDialog) && (
        <div className="space-y-4">
          {/* Header */}
          <ChatbotHeader formData={formData} setFormData={setFormData} />
          
          {/* Selection Tab */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
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
              <TabsTrigger value="performance">
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Split Layout: Selected Tab Content | Emulator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="min-h-[800px]">
              <ChatbotEditor
                formData={formData}
                setFormData={setFormData}
                selectedChatbot={selectedChatbot}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onGenerateEmbedCode={generateEmbedCode}
                hideTabsList={true}
              />
            </div>
            <ChatbotEmulator
              selectedChatbot={selectedChatbot}
              previewMode={previewMode}
              onPreviewModeChange={setPreviewMode}
              formData={formData}
            />
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

      {/* Name Prompt Dialog */}
      <NameDialog
        open={showNameDialog}
        onOpenChange={setShowNameDialog}
        onContinue={(name) => {
          startCreateWithName(name)
        }}
      />

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
