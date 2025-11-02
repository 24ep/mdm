'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  FileText,
  Folder,
  FolderOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  MoreVertical,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Star,
  Share2,
  Lock,
  Unlock,
  X,
  FilePlus,
  FolderPlus,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

interface Document {
  id: string
  title: string
  content: string
  folderId?: string
  isPinned?: boolean
  isPublic?: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  tags?: string[]
}

interface Folder {
  id: string
  name: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
}

interface DocumentNode {
  id: string
  name: string
  type: 'document' | 'folder'
  icon: any
  children?: DocumentNode[]
  data?: Document | Folder
  isOpen?: boolean
}

export function KnowledgeBase() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showNewDocDialog, setShowNewDocDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')
  
  const editorRef = useRef<HTMLTextAreaElement>(null)

  // Load documents and folders from localStorage (or API in production)
  useEffect(() => {
    const savedDocs = localStorage.getItem('knowledge-base-documents')
    const savedFolders = localStorage.getItem('knowledge-base-folders')
    
    if (savedDocs) {
      try {
        const parsed = JSON.parse(savedDocs)
        setDocuments(parsed.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt)
        })))
      } catch (e) {
        console.error('Error loading documents:', e)
      }
    } else {
      // Initialize with sample documents
      const sampleDocs: Document[] = [
        {
          id: 'doc-1',
          title: 'Welcome to Knowledge Base',
          content: `# Welcome to Knowledge Base

This is your team's knowledge base, similar to Outline. Here you can:

- **Create documents** with rich markdown formatting
- **Organize** content in folders
- **Search** across all documents
- **Share** documents with your team

## Getting Started

1. Create a new document by clicking the **+** button
2. Use markdown to format your content
3. Organize documents in folders
4. Search to quickly find what you need

## Features

### Markdown Support
- Headers (\`# H1\`, \`## H2\`, etc.)
- **Bold** and *italic* text
- Lists (ordered and unordered)
- Code blocks and inline code
- Links and images
- Tables
- And more!

### Organization
- Create folders to organize documents
- Move documents between folders
- Pin important documents

Enjoy your knowledge base! 🎉`,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: session?.user?.email || 'system',
          isPinned: true,
          isPublic: true
        }
      ]
      setDocuments(sampleDocs)
      localStorage.setItem('knowledge-base-documents', JSON.stringify(sampleDocs))
    }
    
    if (savedFolders) {
      try {
        const parsed = JSON.parse(savedFolders)
        setFolders(parsed.map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt),
          updatedAt: new Date(f.updatedAt)
        })))
      } catch (e) {
        console.error('Error loading folders:', e)
      }
    }
  }, [session])

  // Save documents to localStorage
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('knowledge-base-documents', JSON.stringify(documents))
    }
  }, [documents])

  // Save folders to localStorage
  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem('knowledge-base-folders', JSON.stringify(folders))
    }
  }, [folders])

  // Build document tree
  const buildTree = (): DocumentNode[] => {
    const tree: DocumentNode[] = []
    const folderMap = new Map<string, Folder>()
    
    folders.forEach(folder => {
      folderMap.set(folder.id, folder)
    })

    // Add folders
    const rootFolders = folders.filter(f => !f.parentId)
    rootFolders.forEach(folder => {
      tree.push({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        icon: expandedFolders.has(folder.id) ? FolderOpen : Folder,
        isOpen: expandedFolders.has(folder.id),
        data: folder,
        children: []
      })
    })

    // Add documents not in folders
    documents
      .filter(doc => !doc.folderId)
      .forEach(doc => {
        tree.push({
          id: doc.id,
          name: doc.title,
          type: 'document',
          icon: FileText,
          data: doc
        })
      })

    // Sort: folders first, then documents, with pinned items first
    tree.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      if (a.data && 'isPinned' in a.data && b.data && 'isPinned' in b.data) {
        const aPinned = (a.data as Document).isPinned ? 1 : 0
        const bPinned = (b.data as Document).isPinned ? 1 : 0
        return bPinned - aPinned
      }
      return a.name.localeCompare(b.name)
    })

    return tree
  }

  const documentTree = buildTree()

  // Filter documents by search
  const filteredDocuments = searchQuery
    ? documents.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents

  // Filter by folder
  const folderFilteredDocuments = selectedFolder
    ? filteredDocuments.filter(doc => doc.folderId === selectedFolder)
    : filteredDocuments.filter(doc => !doc.folderId || selectedFolder === null)

  const handleCreateDocument = () => {
    if (!newDocTitle.trim()) {
      toast.error('Please enter a document title')
      return
    }

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      content: `# ${newDocTitle.trim()}\n\nStart writing...`,
      folderId: selectedFolder || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session?.user?.email || 'system',
      isPinned: false,
      isPublic: false
    }

    setDocuments([...documents, newDoc])
    setSelectedDocument(newDoc)
    setEditingDocument(newDoc)
    setIsEditing(true)
    setShowNewDocDialog(false)
    setNewDocTitle('')
    toast.success('Document created')
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name')
      return
    }

    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      parentId: selectedFolder || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setFolders([...folders, newFolder])
    setExpandedFolders(new Set([...expandedFolders, newFolder.id]))
    setShowNewFolderDialog(false)
    setNewFolderName('')
    toast.success('Folder created')
  }

  const handleSaveDocument = () => {
    if (!editingDocument) return

    const updated = {
      ...editingDocument,
      updatedAt: new Date()
    }

    setDocuments(documents.map(doc => 
      doc.id === updated.id ? updated : doc
    ))
    setSelectedDocument(updated)
    setIsEditing(false)
    toast.success('Document saved')
  }

  const handleDeleteDocument = (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== docId))
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null)
        setIsEditing(false)
      }
      toast.success('Document deleted')
    }
  }

  const handleToggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleTogglePin = (doc: Document) => {
    const updated = { ...doc, isPinned: !doc.isPinned }
    setDocuments(documents.map(d => d.id === doc.id ? updated : d))
    if (selectedDocument?.id === doc.id) {
      setSelectedDocument(updated)
    }
  }

  const handleTogglePublic = (doc: Document) => {
    const updated = { ...doc, isPublic: !doc.isPublic }
    setDocuments(documents.map(d => d.id === doc.id ? updated : d))
    if (selectedDocument?.id === doc.id) {
      setSelectedDocument(updated)
    }
  }

  // Simple markdown renderer
  const renderMarkdown = (content: string): string => {
    let html = content
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto my-2"><code class="text-sm font-mono">$1</code></pre>')
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Lists
    html = html.replace(/^\* (.+)$/gim, '<li class="ml-4">$1</li>')
    html = html.replace(/^- (.+)$/gim, '<li class="ml-4">$1</li>')
    html = html.replace(/(<li.*<\/li>)/g, '<ul class="list-disc my-2">$1</ul>')
    
    // Paragraphs
    html = html.split('\n\n').map(para => {
      if (!para.trim()) return ''
      if (para.startsWith('<') || para.startsWith('#')) return para
      return `<p class="my-2">${para}</p>`
    }).join('')
    
    // Line breaks
    html = html.replace(/\n/g, '<br>')
    
    return html
  }

  const selectedDocContent = editingDocument || selectedDocument

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold">Knowledge Base</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewFolderDialog(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            size="sm"
            onClick={() => setShowNewDocDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-white dark:bg-gray-800 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Document Tree */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start mb-1"
                onClick={() => {
                  setSelectedFolder(null)
                  setSelectedDocument(null)
                  setIsEditing(false)
                }}
              >
                <Home className="h-4 w-4 mr-2" />
                All Documents
              </Button>

              {documentTree.map(node => (
                <div key={node.id}>
                  {node.type === 'folder' ? (
                    <div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          handleToggleFolder(node.id)
                          setSelectedFolder(node.id)
                        }}
                      >
                        {expandedFolders.has(node.id) ? (
                          <ChevronDown className="h-4 w-4 mr-1" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-1" />
                        )}
                        <FolderOpen className="h-4 w-4 mr-2" />
                        <span className="flex-1 text-left truncate">{node.name}</span>
                      </Button>
                      {expandedFolders.has(node.id) && node.data && (
                        <div className="ml-4">
                          {documents
                            .filter(doc => doc.folderId === node.id)
                            .map(doc => (
                              <Button
                                key={doc.id}
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start text-sm",
                                  selectedDocument?.id === doc.id && "bg-blue-50 dark:bg-blue-900/20"
                                )}
                                onClick={() => {
                                  setSelectedDocument(doc)
                                  setIsEditing(false)
                                  setEditingDocument(null)
                                }}
                              >
                                <FileText className="h-3 w-3 mr-2" />
                                <span className="flex-1 text-left truncate">{doc.title}</span>
                                {doc.isPinned && <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />}
                              </Button>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sm",
                        selectedDocument?.id === node.id && "bg-blue-50 dark:bg-blue-900/20"
                      )}
                      onClick={() => {
                        setSelectedDocument(node.data as Document)
                        setIsEditing(false)
                        setEditingDocument(null)
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="flex-1 text-left truncate">{node.name}</span>
                      {node.data && (node.data as Document).isPinned && (
                        <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedDocContent ? (
            <>
              {/* Toolbar */}
              <div className="border-b bg-white dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{selectedDocContent.title}</h2>
                  {selectedDocContent.isPinned && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                  {selectedDocContent.isPublic ? (
                    <Unlock className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (viewMode === 'edit') setViewMode('preview')
                      else if (viewMode === 'preview') setViewMode('edit')
                      else setViewMode('edit')
                    }}
                  >
                    {viewMode === 'edit' ? <Eye className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
                    {viewMode === 'edit' ? 'Preview' : 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (viewMode === 'split') {
                        setViewMode('edit')
                      } else {
                        setViewMode('split')
                      }
                    }}
                  >
                    Split
                  </Button>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePin(selectedDocContent as Document)}
                    >
                      <Star className={cn(
                        "h-4 w-4",
                        selectedDocContent.isPinned && "fill-yellow-400 text-yellow-400"
                      )} />
                    </Button>
                  )}
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublic(selectedDocContent as Document)}
                    >
                      {selectedDocContent.isPublic ? (
                        <Unlock className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {isEditing ? (
                    <Button size="sm" onClick={handleSaveDocument}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(true)
                        setEditingDocument(selectedDocument)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteDocument(selectedDocContent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Editor/Preview */}
              <div className="flex-1 overflow-hidden">
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className={cn(
                    "h-full",
                    viewMode === 'split' && "w-1/2 border-r"
                  )}>
                    <textarea
                      ref={editorRef}
                      value={isEditing && editingDocument ? editingDocument.content : selectedDocument?.content || ''}
                      onChange={(e) => {
                        if (isEditing && editingDocument) {
                          setEditingDocument({
                            ...editingDocument,
                            content: e.target.value
                          })
                        }
                      }}
                      className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none border-0 bg-white dark:bg-gray-900"
                      placeholder="Start writing in markdown..."
                    />
                  </div>
                )}

                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className={cn(
                    "h-full overflow-auto p-4 prose max-w-none dark:prose-invert",
                    viewMode === 'split' && "w-1/2"
                  )}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(
                          isEditing && editingDocument
                            ? editingDocument.content
                            : selectedDocument?.content || ''
                        )
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No document selected</h3>
                <p className="text-gray-500 mb-4">Select a document from the sidebar or create a new one</p>
                <Button onClick={() => setShowNewDocDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Document
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Document Dialog */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>Enter a title for your new document</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Document title..."
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateDocument()
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDocDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDocument}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for your new folder</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder()
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

