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
  ArrowLeft,
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
  FilePlus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { MarkdownRenderer } from '@/components/knowledge-base/MarkdownRenderer'

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
  isPinned?: boolean
  isPublic?: boolean
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
  onBack: () => void
}

export function KnowledgePage({ notebookId, notebookName, onBack }: KnowledgePageProps) {
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
  const [config, setConfig] = useState<KnowledgePageConfig>({
    fullWidth: false,
    showTableOfContents: true,
    showCategories: true,
    showSearch: true
  })

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

  useEffect(() => {
    localStorage.setItem(`knowledge-base-${notebookId}-config`, JSON.stringify(config))
  }, [config, notebookId])

  // Filter documents
  const filteredDocuments = searchQuery
    ? documents.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedCategory
    ? documents.filter(doc => doc.categoryId === selectedCategory)
    : documents.filter(doc => !doc.categoryId)

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
    <div className="h-full flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600 dark:text-gray-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{notebookName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowConfigDialog(true)}
            className="text-gray-600 dark:text-gray-400"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNewCategoryDialog(true)}
            className="text-gray-600 dark:text-gray-400"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Category
          </Button>
          <Button
            size="sm"
            onClick={() => setShowNewDocDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar - Categories */}
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
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 h-full min-h-0">
              <div className="p-2">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start mb-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    !selectedCategory && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  )}
                  onClick={() => {
                    setSelectedCategory(null)
                    setSelectedDocument(null)
                    setIsEditing(false)
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  All Documents
                </Button>

                {/* Recursive Category Tree Renderer */}
                {(() => {
                  const renderCategoryTree = (categories: CategoryWithChildren[], depth: number = 0): JSX.Element[] => {
                    return categories.map(category => {
                      const categoryDocs = documents.filter(doc => doc.categoryId === category.id)
                      const isExpanded = expandedCategories.has(category.id)
                      const isSelected = selectedCategory === category.id
                      const hasChildren = category.children && category.children.length > 0
                      const hasDocs = categoryDocs.length > 0

                      return (
                        <div key={category.id} style={{ marginLeft: `${depth * 1.5}rem` }}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                              isSelected && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            )}
                            onClick={() => {
                              if (hasChildren || hasDocs) {
                                handleToggleCategory(category.id)
                              }
                              setSelectedCategory(category.id)
                            }}
                          >
                            {(hasChildren || hasDocs) ? (
                              isExpanded ? (
                                <ChevronDown className="h-4 w-4 mr-1" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-1" />
                              )
                            ) : (
                              <div className="h-4 w-4 mr-1" />
                            )}
                            <Folder className="h-4 w-4 mr-2" />
                            <span className="flex-1 text-left truncate">{category.name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {categoryDocs.length}
                            </Badge>
                          </Button>
                          {isExpanded && (
                            <div>
                              {/* Render child categories */}
                              {category.children && category.children.length > 0 && (
                                <div>
                                  {renderCategoryTree(category.children, depth + 1)}
                                </div>
                              )}
                              {/* Render documents in this category */}
                              {categoryDocs.map(doc => (
                                <Button
                                  key={doc.id}
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 ml-6",
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
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  }

                  return renderCategoryTree(categoryTree)
                })()}

                {filteredDocuments
                  .filter(doc => !doc.categoryId)
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
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="flex-1 text-left truncate">{doc.title}</span>
                    </Button>
                  ))}
              </div>
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

              {/* Editor/Preview - Full Page Notion Style */}
              <div className="flex-1 overflow-hidden relative">
                {/* Table of Contents - Top Left */}
                {config.showTableOfContents && toc.length > 0 && (
                  <div className="absolute top-4 left-4 z-10 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-4 max-h-[calc(100vh-200px)] overflow-auto">
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
                    "min-h-full",
                    config.fullWidth ? "max-w-full px-8" : "max-w-4xl mx-auto px-8 py-8"
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
                        editable={true}
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
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No document selected</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Select a document from the sidebar or create a new one</p>
                <Button 
                  onClick={() => setShowNewDocDialog(true)}
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

