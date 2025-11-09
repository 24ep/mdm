'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Plus,
  BookOpen,
  Trash2,
  Edit,
  Calendar,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { KnowledgePage } from '@/components/knowledge-base/KnowledgePage'
import { KnowledgeNotebook } from '../types'

export function KnowledgeBase() {
  const { data: session } = useSession()
  const [notebooks, setNotebooks] = useState<KnowledgeNotebook[]>([])
  const [selectedNotebook, setSelectedNotebook] = useState<KnowledgeNotebook | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewNotebookDialog, setShowNewNotebookDialog] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [newNotebookDescription, setNewNotebookDescription] = useState('')
  const [showEditNotebookDialog, setShowEditNotebookDialog] = useState(false)
  const [editingNotebook, setEditingNotebook] = useState<KnowledgeNotebook | null>(null)
  const [editNotebookName, setEditNotebookName] = useState('')
  const [editNotebookDescription, setEditNotebookDescription] = useState('')

  // Load notebooks from localStorage
  useEffect(() => {
    const savedNotebooks = localStorage.getItem('knowledge-base-notebooks')
    
    if (savedNotebooks) {
      try {
        const parsed = JSON.parse(savedNotebooks)
        setNotebooks(parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt)
        })))
      } catch (e) {
        console.error('Error loading notebooks:', e)
      }
    } else {
      // Initialize with sample notebook
      const sampleNotebook: KnowledgeNotebook = {
        id: 'notebook-1',
        name: 'Welcome Notebook',
        description: 'Get started with your knowledge base',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: session?.user?.email || 'system',
        documentCount: 1
      }
      setNotebooks([sampleNotebook])
      localStorage.setItem('knowledge-base-notebooks', JSON.stringify([sampleNotebook]))
    }
  }, [session])

  // Save notebooks to localStorage
  useEffect(() => {
    if (notebooks.length > 0) {
      localStorage.setItem('knowledge-base-notebooks', JSON.stringify(notebooks))
    }
  }, [notebooks])

  // Filter notebooks by search
  const filteredNotebooks = searchQuery
    ? notebooks.filter(notebook => 
        notebook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notebook.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notebook.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : notebooks

  const handleCreateNotebook = () => {
    if (!newNotebookName.trim()) {
      toast.error('Please enter a notebook name')
      return
    }

    const newNotebook: KnowledgeNotebook = {
      id: `notebook-${Date.now()}`,
      name: newNotebookName.trim(),
      description: newNotebookDescription.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session?.user?.email || 'system',
      documentCount: 0
    }

    setNotebooks([...notebooks, newNotebook])
    setShowNewNotebookDialog(false)
    setNewNotebookName('')
    setNewNotebookDescription('')
    toast.success('Notebook created')
  }

  const handleEditNotebook = () => {
    if (!editingNotebook) return
    
    if (!editNotebookName.trim()) {
      toast.error('Please enter a notebook name')
      return
    }

    const updatedNotebooks = notebooks.map(n => 
      n.id === editingNotebook.id
        ? {
            ...n,
            name: editNotebookName.trim(),
            description: editNotebookDescription.trim() || undefined,
            updatedAt: new Date()
          }
        : n
    )

    setNotebooks(updatedNotebooks)
    setShowEditNotebookDialog(false)
    setEditingNotebook(null)
    setEditNotebookName('')
    setEditNotebookDescription('')
    
    // Update selected notebook if it's the one being edited
    if (selectedNotebook?.id === editingNotebook.id) {
      const updated = updatedNotebooks.find(n => n.id === editingNotebook.id)
      if (updated) {
        setSelectedNotebook(updated)
      }
    }
    
    toast.success('Notebook updated')
  }

  const handleDeleteNotebook = (notebookId: string) => {
    if (confirm('Are you sure you want to delete this notebook? All documents in it will be deleted.')) {
      setNotebooks(notebooks.filter(n => n.id !== notebookId))
      if (selectedNotebook?.id === notebookId) {
        setSelectedNotebook(null)
      }
      // Also delete associated data
      localStorage.removeItem(`knowledge-base-${notebookId}-categories`)
      localStorage.removeItem(`knowledge-base-${notebookId}-documents`)
      localStorage.removeItem(`knowledge-base-${notebookId}-config`)
      toast.success('Notebook deleted')
    }
  }

  const handleNotebookNameChange = (newName: string) => {
    if (!selectedNotebook) return
    
    const updatedNotebooks = notebooks.map(n => 
      n.id === selectedNotebook.id
        ? {
            ...n,
            name: newName,
            updatedAt: new Date()
          }
        : n
    )
    setNotebooks(updatedNotebooks)
    setSelectedNotebook({ ...selectedNotebook, name: newName })
    toast.success('Notebook name updated')
  }

  // If a notebook is selected, show the knowledge page
  if (selectedNotebook) {
    return (
      <div className="h-screen">
        <KnowledgePage
          notebookId={selectedNotebook.id}
          notebookName={selectedNotebook.name}
          canEdit={true}
          onNotebookNameChange={handleNotebookNameChange}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Knowledge Base</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowNewNotebookDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Notebook
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notebooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Notebook List */}
      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-6">
          {filteredNotebooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No notebooks yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first notebook to get started</p>
              <Button 
                onClick={() => setShowNewNotebookDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Notebook
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotebooks.map((notebook) => {
                // Get document count from localStorage
                const savedDocs = localStorage.getItem(`knowledge-base-${notebook.id}-documents`)
                let docCount = 0
                if (savedDocs) {
                  try {
                    const parsed = JSON.parse(savedDocs)
                    docCount = parsed.length
                  } catch (e) {
                    // ignore
                  }
                }

                return (
                  <Card
                    key={notebook.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedNotebook(notebook)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <CardTitle className="text-lg">{notebook.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingNotebook(notebook)
                              setEditNotebookName(notebook.name)
                              setEditNotebookDescription(notebook.description || '')
                              setShowEditNotebookDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNotebook(notebook.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {notebook.description && (
                        <CardDescription className="mt-2">{notebook.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{docCount} documents</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(notebook.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* New Notebook Dialog */}
      <Dialog open={showNewNotebookDialog} onOpenChange={setShowNewNotebookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Notebook</DialogTitle>
            <DialogDescription>Enter a name and description for your new notebook</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Notebook Name</label>
              <Input
                placeholder="Notebook name..."
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newNotebookName.trim()) {
                    handleCreateNotebook()
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Input
                placeholder="Brief description..."
                value={newNotebookDescription}
                onChange={(e) => setNewNotebookDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newNotebookName.trim()) {
                    handleCreateNotebook()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewNotebookDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNotebook} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notebook Dialog */}
      <Dialog open={showEditNotebookDialog} onOpenChange={setShowEditNotebookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notebook</DialogTitle>
            <DialogDescription>
              Update the notebook name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="Notebook name..."
                value={editNotebookName}
                onChange={(e) => setEditNotebookName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editNotebookName.trim()) {
                    handleEditNotebook()
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Input
                placeholder="Brief description..."
                value={editNotebookDescription}
                onChange={(e) => setEditNotebookDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editNotebookName.trim()) {
                    handleEditNotebook()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditNotebookDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditNotebook} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
