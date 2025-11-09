'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Settings,
  Maximize2,
  List,
  FileText,
  Folder,
  FolderPlus,
  FilePlus,
  GripVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { MarkdownRenderer } from '@/components/knowledge-base/MarkdownRenderer'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const RichMarkdownEditor = dynamic(
  () => import('@/components/knowledge-base/RichMarkdownEditor').then(mod => mod.RichMarkdownEditor),
  { ssr: false }
)

interface Category {
  id: string
  name: string
  parentId?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

interface Document {
  id: string
  title: string
  content: string
  categoryId?: string
  parentId?: string // For nesting pages inside other pages
  isPinned?: boolean
  isPublic?: boolean
  isFolder?: boolean // To distinguish folders from pages
  createdAt: Date
  updatedAt: Date
  createdBy: string
  tags?: string[]
  order?: number
}

interface KnowledgePageConfig {
  fullWidth: boolean
  showTableOfContents: boolean
  showCategories: boolean
  showSearch: boolean
}

interface KnowledgePageProps {
  notebookId: string
  notebookName: string
  onBack?: () => void
  canEdit?: boolean
  onNotebookNameChange?: (newName: string) => void
}

export function KnowledgePage({ notebookId, notebookName, onBack, canEdit = true, onNotebookNameChange }: KnowledgePageProps) {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showNewDocDialog, setShowNewDocDialog] = useState(false)
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [isEditingNotebookName, setIsEditingNotebookName] = useState(false)
  const [editedNotebookName, setEditedNotebookName] = useState(notebookName)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<Document | null>(null)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [config, setConfig] = useState<KnowledgePageConfig>({
    fullWidth: true,
    showTableOfContents: true,
    showCategories: true,
    showSearch: true
  })

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update edited name when notebookName prop changes
  useEffect(() => {
    setEditedNotebookName(notebookName)
  }, [notebookName])

