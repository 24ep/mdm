'use client'

import { useState, useEffect } from 'react'
import { ChatbotList } from '@/app/admin/components/chatbot/ChatbotList'
import { ChatbotEditor } from '@/app/admin/components/chatbot/ChatbotEditor'
import { Chatbot } from '@/app/admin/components/chatbot/types'
import { ChatbotEmulator } from '@/app/admin/components/chatbot/ChatbotEmulator'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function ChatEmbedUIPage() {
    const router = useRouter()
    const [chatbots, setChatbots] = useState<Chatbot[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'table' | 'card' | 'list'>('list')
    const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editorFormData, setEditorFormData] = useState<Partial<Chatbot>>({})
    const [activeTab, setActiveTab] = useState<'engine' | 'style' | 'config' | 'deployment' | 'performance' | 'pwa'>('engine')
    const [previewMode, setPreviewMode] = useState<'popover' | 'fullpage' | 'popup-center'>('popover')

    const fetchChatbots = async () => {
        setIsLoading(true)
        try {
            // Assuming GET /api/chatbots returns { chatbots: Chatbot[] }
            const res = await fetch('/api/chatbots')
            if (!res.ok) throw new Error('Failed to fetch chatbots')
            const data = await res.json()
            setChatbots(data.chatbots || [])
        } catch (error) {
            console.error(error)
            toast.error('Failed to load chatbots')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchChatbots()
    }, [])

    const handleCreate = () => {
        setSelectedChatbot(null)
        setEditorFormData({
            name: 'New Chatbot',
            website: 'https://example.com',
            description: 'A new AI assistant',
            engineType: 'custom',
            apiEndpoint: 'https://api.openai.com/v1/chat/completions',
            apiAuthType: 'none',
            apiAuthValue: '',
            conversationOpener: 'Hello! How can I help you today?',
            openaiAgentSdkModel: 'gpt-4o',
            deploymentType: 'popover',
            customEmbedDomain: '',

            // ===== Default Style Settings =====
            // Primary colors
            primaryColor: '#3b82f6',
            fontFamily: 'Inter',

            // Header settings
            headerTitle: 'New Chatbot',
            headerDescription: 'How can I help you today?',
            headerShowTitle: true,
            headerShowLogo: false,
            headerBgColor: '#3b82f6',
            headerFontColor: '#ffffff',
            headerBorderEnabled: true,
            headerBorderColor: '#e5e7eb',
            headerShowClearSession: true,

            // Widget settings
            widgetPosition: 'bottom-right',
            widgetOffsetX: '20px',
            widgetOffsetY: '20px',
            widgetSize: '60px',
            widgetAvatarStyle: 'circle',
            widgetBackgroundColor: '#3b82f6',
            widgetBorderRadius: '50%',
            widgetBorderWidth: '0px',
            widgetBorderColor: 'transparent',
            widgetShadowBlur: '8px',
            widgetShadowColor: 'rgba(0,0,0,0.2)',
            widgetAutoShow: false,
            widgetAutoShowDelay: 3,

            // Chat container settings
            chatBackgroundColor: '#ffffff',
            chatFontColor: '#1f2937',
            chatBorderRadius: '12px',

            // Message bubble settings
            userBubbleColor: '#3b82f6',
            userBubbleFontColor: '#ffffff',
            botBubbleColor: '#f3f4f6',
            botBubbleFontColor: '#1f2937',

            // Composer settings
            composerBackgroundColor: '#ffffff',
            composerFontColor: '#1f2937',
            composerPlaceholder: 'Type a message...',

            // Popover settings
            popoverWidth: '400px',
            popoverHeight: '600px',
            popoverBorderRadius: '16px',

            // Avatar settings
            avatarType: 'icon',
            avatarIcon: 'Bot',
            avatarIconColor: '#ffffff',

            // Conversation settings
            showStartConversation: true,
            enableConversationRenaming: true,

            // Required arrays/booleans
            followUpQuestions: [],
            enableFileUpload: false,
            showCitations: true,
            isPublished: false,

            // ChatKit options with defaults
            chatkitOptions: {
                history: {
                    enabled: true,
                    showDelete: true,
                    showRename: true
                }
            }
        } as any)
        setIsEditing(true)
        setActiveTab('engine')
    }

    // ... handleEdit, handleDelete ...

    const handleEdit = (chatbot: Chatbot) => {
        setSelectedChatbot(chatbot)
        setEditorFormData(chatbot)
        setIsEditing(true)
        setActiveTab('engine')
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this chatbot?')) return

        try {
            const res = await fetch(`/api/chatbots/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete chatbot')
            toast.success('Chatbot deleted')
            fetchChatbots()
        } catch (error) {
            console.error(error)
            toast.error('Failed to delete chatbot')
        }
    }

    const handleSave = async (): Promise<Chatbot | null> => {
        // Client-side validation
        if (!editorFormData.name) {
            toast.error('Name is required')
            return null
        }
        if (!editorFormData.website) {
            toast.error('Website is required')
            return null
        }
        if (editorFormData.engineType === 'custom' && !editorFormData.apiEndpoint) {
            toast.error('API Endpoint is required for Custom engine')
            return null
        }

        try {
            const url = selectedChatbot ? `/api/chatbots/${selectedChatbot.id}` : '/api/chatbots'
            const method = selectedChatbot ? 'PATCH' : 'POST'

            console.log('Saving chatbot with data:', editorFormData)
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editorFormData)
            })

            if (!res.ok) {
                let errorData: any = {}
                try {
                    errorData = await res.json()
                } catch (e) {
                    const text = await res.text()
                    console.error('Server returned non-JSON error:', text)
                    errorData = { error: `Server error (${res.status}): ${text.substring(0, 100)}` }
                }
                console.error('Server error:', errorData)
                throw new Error(errorData.error || errorData.details || 'Failed to save chatbot')
            }

            const data = await res.json()
            const savedChatbot = data.chatbot

            toast.success(selectedChatbot ? 'Chatbot updated' : 'Chatbot created')

            // Update local state if editing, otherwise refresh list
            if (selectedChatbot) {
                setChatbots(prev => prev.map(c => c.id === savedChatbot.id ? savedChatbot : c))
                setSelectedChatbot(savedChatbot) // Update selected chatbot with latest data
            } else {
                fetchChatbots()
                setSelectedChatbot(savedChatbot) // Switch to edit mode for the new bot
            }

            return savedChatbot
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to save chatbot')
            return null
        }
    }

    const handlePublish = async (chatbot: Chatbot) => {
        // Implement publish logic if separate from save, or just use save with isPublished=true
        // For now, assuming publish might be a separate action or just a toggle in editor
        // Let's toggle availability
        try {
            const res = await fetch(`/api/chatbots/${chatbot.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !chatbot.isPublished })
            })
            if (!res.ok) throw new Error('Failed to update publish status')
            toast.success(chatbot.isPublished ? 'Chatbot unpublished' : 'Chatbot published')
            fetchChatbots()
        } catch (e) {
            toast.error('Failed to update status')
        }
    }

    const handlePreview = (chatbot: Chatbot) => {
        window.open(`/chat/${chatbot.id}`, '_blank')
    }

    const handleViewVersions = (chatbot: Chatbot) => {
        toast('Version history coming soon', { icon: 'ℹ️' })
    }

    const handleDuplicate = async (chatbot: Chatbot) => {
        // Implement duplicate
        toast('Duplicate feature coming soon', { icon: 'ℹ️' })
    }

    const handleExport = (chatbot: Chatbot) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatbot, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${chatbot.name}-config.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }


    const generateEmbedCode = (chatbot: Chatbot) => {
        // Use custom domain if provided, otherwise fallback to current origin
        const baseUrl = chatbot.customEmbedDomain
            ? (chatbot.customEmbedDomain.startsWith('http') ? chatbot.customEmbedDomain : `https://${chatbot.customEmbedDomain}`).replace(/\/$/, '')
            : window.location.origin

        return `<script src="${baseUrl}/chat-widget.js" data-chatbot-id="${chatbot.id}"></script>`
    }

    if (isEditing) {
        return (
            <div className="flex flex-col h-full bg-background overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold">
                                {selectedChatbot ? `Edit ${selectedChatbot.name}` : 'Create New Chatbot'}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Save/Deploy buttons are handled inside specific tabs usually, or we can have a global save here */}
                        <Button onClick={() => handleSave()}>Save Changes</Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-w-[500px] border-r border-border">
                        <ChatbotEditor
                            formData={editorFormData}
                            setFormData={setEditorFormData}
                            selectedChatbot={selectedChatbot}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            onGenerateEmbedCode={generateEmbedCode}
                            onSave={handleSave}
                        />
                    </div>

                    <div className="w-[450px] lg:w-[600px] xl:w-[700px] bg-muted/10 h-full overflow-hidden shrink-0">
                        <ChatbotEmulator
                            selectedChatbot={selectedChatbot}
                            formData={editorFormData}
                            onFormDataChange={setEditorFormData}
                            previewMode={previewMode}
                            onPreviewModeChange={setPreviewMode}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Chat Embed UI</h1>
                    <p className="text-muted-foreground mt-2">
                        Create and manage AI chatbots for your websites and applications.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Chatbot
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <ChatbotList
                    chatbots={chatbots}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPublish={handlePublish}
                    onPreview={handlePreview}
                    onViewVersions={handleViewVersions}
                    onDuplicate={handleDuplicate}
                    onExport={handleExport}
                />
            )}
        </div>
    )
}
