'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import {
  Plus,
  TableIcon,
  Grid3X3,
  List,
} from 'lucide-react'
import { PreviewDialog } from './PreviewDialog'
import { VersionHistoryDialog } from './VersionHistoryDialog'
import toast from 'react-hot-toast'
import { Chatbot, ChatbotVersion } from './chatbot/types'
import { ChatbotList } from './chatbot/ChatbotList'
import { ChatbotEditor } from './chatbot/ChatbotEditor'
import { ChatbotHeader } from './chatbot/ChatbotHeader'
import { ChatbotEmulator } from './chatbot/ChatbotEmulator'
import { NameDialog } from './chatbot/NameDialog'
import { ChatbotSearch } from './chatbot/ChatbotSearch'
import { ChatbotFilters } from './chatbot/ChatbotFilters'
import { DEFAULT_CHATBOT_CONFIG, createDefaultChatbot } from './chatbot/constants'
import { generateEmbedCode, createNewVersion, validateChatbot, duplicateChatbot, exportChatbot, importChatbot } from './chatbot/utils'

export function AIChatUI() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'list'>('table')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null)
  const [activeTab, setActiveTab] = useState<'engine' | 'style' | 'config' | 'deployment'>('engine')
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

  const loadChatbots = async () => {
    setIsLoading(true)
    try {
      const saved = localStorage.getItem('ai-chatbots')
      if (saved) {
        const parsed = JSON.parse(saved)
        setChatbots(parsed.map((c: any) => ({
          ...c,
          engineType: c.engineType || 'custom', // Backward compatibility
          createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)) : new Date(),
          updatedAt: c.updatedAt ? (c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt)) : new Date(),
          versions: (c.versions || []).map((v: any) => ({
            ...v,
            createdAt: v.createdAt ? (v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt)) : new Date()
          }))
        })))
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
      let updatedChatbots = [...chatbots]
      
      if (selectedChatbot) {
        const index = updatedChatbots.findIndex(c => c.id === selectedChatbot.id)
        if (index >= 0) {
          const newVersion = createNewVersion(selectedChatbot.currentVersion)
          
          // Use formData directly - it should already have all the updated nested properties
          // formData.chatkitOptions is already properly merged by ChatKitStyleConfig
          updatedChatbots[index] = {
            ...selectedChatbot,
            ...formData,
            // Ensure chatkitOptions from formData is used if it exists
            chatkitOptions: formData.chatkitOptions || selectedChatbot.chatkitOptions,
            updatedAt: new Date(),
            currentVersion: newVersion.version,
            versions: [...selectedChatbot.versions, newVersion]
          } as Chatbot
        }
      } else {
        const newChatbot = createDefaultChatbot(formData.name || 'Untitled Chatbot')
        Object.assign(newChatbot, formData)
          updatedChatbots.push(newChatbot)
      }
      
      // Debug: Log what's being saved (only in development)
      if (process.env.NODE_ENV === 'development' && selectedChatbot) {
        const savedIndex = updatedChatbots.findIndex(c => c.id === selectedChatbot.id)
        if (savedIndex >= 0) {
          console.log('Saving chatbot config:', {
            id: updatedChatbots[savedIndex].id,
            name: updatedChatbots[savedIndex].name,
            hasChatkitOptions: !!updatedChatbots[savedIndex].chatkitOptions,
            chatkitOptions: updatedChatbots[savedIndex].chatkitOptions
          })
        }
      }
      
      localStorage.setItem('ai-chatbots', JSON.stringify(updatedChatbots))
      setChatbots(updatedChatbots)
      
      // Update selectedChatbot to reflect the saved changes
      const savedChatbot = selectedChatbot 
        ? updatedChatbots.find(c => c.id === selectedChatbot.id)
        : updatedChatbots[updatedChatbots.length - 1] // New chatbot is last in array
      
      if (savedChatbot) {
        setSelectedChatbot(savedChatbot as Chatbot)
        setFormData(savedChatbot as Partial<Chatbot>)
      }
      
      toast.success(selectedChatbot ? 'Chatbot updated successfully' : 'Chatbot created successfully')
      // Keep dialog open - don't navigate away
      // setShowCreateDialog(false)
      // setShowEditDialog(false)
      // setSelectedChatbot(null)
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
    <div className="p-6 space-y-4">
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
          <ChatbotHeader formData={formData} setFormData={setFormData} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="min-h-[800px]">
              <ChatbotEditor
                formData={formData}
                setFormData={setFormData}
                selectedChatbot={selectedChatbot}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onGenerateEmbedCode={generateEmbedCode}
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
