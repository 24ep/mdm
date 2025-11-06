'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Home,
  Layout,
  FileCode,
  Sparkles,
  Copy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { RichMarkdownEditor } from '@/components/knowledge-base/RichMarkdownEditor'
import { MarkdownRenderer } from '@/components/knowledge-base/MarkdownRenderer'

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
  templateId?: string
}

interface Folder {
  id: string
  name: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
}

interface DocumentTemplate {
  id: string
  name: string
  description: string
  content: string
  icon: any
}

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch',
    content: '',
    icon: FileText
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Template for meeting notes',
    content: `# Meeting Notes

**Date:** [Date]
**Attendees:** [Names]

## Agenda
- 
- 
- 

## Discussion
### Topic 1
- 

### Topic 2
- 

## Action Items
- [ ] 
- [ ] 
- [ ] 

## Next Steps
- 
`,
    icon: FileText
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    description: 'Template for project planning',
    content: `# Project Plan

## Overview
**Project Name:** 
**Start Date:** 
**Target Date:** 

## Goals
- 
- 
- 

## Timeline
### Phase 1: [Name]
- **Start:** 
- **End:** 
- **Deliverables:** 
  - 
  - 

### Phase 2: [Name]
- **Start:** 
- **End:** 
- **Deliverables:** 
  - 
  - 

## Resources
- **Team Members:** 
- **Budget:** 
- **Tools:** 

## Risks & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
|      |        |            |

## Success Metrics
- 
- 
`,
    icon: Layout
  },
  {
    id: 'api-docs',
    name: 'API Documentation',
    description: 'Template for API docs',
    content: `# API Documentation

## Endpoint: [Name]

**Method:** \`GET\` / \`POST\` / \`PUT\` / \`DELETE\`
**URL:** \`/api/v1/endpoint\`

### Description
[Description of what this endpoint does]

### Request Parameters

#### Headers
\`\`\`
Content-Type: application/json
Authorization: Bearer <token>
\`\`\`

#### Body
\`\`\`json
{
  "param1": "value1",
  "param2": "value2"
}
\`\`\`

### Response

#### Success (200)
\`\`\`json
{
  "status": "success",
  "data": {}
}
\`\`\`

#### Error (400)
\`\`\`json
{
  "status": "error",
  "message": "Error description"
}
\`\`\`

### Example
\`\`\`bash
curl -X POST https://api.example.com/v1/endpoint \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{"param1": "value1"}'
\`\`\`
`,
    icon: FileCode
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting Guide',
    description: 'Template for troubleshooting docs',
    content: `# Troubleshooting Guide

## Problem: [Issue Name]

### Symptoms
- 
- 
- 

### Possible Causes
1. 
2. 
3. 

### Solutions

#### Solution 1: [Name]
**Steps:**
1. 
2. 
3. 

**Expected Result:** 

#### Solution 2: [Name]
**Steps:**
1. 
2. 

**Expected Result:** 

### Prevention
- 
- 

### Related Issues
- 
`,
    icon: Sparkles
  }
]

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
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')

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
          content: `<h1>Welcome to Knowledge Base</h1>
<p>This is your team's knowledge base, similar to <strong>Outline</strong>. Here you can:</p>
<ul>
<li><strong>Create documents</strong> with rich markdown formatting</li>
<li><strong>Organize</strong> content in folders</li>
<li><strong>Search</strong> across all documents</li>
<li><strong>Share</strong> documents with your team</li>
</ul>
<h2>Getting Started</h2>
<ol>
<li>Create a new document by clicking the <strong>+</strong> button</li>
<li>Use markdown to format your content</li>
<li>Try typing <code>/</code> for slash commands</li>
<li>Organize documents in folders</li>
<li>Search to quickly find what you need</li>
</ol>
<h2>Features</h2>
<h3>Rich Markdown Editor</h3>
<ul>
<li>Slash commands (type <code>/</code> to see options)</li>
<li>Full markdown support</li>
<li>Syntax highlighting for code blocks</li>
<li>Tables, lists, links, images, and more</li>
</ul>
<h3>Organization</h3>
<ul>
<li>Create folders to organize documents</li>
<li>Move documents between folders</li>
<li>Pin important documents</li>
</ul>
<p>Enjoy your knowledge base! 🎉</p>`,
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

    const template = DOCUMENT_TEMPLATES.find(t => t.id === selectedTemplate)
    const content = template?.content || `<h1>${newDocTitle.trim()}</h1>\n<p>Start writing...</p>`

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      content,
      folderId: selectedFolder || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session?.user?.email || 'system',
      isPinned: false,
      isPublic: false,
      templateId: selectedTemplate
    }

    setDocuments([...documents, newDoc])
    setSelectedDocument(newDoc)
    setEditingDocument(newDoc)
    setIsEditing(true)
    setShowNewDocDialog(false)
    setShowTemplateDialog(false)
    setNewDocTitle('')
    setSelectedTemplate('blank')
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
    toast.success(doc.isPinned ? 'Unpinned' : 'Pinned')
  }

  const handleTogglePublic = (doc: Document) => {
    const updated = { ...doc, isPublic: !doc.isPublic }
    setDocuments(documents.map(d => d.id === doc.id ? updated : d))
    if (selectedDocument?.id === doc.id) {
      setSelectedDocument(updated)
    }
    toast.success(doc.isPublic ? 'Made private' : 'Made public')
  }

  const handleCopyLink = () => {
    if (selectedDocument) {
      const link = `${window.location.origin}/knowledge-base/${selectedDocument.id}`
      navigator.clipboard.writeText(link)
      toast.success('Link copied to clipboard')
    }
  }

  const selectedDocContent = editingDocument || selectedDocument

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950">
      {/* Header - Outline style */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Knowledge Base</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNewFolderDialog(true)}
            className="text-gray-600 dark:text-gray-400"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setShowTemplateDialog(true)
              setShowNewDocDialog(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar - Outline style */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col min-h-0">
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Document Tree */}
          <ScrollArea className="flex-1 h-full min-h-0">
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start mb-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                        className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                        <div className="ml-6">
                          {documents
                            .filter(doc => doc.folderId === node.id)
                            .map(doc => (
                              <Button
                                key={doc.id}
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
                                  selectedDocument?.id === doc.id && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                )}
                                onClick={() => {
                                  setSelectedDocument(doc)
                                  setIsEditing(true)
                                  setEditingDocument(doc)
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
                        "w-full justify-start text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
                        selectedDocument?.id === node.id && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      )}
                      onClick={() => {
                        const doc = node.data as Document
                        setSelectedDocument(doc)
                        setIsEditing(true)
                        setEditingDocument(doc)
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

        {/* Main Content - Outline style */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
          {selectedDocContent ? (
            <>
              {/* Toolbar */}
              <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Input
                      value={editingDocument?.title || selectedDocument?.title || ''}
                      onChange={(e) => {
                        if (isEditing) {
                          setEditingDocument(prev => ({
                            ...(prev || (selectedDocument as Document)),
                            title: e.target.value
                          }) as Document)
                        }
                      }}
                      className="h-8 w-[28rem] max-w-full"
                    />
                  ) : (
                    <h2 className="font-semibold text-gray-900 dark:text-white">{selectedDocContent.title}</h2>
                  )}
                  {selectedDocContent.isPinned && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                  {selectedDocContent.isPublic ? (
                    <Badge variant="outline" className="text-xs">
                      <Unlock className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (viewMode === 'edit') setViewMode('preview')
                      else if (viewMode === 'preview') setViewMode('edit')
                      else setViewMode('edit')
                    }}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    {viewMode === 'edit' ? <Eye className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
                    {viewMode === 'edit' ? 'Preview' : 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (viewMode === 'split') {
                        setViewMode('edit')
                      } else {
                        setViewMode('split')
                      }
                    }}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <Layout className="h-4 w-4 mr-1" />
                    Split
                  </Button>
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                  {isEditing && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTogglePin(selectedDocContent as Document)}
                        className="text-gray-600 dark:text-gray-400"
                      >
                        <Star className={cn(
                          "h-4 w-4",
                          selectedDocContent.isPinned && "fill-yellow-400 text-yellow-400"
                        )} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTogglePublic(selectedDocContent as Document)}
                        className="text-gray-600 dark:text-gray-400"
                      >
                        {selectedDocContent.isPublic ? (
                          <Unlock className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyLink}
                        className="text-gray-600 dark:text-gray-400"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isEditing ? (
                    <Button 
                      size="sm" 
                      onClick={handleSaveDocument}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(true)
                        setEditingDocument(selectedDocument)
                      }}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteDocument(selectedDocContent.id)}
                    className="text-gray-600 dark:text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Editor/Preview */}
              <div className="flex-1 overflow-hidden">
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className={cn(
                    "h-full border-r border-gray-200 dark:border-gray-800",
                    viewMode === 'split' && "w-1/2"
                  )}>
                    <RichMarkdownEditor
                      content={isEditing && editingDocument ? editingDocument.content : selectedDocument?.content || ''}
                      onChange={(content) => {
                        if (isEditing && editingDocument) {
                          setEditingDocument({
                            ...editingDocument,
                            content
                          })
                        }
                      }}
                      editable={isEditing}
                      className="h-full bg-white dark:bg-gray-950"
                    />
                  </div>
                )}

                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className={cn(
                    "h-full overflow-auto bg-white dark:bg-gray-950",
                    viewMode === 'split' && "w-1/2"
                  )}>
                    <div className="max-w-4xl mx-auto p-8">
                      <MarkdownRenderer
                        content={
                          isEditing && editingDocument
                            ? editingDocument.content
                            : selectedDocument?.content || ''
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center max-w-md">
                <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No document selected</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Select a document from the sidebar or create a new one</p>
                <Button 
                  onClick={() => {
                    setShowTemplateDialog(true)
                    setShowNewDocDialog(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Document
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Document Dialog with Templates */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>Choose a template or start from scratch</DialogDescription>
          </DialogHeader>
          
          {showTemplateDialog && (
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Template</label>
              <div className="grid grid-cols-2 gap-3">
                {DOCUMENT_TEMPLATES.map((template) => {
                  const Icon = template.icon
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={cn(
                        "p-4 border rounded-lg text-left transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                        selectedTemplate === template.id && "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <Icon className="h-5 w-5 mb-2 text-gray-600 dark:text-gray-400" />
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium mb-2 block">Document Title</label>
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewDocDialog(false)
              setShowTemplateDialog(false)
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateDocument} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create
            </Button>
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
            <Button onClick={handleCreateFolder} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