  // Load data from localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem(`knowledge-base-${notebookId}-categories`)
    const savedDocuments = localStorage.getItem(`knowledge-base-${notebookId}-documents`)
    const savedConfig = localStorage.getItem(`knowledge-base-${notebookId}-config`)
    
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories)
        setCategories(parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        })))
      } catch (e) {
        console.error('Error loading categories:', e)
      }
    }
    
    if (savedDocuments) {
      try {
        const parsed = JSON.parse(savedDocuments)
        setDocuments(parsed.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt)
        })))
      } catch (e) {
        console.error('Error loading documents:', e)
      }
    }

    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (e) {
        console.error('Error loading config:', e)
      }
    }
  }, [notebookId])

  // Save to localStorage
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(`knowledge-base-${notebookId}-categories`, JSON.stringify(categories))
    }
  }, [categories, notebookId])

  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem(`knowledge-base-${notebookId}-documents`, JSON.stringify(documents))
    }
  }, [documents, notebookId])

  // Auto-select first document when documents are loaded and no document is selected
  useEffect(() => {
    if (documents.length > 0 && !selectedDocument) {
      const firstDoc = documents[0]
      setSelectedDocument(firstDoc)
      setEditingDocument(firstDoc)
      setIsEditing(canEdit) // Set edit mode based on permission
    }
  }, [documents]) // Only depend on documents, not canEdit to avoid re-triggering

  useEffect(() => {
    localStorage.setItem(`knowledge-base-${notebookId}-config`, JSON.stringify(config))
  }, [config, notebookId])

  // Filter documents by search query only
  const filteredDocuments = searchQuery
    ? documents.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents

  // Build document tree for nested pages
  interface DocumentWithChildren extends Document {
    children?: DocumentWithChildren[]
  }

  const buildDocumentTree = (parentId?: string): DocumentWithChildren[] => {
    return filteredDocuments
      .filter(doc => doc.parentId === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(doc => ({
        ...doc,
        children: buildDocumentTree(doc.id)
      }))
  }

  const documentTree = buildDocumentTree()
  const rootDocuments = filteredDocuments.filter(doc => !doc.parentId).sort((a, b) => (a.order || 0) - (b.order || 0))

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    const doc = documents.find(d => d.id === event.active.id)
    if (doc) {
      setDraggedItem(doc)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDraggedItem(null)

    if (!over || !canEdit) return

    const draggedId = active.id as string
    const targetId = over.id as string

    const draggedDoc = documents.find(d => d.id === draggedId)
    const targetDoc = documents.find(d => d.id === targetId)

    if (!draggedDoc || draggedId === targetId) return

    // If dropping on a folder, nest inside it
    if (targetDoc?.isFolder) {
      const childCount = documents.filter(d => d.parentId === targetId).length
      const updated = documents.map(doc => 
        doc.id === draggedId 
          ? { ...doc, parentId: targetId, order: childCount }
          : doc
      )
      setDocuments(updated)
      toast.success(`Moved "${draggedDoc.title}" into "${targetDoc.title}"`)
      return
    }

    // If dropping on a page, convert target to folder and nest
    if (targetDoc && !targetDoc.isFolder) {
      const updated = documents.map(doc => {
        if (doc.id === targetId) {
          return { ...doc, isFolder: true }
        }
        if (doc.id === draggedId) {
          return { ...doc, parentId: targetId, order: 0 }
        }
        return doc
      })
      setDocuments(updated)
      toast.success(`Moved "${draggedDoc.title}" into "${targetDoc.title}"`)
      return
    }

    // Reorder within same level
    const draggedIndex = rootDocuments.findIndex(d => d.id === draggedId)
    const targetIndex = rootDocuments.findIndex(d => d.id === targetId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newOrder = arrayMove(rootDocuments, draggedIndex, targetIndex)
      const updated = documents.map(doc => {
        const newIndex = newOrder.findIndex(d => d.id === doc.id)
        if (newIndex !== -1 && !doc.parentId) {
          return { ...doc, order: newIndex }
        }
        return doc
      })
      setDocuments(updated)
    }
  }

  // Create folder handler
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name')
      return
    }

    const newFolder: Document = {
      id: `folder-${Date.now()}`,
      title: newFolderName.trim(),
      content: '',
      isFolder: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session?.user?.email || 'system',
      order: rootDocuments.length
    }

    setDocuments([...documents, newFolder])
    setShowNewFolderDialog(false)
    setNewFolderName('')
    toast.success('Folder created')
  }

  // SortablePageItem component
  const SortablePageItem = ({ doc, depth = 0 }: { doc: DocumentWithChildren, depth?: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: doc.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    const isExpanded = expandedCategories.has(doc.id)
    const children = doc.children || []
    const hasChildren = children.length > 0

    return (
      <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
        <div className="flex items-center group" style={{ marginLeft: `${depth * 1.5}rem` }}>
          {canEdit && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 p-1"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              "flex-1 justify-start text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
              selectedDocument?.id === doc.id && !doc.isFolder && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            )}
            onClick={() => {
              if (doc.isFolder) {
                const newExpanded = new Set(expandedCategories)
                if (newExpanded.has(doc.id)) {
                  newExpanded.delete(doc.id)
                } else {
                  newExpanded.add(doc.id)
                }
                setExpandedCategories(newExpanded)
              } else {
                setSelectedDocument(doc)
                setEditingDocument(doc)
                setIsEditing(canEdit)
              }
            }}
          >
            {doc.isFolder ? (
              <>
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1" />
                  )
                ) : (
                  <div className="h-4 w-4 mr-1" />
                )}
                <Folder className="h-4 w-4 mr-2" />
              </>
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            <span className="flex-1 text-left truncate">{doc.title}</span>
          </Button>
        </div>
        {isExpanded && hasChildren && (
          <SortableContext
            items={children.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {children.map(child => (
              <SortablePageItem key={child.id} doc={child} depth={depth + 1} />
            ))}
          </SortableContext>
        )}
      </div>
    )
  }

  // Build category tree with nested structure
  interface CategoryWithChildren extends Category {
    children?: CategoryWithChildren[]
  }

  const buildCategoryTree = (parentId?: string): CategoryWithChildren[] => {
    return categories
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map(category => ({
        ...category,
        children: buildCategoryTree(category.id)
      }))
  }

  const categoryTree = buildCategoryTree()

  // Get table of contents from document content
  const getTableOfContents = (content: string): Array<{ level: number; text: string; id: string }> => {
    const toc: Array<{ level: number; text: string; id: string }> = []
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi
    let match
    
    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1])
      const text = match[2].replace(/<[^>]*>/g, '').trim()
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      toc.push({ level, text, id })
    }
    
    return toc
  }

  const handleCreateDocument = () => {
    if (!newDocTitle.trim()) {
      toast.error('Please enter a document title')
      return
    }

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      content: `<h1>${newDocTitle.trim()}</h1>\n<p>Start writing...</p>`,
      categoryId: selectedCategory || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session?.user?.email || 'system',
      isPinned: false,
      isPublic: false,
      order: documents.length
    }

    setDocuments([...documents, newDoc])
    setSelectedDocument(newDoc)
    setEditingDocument(newDoc)
    setIsEditing(true)
    setShowNewDocDialog(false)
    setNewDocTitle('')
    toast.success('Document created')
  }

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name')
      return
    }

    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: newCategoryName.trim(),
      parentId: selectedCategory || undefined,
      order: categories.length,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setCategories([...categories, newCategory])
    setExpandedCategories(new Set([...expandedCategories, newCategory.id]))
    setShowNewCategoryDialog(false)
    setNewCategoryName('')
    toast.success('Category created')
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

  const handleToggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const selectedDocContent = editingDocument || selectedDocument
  const toc = selectedDocContent ? getTableOfContents(selectedDocContent.content) : []

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {isEditingNotebookName && canEdit ? (
            <Input
              value={editedNotebookName}
              onChange={(e) => setEditedNotebookName(e.target.value)}
              onBlur={() => {
                if (editedNotebookName.trim() && editedNotebookName !== notebookName) {
                  onNotebookNameChange?.(editedNotebookName.trim())
                } else {
                  setEditedNotebookName(notebookName)
                }
                setIsEditingNotebookName(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                } else if (e.key === 'Escape') {
                  setEditedNotebookName(notebookName)
                  setIsEditingNotebookName(false)
                }
              }}
              className="text-lg font-semibold h-8 px-2 max-w-md"
              autoFocus
            />
          ) : (
            <h1 
              className={cn(
                "text-lg font-semibold text-gray-900 dark:text-white",
                canEdit && "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              )}
              onClick={() => canEdit && setIsEditingNotebookName(true)}
            >
              {editedNotebookName}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNewFolderDialog(true)}
              className="text-gray-600 dark:text-gray-400"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowConfigDialog(true)}
            className="text-gray-600 dark:text-gray-400"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar - Notebook Name and Pages */}
        {config.showCategories && (
          <div className={cn(
            "border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col min-h-0",
            config.fullWidth ? "w-48" : "w-64"
          )}>
            {config.showSearch && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 h-full min-h-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="p-2">
                  {/* Notebook Name */}
                  <div className="px-3 py-2 mb-2">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {editedNotebookName}
                    </h2>
                  </div>

                  {/* Add New Page/Folder Dropdown */}
                  {canEdit && (
                    <div className="px-2 mb-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-8 text-xs justify-start"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            New
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem
                            onClick={() => setShowNewDocDialog(true)}
                            className="cursor-pointer"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            New Page
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setShowNewFolderDialog(true)}
                            className="cursor-pointer"
                          >
                            <FolderPlus className="h-4 w-4 mr-2" />
                            New Folder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {/* Sortable Pages Tree */}
                  <SortableContext
                    items={rootDocuments.map(d => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {documentTree.map(doc => (
                      <SortablePageItem key={doc.id} doc={doc} />
                    ))}
                  </SortableContext>

                  {documentTree.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No pages found
                    </div>
                  )}
                </div>
                <DragOverlay>
                  {draggedItem && (
                    <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border flex items-center gap-2">
                      {draggedItem.isFolder ? (
                        <Folder className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="text-sm">{draggedItem.title}</span>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            </ScrollArea>
          </div>
        )}

        {/* Main Content Area */}
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
                        if (isEditing && editingDocument) {
                          setEditingDocument({
                            ...editingDocument,
                            title: e.target.value
                          })
                        }
                      }}
                      className="h-8 w-[28rem] max-w-full"
                    />
                  ) : (
                    <h2 className="font-semibold text-gray-900 dark:text-white">{selectedDocContent.title}</h2>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && canEdit ? (
                    <Button 
                      size="sm" 
                      onClick={handleSaveDocument}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  ) : canEdit ? (
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
                  ) : null}
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

              {/* Editor/Preview - Full Page Notion Style */}
              <div className="flex-1 overflow-hidden relative">
                {/* Table of Contents - Top Left */}
                {config.showTableOfContents && toc.length > 0 && (
                  <div className="absolute top-4 left-4 z-10 w-64 bg-transparent p-4 max-h-[calc(100vh-200px)] overflow-auto pointer-events-auto">
                    <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Table of Contents</h3>
                    <nav className="space-y-1">
                      {toc.map((item, index) => (
                        <a
                          key={index}
                          href={`#${item.id}`}
                          className={cn(
                            "block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors",
                            item.level === 1 && "font-medium",
                            item.level === 2 && "ml-4",
                            item.level === 3 && "ml-8"
                          )}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}
                
                {/* Full Page Editor/Preview */}
                <div className="h-full overflow-auto bg-white dark:bg-gray-950">
                  <div className={cn(
                    "h-full",
                    config.fullWidth ? "max-w-full px-8" : "max-w-4xl mx-auto px-8 py-8",
                    config.showTableOfContents && toc.length > 0 && "pl-[280px]"
                  )}>
                    {isEditing ? (
                      <RichMarkdownEditor
                        content={editingDocument?.content || ''}
                        onChange={(content) => {
                          if (editingDocument) {
                            setEditingDocument({
                              ...editingDocument,
                              content
                            })
                          }
                        }}
                        editable={canEdit && isEditing}
                        className="h-full bg-white dark:bg-gray-950"
                      />
                    ) : (
                      <MarkdownRenderer
                        content={selectedDocument?.content || ''}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center max-w-md">
                <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No pages available</h3>
                <p className="text-gray-500 dark:text-gray-400">This notebook doesn't have any pages yet.</p>
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
            <Button onClick={handleCreateDocument} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>Enter a name for your new category</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateCategory()
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} className="bg-blue-600 hover:bg-blue-700 text-white">
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

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Page Settings</DialogTitle>
            <DialogDescription>Configure display options for this knowledge base</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="fullWidth">Full Width</Label>
                <p className="text-sm text-gray-500">Display content at full width</p>
              </div>
              <Switch
                id="fullWidth"
                checked={config.fullWidth}
                onCheckedChange={(checked) => setConfig({ ...config, fullWidth: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showTOC">Show Table of Contents</Label>
                <p className="text-sm text-gray-500">Display table of contents in preview</p>
              </div>
              <Switch
                id="showTOC"
                checked={config.showTableOfContents}
                onCheckedChange={(checked) => setConfig({ ...config, showTableOfContents: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showCategories">Show Categories</Label>
                <p className="text-sm text-gray-500">Display category sidebar</p>
              </div>
              <Switch
                id="showCategories"
                checked={config.showCategories}
                onCheckedChange={(checked) => setConfig({ ...config, showCategories: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showSearch">Show Search</Label>
                <p className="text-sm text-gray-500">Display search bar in sidebar</p>
              </div>
              <Switch
                id="showSearch"
                checked={config.showSearch}
                onCheckedChange={(checked) => setConfig({ ...config, showSearch: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowConfigDialog(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

