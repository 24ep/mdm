'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Code, 
  Play, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Upload,
  FileText,
  BarChart3,
  Database,
  Image,
  Table,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Cell {
  id: string
  type: 'code' | 'markdown' | 'sql'
  content: string
  output?: any
  status: 'idle' | 'running' | 'success' | 'error'
  executionTime?: number
  language?: string
}

interface Notebook {
  id: string
  name: string
  description: string
  cells: Cell[]
  createdAt: Date
  updatedAt: Date
  spaceId?: string
}

export function DataScienceNotebook() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null)
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [newNotebookDescription, setNewNotebookDescription] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [spaces, setSpaces] = useState<any[]>([])
  const [selectedSpace, setSelectedSpace] = useState('all')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [notebookName, setNotebookName] = useState('')
  const [notebookDescription, setNotebookDescription] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadNotebooks()
    loadSpaces()
  }, [])

  const loadNotebooks = async () => {
    try {
      const response = await fetch('/api/admin/notebooks')
      if (response.ok) {
        const data = await response.json()
        setNotebooks(data.notebooks || [])
      }
    } catch (error) {
      console.error('Error loading notebooks:', error)
    }
  }

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  const createNotebook = async () => {
    if (!newNotebookName.trim()) {
      toast.error('Please enter a notebook name')
      return
    }

    try {
      const response = await fetch('/api/admin/notebooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newNotebookName.trim(),
          description: newNotebookDescription.trim(),
          spaceId: selectedSpace === 'all' ? null : selectedSpace
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNotebooks([...notebooks, data.notebook])
        setCurrentNotebook(data.notebook)
        setShowCreateDialog(false)
        setNewNotebookName('')
        setNewNotebookDescription('')
        toast.success('Notebook created successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create notebook')
      }
    } catch (error) {
      console.error('Error creating notebook:', error)
      toast.error('Failed to create notebook')
    }
  }

  const openNotebook = (notebook: Notebook) => {
    setCurrentNotebook(notebook)
  }

  const addCell = (type: 'code' | 'markdown' | 'sql') => {
    if (!currentNotebook) return

    const newCell: Cell = {
      id: Date.now().toString(),
      type,
      content: type === 'code' ? '# Your code here\nprint("Hello, World!")' : 
               type === 'sql' ? 'SELECT * FROM table_name LIMIT 10;' : 
               '# Markdown cell\n\nWrite your documentation here.',
      status: 'idle',
      language: type === 'code' ? 'python' : type === 'sql' ? 'sql' : 'markdown'
    }

    const updatedNotebook = {
      ...currentNotebook,
      cells: [...currentNotebook.cells, newCell]
    }

    setCurrentNotebook(updatedNotebook)
    setSelectedCell(newCell.id)
  }

  const updateCell = (cellId: string, content: string) => {
    if (!currentNotebook) return

    const updatedCells = currentNotebook.cells.map(cell =>
      cell.id === cellId ? { ...cell, content } : cell
    )

    setCurrentNotebook({
      ...currentNotebook,
      cells: updatedCells
    })
  }

  const executeCell = async (cellId: string) => {
    if (!currentNotebook) return

    const cell = currentNotebook.cells.find(c => c.id === cellId)
    if (!cell) return

    setIsExecuting(true)

    // Update cell status to running
    const updatedCells = currentNotebook.cells.map(c =>
      c.id === cellId ? { ...c, status: 'running' as const } : c
    )
    setCurrentNotebook({ ...currentNotebook, cells: updatedCells })

    try {
      const response = await fetch('/api/admin/execute-cell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cellId,
          notebookId: currentNotebook.id,
          content: cell.content,
          type: cell.type,
          language: cell.language
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        const finalCells = currentNotebook.cells.map(c =>
          c.id === cellId ? { 
            ...c, 
            status: 'success' as const, 
            output: result.output,
            executionTime: result.executionTime
          } : c
        )
        setCurrentNotebook({ ...currentNotebook, cells: finalCells })
        toast.success('Cell executed successfully')
      } else {
        const finalCells = currentNotebook.cells.map(c =>
          c.id === cellId ? { 
            ...c, 
            status: 'error' as const, 
            output: result.error 
          } : c
        )
        setCurrentNotebook({ ...currentNotebook, cells: finalCells })
        toast.error('Cell execution failed')
      }
    } catch (error) {
      console.error('Error executing cell:', error)
      const finalCells = currentNotebook.cells.map(c =>
        c.id === cellId ? { 
          ...c, 
          status: 'error' as const, 
          output: 'Execution failed' 
        } : c
      )
      setCurrentNotebook({ ...currentNotebook, cells: finalCells })
      toast.error('Failed to execute cell')
    } finally {
      setIsExecuting(false)
    }
  }

  const deleteCell = (cellId: string) => {
    if (!currentNotebook) return

    const updatedCells = currentNotebook.cells.filter(c => c.id !== cellId)
    setCurrentNotebook({ ...currentNotebook, cells: updatedCells })
  }

  const saveNotebook = async () => {
    if (!currentNotebook) return

    try {
      const response = await fetch(`/api/admin/notebooks/${currentNotebook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentNotebook),
      })

      if (response.ok) {
        toast.success('Notebook saved successfully')
        loadNotebooks()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save notebook')
      }
    } catch (error) {
      console.error('Error saving notebook:', error)
      toast.error('Failed to save notebook')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getCellIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <Code className="h-4 w-4" />
      case 'sql':
        return <Database className="h-4 w-4" />
      case 'markdown':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (!currentNotebook) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Code className="h-6 w-6" />
              Data Science Notebooks
            </h2>
            <p className="text-muted-foreground">
              Interactive notebooks for data analysis and visualization
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Notebook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Notebook</DialogTitle>
                <DialogDescription>
                  Create a new data science notebook
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Notebook Name</label>
                  <Input
                    value={newNotebookName}
                    onChange={(e) => setNewNotebookName(e.target.value)}
                    placeholder="Enter notebook name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newNotebookDescription}
                    onChange={(e) => setNewNotebookDescription(e.target.value)}
                    placeholder="Enter notebook description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Target Space</label>
                  <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select space" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Spaces</SelectItem>
                      {spaces.map(space => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createNotebook}>
                  Create Notebook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notebooks.map(notebook => (
            <Card 
              key={notebook.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openNotebook(notebook)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {notebook.name}
                </CardTitle>
                <CardDescription>{notebook.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{notebook.cells.length} cells</span>
                  <span>{notebook.updatedAt.toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentNotebook(null)}
          >
            ← Back to Notebooks
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Code className="h-6 w-6" />
              {currentNotebook.name}
            </h2>
            <p className="text-muted-foreground">{currentNotebook.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveNotebook}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button onClick={() => addCell('code')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Cell
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {currentNotebook.cells.map((cell, index) => (
          <Card key={cell.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCellIcon(cell.type)}
                  <span className="text-sm font-medium">
                    Cell {index + 1} - {cell.type.toUpperCase()}
                  </span>
                  {getStatusIcon(cell.status)}
                  {cell.executionTime && (
                    <Badge variant="secondary" className="text-xs">
                      {cell.executionTime}ms
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => executeCell(cell.id)}
                    disabled={isExecuting || cell.status === 'running'}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteCell(cell.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Textarea
                    ref={selectedCell === cell.id ? textareaRef : null}
                    value={cell.content}
                    onChange={(e) => updateCell(cell.id, e.target.value)}
                    className="min-h-[100px] font-mono text-sm"
                    placeholder={`Enter your ${cell.type} content here...`}
                    onClick={() => setSelectedCell(cell.id)}
                  />
                </div>
                
                {cell.output && (
                  <div className="border rounded p-4 bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Output:</span>
                      {cell.status === 'success' && (
                        <Badge variant="secondary" className="text-xs">
                          Success
                        </Badge>
                      )}
                      {cell.status === 'error' && (
                        <Badge variant="destructive" className="text-xs">
                          Error
                        </Badge>
                      )}
                    </div>
                    <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                      {typeof cell.output === 'string' ? cell.output : JSON.stringify(cell.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentNotebook.cells.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cells yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first cell to start working with this notebook
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => addCell('code')}>
                <Code className="h-4 w-4 mr-2" />
                Code Cell
              </Button>
              <Button variant="outline" onClick={() => addCell('sql')}>
                <Database className="h-4 w-4 mr-2" />
                SQL Cell
              </Button>
              <Button variant="outline" onClick={() => addCell('markdown')}>
                <FileText className="h-4 w-4 mr-2" />
                Markdown Cell
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
