'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Settings,
  Palette,
  Layout,
  GripVertical,
  Plus,
  Trash2,
  Edit,
  Copy,
  Move,
  GitBranch,
  History,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Tag
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { SidebarBuilder } from '@/components/studio/sidebar-builder'
import { PageBuilder } from '@/components/studio/page-builder'
import { ComponentLibrary } from '@/components/studio/component-library'
import { ComponentConfig } from '@/components/studio/component-config'
import { VersionControl } from '@/components/studio/version-control'
import { CanvasBackgroundConfig } from '@/components/studio/canvas-background-config'
import { AlignmentToolbar } from '@/components/studio/alignment-toolbar'
import { useHistory } from '@/hooks/use-history'
import { alignComponents, distributeComponents } from '@/lib/component-alignment'
import { createGroup, ungroupComponents, getGroupComponents } from '@/lib/component-grouping'
import { componentClipboard, duplicateComponents } from '@/lib/component-clipboard'

interface SidebarItem {
  id: string
  type: 'page' | 'divider' | 'group' | 'text'
  label: string
  icon?: string
  color?: string
  children?: SidebarItem[]
  isCollapsed?: boolean
}

interface PageComponent {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  config: any
  style: any
}

interface Page {
  id: string
  name: string
  path: string
  components: PageComponent[]
}

interface TemplateVersion {
  id: string
  version: string
  name: string
  description: string
  createdAt: Date
  createdBy: string
  isCurrent: boolean
  changes: string[]
  sidebarItems: SidebarItem[]
  pages: Page[]
  sidebarConfig: any
  canvasBackground?: any
}

interface VersionControlState {
  currentVersion: string
  hasUnsavedChanges: boolean
  versions: TemplateVersion[]
  isSaving: boolean
  showVersionDialog: boolean
  showHistoryDialog: boolean
  newVersionName: string
  newVersionDescription: string
}

const defaultSidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    type: 'page',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    color: '#3b82f6'
  },
  {
    id: 'assignments',
    type: 'page',
    label: 'Assignments',
    icon: 'UserCheck',
    color: '#10b981'
  },
  {
    id: 'data',
    type: 'page',
    label: 'Data',
    icon: 'Database',
    color: '#8b5cf6'
  },
  {
    id: 'workflows',
    type: 'page',
    label: 'Workflows',
    icon: 'GitBranch',
    color: '#f59e0b'
  },
  {
    id: 'settings',
    type: 'page',
    label: 'Settings',
    icon: 'Settings',
    color: '#6b7280'
  }
]

const defaultPages: Page[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    components: []
  },
  {
    id: 'assignments',
    name: 'Assignments',
    path: '/assignments',
    components: []
  },
  {
    id: 'data',
    name: 'Data',
    path: '/data',
    components: []
  },
  {
    id: 'workflows',
    name: 'Workflows',
    path: '/workflows',
    components: []
  },
  {
    id: 'settings',
    name: 'Settings',
    path: '/settings',
    components: []
  }
]

export default function SpaceStudioTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const { currentSpace } = useSpace()
  
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>(defaultSidebarItems)
  const [pages, setPages] = useState<Page[]>(defaultPages)
  const [activePage, setActivePage] = useState<string>('dashboard')
  const [selectedComponent, setSelectedComponent] = useState<PageComponent | null>(null)
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [componentGroups, setComponentGroups] = useState<any[]>([])
  const [clipboardData, setClipboardData] = useState<any>(null)
  const [sidebarConfig, setSidebarConfig] = useState({
    backgroundColor: '#ffffff',
    textColor: '#374151',
    iconSize: 'medium',
    showIcons: true,
    collapsed: false
  })

  // Canvas Background Configuration
  const [canvasBackground, setCanvasBackground] = useState({
    type: 'color' as 'color' | 'image',
    color: '#f8fafc',
    image: '',
    opacity: 1,
    blur: 0,
    position: 'center' as 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    size: 'cover' as 'cover' | 'contain' | 'auto' | '100%'
  })

  // Version Control State
  const [versionControl, setVersionControl] = useState<VersionControlState>({
    currentVersion: '1.0.0',
    hasUnsavedChanges: false,
    versions: [
      {
        id: 'v1',
        version: '1.0.0',
        name: 'Initial Version',
        description: 'Initial template setup',
        createdAt: new Date(),
        createdBy: 'System',
        isCurrent: true,
        changes: ['Initial template creation'],
        sidebarItems: defaultSidebarItems,
        pages: defaultPages,
        sidebarConfig: {
          backgroundColor: '#ffffff',
          textColor: '#374151',
          iconSize: 'medium',
          showIcons: true,
          collapsed: false
        },
        canvasBackground: {
          type: 'color',
          color: '#f8fafc',
          image: '',
          opacity: 1,
          blur: 0,
          position: 'center',
          size: 'cover'
        }
      }
    ],
    isSaving: false,
    showVersionDialog: false,
    showHistoryDialog: false,
    newVersionName: '',
    newVersionDescription: ''
  })

  // History management
  const {
    currentState: historyState,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory({
    sidebarItems,
    pages,
    sidebarConfig,
    canvasBackground,
    componentGroups
  })

  // Track changes for version control
  useEffect(() => {
    setVersionControl(prev => ({
      ...prev,
      hasUnsavedChanges: true
    }))
  }, [sidebarItems, pages, sidebarConfig, canvasBackground])

  // Clipboard management
  useEffect(() => {
    const unsubscribe = componentClipboard.subscribe(setClipboardData)
    return unsubscribe
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              handleRedo()
            } else {
              handleUndo()
            }
            break
          case 'y':
            e.preventDefault()
            handleRedo()
            break
          case 'c':
            e.preventDefault()
            handleCopy()
            break
          case 'x':
            e.preventDefault()
            handleCut()
            break
          case 'v':
            e.preventDefault()
            handlePaste()
            break
          case 'd':
            e.preventDefault()
            handleDuplicate()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo, handleCopy, handleCut, handlePaste, handleDuplicate])

  const handleSidebarUpdate = useCallback((items: SidebarItem[]) => {
    setSidebarItems(items)
  }, [])

  const handlePageUpdate = useCallback((pageId: string, components: PageComponent[]) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, components } : page
    ))
  }, [])

  const handleComponentSelect = useCallback((component: PageComponent | null) => {
    setSelectedComponent(component)
    if (component) {
      setSelectedComponents([component.id])
    } else {
      setSelectedComponents([])
    }
  }, [])

  const handleMultiSelect = useCallback((componentIds: string[]) => {
    setSelectedComponents(componentIds)
    if (componentIds.length === 1) {
      const component = currentPage?.components.find(comp => comp.id === componentIds[0])
      setSelectedComponent(component || null)
    } else {
      setSelectedComponent(null)
    }
  }, [currentPage])

  // Alignment functions
  const handleAlign = useCallback((alignment: string) => {
    if (!currentPage || selectedComponents.length < 2) return

    const selectedComps = currentPage.components.filter(comp => 
      selectedComponents.includes(comp.id)
    )
    
    const alignedComponents = alignComponents(selectedComps, alignment as any)
    const updatedComponents = currentPage.components.map(comp => {
      const aligned = alignedComponents.find(ac => ac.id === comp.id)
      return aligned || comp
    })

    addToHistory(`Align ${alignment}`, {
      ...historyState,
      pages: pages.map(page => 
        page.id === currentPage.id ? { ...page, components: updatedComponents } : page
      )
    })

    handlePageUpdate(currentPage.id, updatedComponents)
  }, [currentPage, selectedComponents, addToHistory, historyState, pages, handlePageUpdate])

  const handleDistribute = useCallback((distribution: string) => {
    if (!currentPage || selectedComponents.length < 3) return

    const selectedComps = currentPage.components.filter(comp => 
      selectedComponents.includes(comp.id)
    )
    
    const distributedComponents = distributeComponents(selectedComps, distribution as any)
    const updatedComponents = currentPage.components.map(comp => {
      const distributed = distributedComponents.find(dc => dc.id === comp.id)
      return distributed || comp
    })

    addToHistory(`Distribute ${distribution}`, {
      ...historyState,
      pages: pages.map(page => 
        page.id === currentPage.id ? { ...page, components: updatedComponents } : page
      )
    })

    handlePageUpdate(currentPage.id, updatedComponents)
  }, [currentPage, selectedComponents, addToHistory, historyState, pages, handlePageUpdate])

  // Grouping functions
  const handleGroup = useCallback(() => {
    if (!currentPage || selectedComponents.length < 2) return

    const selectedComps = currentPage.components.filter(comp => 
      selectedComponents.includes(comp.id)
    )
    
    const { updatedComponents, newGroup } = createGroup(selectedComps, selectedComponents)
    const updatedPages = pages.map(page => 
      page.id === currentPage.id ? { ...page, components: updatedComponents } : page
    )

    addToHistory('Group Components', {
      ...historyState,
      pages: updatedPages,
      componentGroups: [...componentGroups, newGroup]
    })

    setComponentGroups(prev => [...prev, newGroup])
    handlePageUpdate(currentPage.id, updatedComponents)
  }, [currentPage, selectedComponents, addToHistory, historyState, pages, componentGroups, handlePageUpdate])

  const handleUngroup = useCallback(() => {
    if (!currentPage || selectedComponents.length === 0) return

    const selectedComps = currentPage.components.filter(comp => 
      selectedComponents.includes(comp.id)
    )
    
    const groupIds = [...new Set(selectedComps.map(comp => comp.groupId).filter(Boolean))]
    
    let updatedComponents = currentPage.components
    let updatedGroups = componentGroups

    groupIds.forEach(groupId => {
      const { updatedComponents: newComponents, updatedGroups: newGroups } = 
        ungroupComponents(updatedComponents, updatedGroups, groupId)
      updatedComponents = newComponents
      updatedGroups = newGroups
    })

    const updatedPages = pages.map(page => 
      page.id === currentPage.id ? { ...page, components: updatedComponents } : page
    )

    addToHistory('Ungroup Components', {
      ...historyState,
      pages: updatedPages,
      componentGroups: updatedGroups
    })

    setComponentGroups(updatedGroups)
    handlePageUpdate(currentPage.id, updatedComponents)
  }, [currentPage, selectedComponents, addToHistory, historyState, pages, componentGroups, handlePageUpdate])

  // Clipboard functions
  const handleCopy = useCallback(() => {
    if (!currentPage || selectedComponents.length === 0) return

    const selectedComps = currentPage.components.filter(comp => 
      selectedComponents.includes(comp.id)
    )
    
    componentClipboard.copy(selectedComps)
  }, [currentPage, selectedComponents])

  const handleCut = useCallback(() => {
    if (!currentPage || selectedComponents.length === 0) return

    const selectedComps = currentPage.components.filter(comp => 
      selectedComponents.includes(comp.id)
    )
    
    componentClipboard.cut(selectedComps)
    
    const updatedComponents = currentPage.components.filter(comp => 
      !selectedComponents.includes(comp.id)
    )

    addToHistory('Cut Components', {
      ...historyState,
      pages: pages.map(page => 
        page.id === currentPage.id ? { ...page, components: updatedComponents } : page
      )
    })

    handlePageUpdate(currentPage.id, updatedComponents)
    setSelectedComponents([])
    setSelectedComponent(null)
  }, [currentPage, selectedComponents, addToHistory, historyState, pages, handlePageUpdate])

  const handlePaste = useCallback(() => {
    if (!currentPage || !componentClipboard.canPaste()) return

    const pastedComponents = componentClipboard.paste()
    const updatedComponents = [...currentPage.components, ...pastedComponents]

    addToHistory('Paste Components', {
      ...historyState,
      pages: pages.map(page => 
        page.id === currentPage.id ? { ...page, components: updatedComponents } : page
      )
    })

    handlePageUpdate(currentPage.id, updatedComponents)
    setSelectedComponents(pastedComponents.map(comp => comp.id))
  }, [currentPage, addToHistory, historyState, pages, handlePageUpdate])

  const handleDuplicate = useCallback(() => {
    if (!currentPage || selectedComponents.length === 0) return

    const selectedComps = currentPage.components.filter(comp => 
      selectedComponents.includes(comp.id)
    )
    
    const duplicatedComponents = duplicateComponents(selectedComps, selectedComponents)
    const updatedComponents = [...currentPage.components, ...duplicatedComponents]

    addToHistory('Duplicate Components', {
      ...historyState,
      pages: pages.map(page => 
        page.id === currentPage.id ? { ...page, components: updatedComponents } : page
      )
    })

    handlePageUpdate(currentPage.id, updatedComponents)
    setSelectedComponents(duplicatedComponents.map(comp => comp.id))
  }, [currentPage, selectedComponents, addToHistory, historyState, pages, handlePageUpdate])

  // History functions
  const handleUndo = useCallback(() => {
    const historyItem = undo()
    if (historyItem) {
      const state = historyItem.data
      setSidebarItems(state.sidebarItems)
      setPages(state.pages)
      setSidebarConfig(state.sidebarConfig)
      setCanvasBackground(state.canvasBackground)
      setComponentGroups(state.componentGroups)
    }
  }, [undo])

  const handleRedo = useCallback(() => {
    const historyItem = redo()
    if (historyItem) {
      const state = historyItem.data
      setSidebarItems(state.sidebarItems)
      setPages(state.pages)
      setSidebarConfig(state.sidebarConfig)
      setCanvasBackground(state.canvasBackground)
      setComponentGroups(state.componentGroups)
    }
  }, [redo])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'component') {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = Math.round((e.clientX - rect.left) / 20) * 20
        const y = Math.round((e.clientY - rect.top) / 20) * 20
        
        const newComponent = {
          ...data.component,
          x: Math.max(0, x),
          y: Math.max(0, y)
        }
        
        if (currentPage) {
          const updatedComponents = [...currentPage.components, newComponent]
          handlePageUpdate(currentPage.id, updatedComponents)
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }, [currentPage, handlePageUpdate])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Version Control Functions
  const handleCreateVersion = async () => {
    if (!versionControl.newVersionName.trim()) return

    setVersionControl(prev => ({ ...prev, isSaving: true }))

    try {
      const newVersion: TemplateVersion = {
        id: `v${Date.now()}`,
        version: generateNextVersion(versionControl.currentVersion),
        name: versionControl.newVersionName,
        description: versionControl.newVersionDescription,
        createdAt: new Date(),
        createdBy: 'Current User', // Replace with actual user
        isCurrent: true,
        changes: ['Template updated'],
        sidebarItems: [...sidebarItems],
        pages: [...pages],
        sidebarConfig: { ...sidebarConfig },
        canvasBackground: { ...canvasBackground }
      }

      // Mark all other versions as not current
      const updatedVersions = versionControl.versions.map(v => ({ ...v, isCurrent: false }))
      updatedVersions.push(newVersion)

      setVersionControl(prev => ({
        ...prev,
        versions: updatedVersions,
        currentVersion: newVersion.version,
        hasUnsavedChanges: false,
        isSaving: false,
        showVersionDialog: false,
        newVersionName: '',
        newVersionDescription: ''
      }))

      // Save to backend
      await saveVersionToBackend(newVersion)
    } catch (error) {
      console.error('Error creating version:', error)
      setVersionControl(prev => ({ ...prev, isSaving: false }))
    }
  }

  const handleLoadVersion = async (versionId: string) => {
    const version = versionControl.versions.find(v => v.id === versionId)
    if (!version) return

    // Update all other versions to not be current
    const updatedVersions = versionControl.versions.map(v => ({
      ...v,
      isCurrent: v.id === versionId
    }))

    setVersionControl(prev => ({
      ...prev,
      versions: updatedVersions,
      currentVersion: version.version,
      hasUnsavedChanges: false
    }))

    // Load version data
    setSidebarItems([...version.sidebarItems])
    setPages([...version.pages])
    setSidebarConfig({ ...version.sidebarConfig })
    if (version.canvasBackground) {
      setCanvasBackground({ ...version.canvasBackground })
    }
  }

  const handleSave = async () => {
    if (versionControl.hasUnsavedChanges) {
      setVersionControl(prev => ({ ...prev, showVersionDialog: true }))
    } else {
      // Just save current state
      await saveCurrentState()
    }
  }

  const saveCurrentState = async () => {
    setVersionControl(prev => ({ ...prev, isSaving: true }))
    try {
      // Save current state to backend
      await saveToBackend({
        sidebarItems,
        pages,
        sidebarConfig,
        canvasBackground,
        version: versionControl.currentVersion
      })
      setVersionControl(prev => ({ ...prev, isSaving: false, hasUnsavedChanges: false }))
    } catch (error) {
      console.error('Error saving:', error)
      setVersionControl(prev => ({ ...prev, isSaving: false }))
    }
  }

  const generateNextVersion = (currentVersion: string): string => {
    const parts = currentVersion.split('.')
    const major = parseInt(parts[0])
    const minor = parseInt(parts[1])
    const patch = parseInt(parts[2])
    return `${major}.${minor}.${patch + 1}`
  }

  const saveVersionToBackend = async (version: TemplateVersion) => {
    // Implement API call to save version
    console.log('Saving version to backend:', version)
  }

  const saveToBackend = async (data: any) => {
    // Implement API call to save current state
    console.log('Saving to backend:', data)
  }

  const handlePreview = () => {
    // Open preview in new tab
    window.open(`/${params.space}/preview`, '_blank')
  }

  const currentPage = pages.find(page => page.id === activePage)

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Space Studio</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {currentSpace?.name} • Template: {params.templateId}
              </p>
              <Badge variant="outline" className="text-xs">
                <GitBranch className="h-3 w-3 mr-1" />
                v{versionControl.currentVersion}
              </Badge>
              {versionControl.hasUnsavedChanges && (
                <Badge variant="destructive" className="text-xs">
                  Unsaved Changes
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setVersionControl(prev => ({ ...prev, showHistoryDialog: true }))}
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={versionControl.isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {versionControl.isSaving ? 'Saving...' : 'Save'}
            {versionControl.hasUnsavedChanges && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Unsaved
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Sidebar Builder */}
        <div className="w-80 border-r bg-background flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sidebar Configuration
            </h2>
          </div>
          <div className="flex-1 overflow-auto">
            <SidebarBuilder
              items={sidebarItems}
              config={sidebarConfig}
              onUpdate={handleSidebarUpdate}
              onConfigUpdate={setSidebarConfig}
            />
          </div>
        </div>

        {/* Center Panel - Page Builder */}
        <div className="flex-1 flex flex-col bg-muted/20">
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Page Builder
                </h2>
                <div className="flex items-center gap-2">
                  {pages.map(page => (
                    <Button
                      key={page.id}
                      variant={activePage === page.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActivePage(page.id)}
                    >
                      {page.name}
                    </Button>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Page
              </Button>
            </div>
            
            {/* Alignment Toolbar */}
            <div className="mt-4">
              <AlignmentToolbar
                selectedComponents={currentPage?.components.filter(comp => 
                  selectedComponents.includes(comp.id)
                ) || []}
                onAlign={handleAlign}
                onDistribute={handleDistribute}
                onGroup={handleGroup}
                onUngroup={handleUngroup}
                onCopy={handleCopy}
                onCut={handleCut}
                onPaste={handlePaste}
                onDuplicate={handleDuplicate}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                canPaste={componentClipboard.canPaste()}
                hasSelection={selectedComponents.length > 0}
                hasMultipleSelection={selectedComponents.length > 1}
                hasGroup={selectedComponents.some(id => 
                  currentPage?.components.find(comp => comp.id === id)?.groupId
                )}
              />
            </div>
          </div>
          
          <div 
            className="flex-1 overflow-auto p-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {currentPage && (
              <PageBuilder
                page={currentPage}
                onUpdate={(components) => handlePageUpdate(currentPage.id, components)}
                onComponentSelect={handleComponentSelect}
                onMultiSelect={handleMultiSelect}
                selectedComponent={selectedComponent}
                selectedComponents={selectedComponents}
                canvasBackground={canvasBackground}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Component Library & Config */}
        <div className="w-80 border-l bg-background flex flex-col">
          <Tabs defaultValue="components" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 m-4 mb-0">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="components" className="flex-1 overflow-auto">
              <ComponentLibrary />
            </TabsContent>
            
            <TabsContent value="config" className="flex-1 overflow-auto">
              {selectedComponent ? (
                <ComponentConfig
                  component={selectedComponent}
                  onUpdate={(updatedComponent) => {
                    if (currentPage) {
                      const updatedComponents = currentPage.components.map(comp =>
                        comp.id === updatedComponent.id ? updatedComponent : comp
                      )
                      handlePageUpdate(currentPage.id, updatedComponents)
                      setSelectedComponent(updatedComponent)
                    }
                  }}
                />
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a component to configure</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="canvas" className="flex-1 overflow-auto">
              <CanvasBackgroundConfig
                background={canvasBackground}
                onUpdate={setCanvasBackground}
              />
            </TabsContent>

            <TabsContent value="versions" className="flex-1 overflow-auto">
              <VersionControl
                currentVersion={versionControl.currentVersion}
                versions={versionControl.versions}
                hasUnsavedChanges={versionControl.hasUnsavedChanges}
                onLoadVersion={handleLoadVersion}
                onCreateVersion={() => setVersionControl(prev => ({ ...prev, showVersionDialog: true }))}
                onExportVersion={(version) => {
                  const dataStr = JSON.stringify(version, null, 2)
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `template-version-${version.version}.json`
                  link.click()
                }}
                onImportVersion={async (file) => {
                  try {
                    const text = await file.text()
                    const version = JSON.parse(text)
                    // Handle imported version
                    console.log('Imported version:', version)
                  } catch (error) {
                    console.error('Error importing version:', error)
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Version Control Dialogs */}
      
      {/* Create Version Dialog */}
      <Dialog 
        open={versionControl.showVersionDialog} 
        onOpenChange={(open) => setVersionControl(prev => ({ ...prev, showVersionDialog: open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Create New Version
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="version-name">Version Name</Label>
              <Input
                id="version-name"
                value={versionControl.newVersionName}
                onChange={(e) => setVersionControl(prev => ({ ...prev, newVersionName: e.target.value }))}
                placeholder="e.g., Added new dashboard components"
              />
            </div>
            <div>
              <Label htmlFor="version-description">Description</Label>
              <Textarea
                id="version-description"
                value={versionControl.newVersionDescription}
                onChange={(e) => setVersionControl(prev => ({ ...prev, newVersionDescription: e.target.value }))}
                placeholder="Describe what changes were made in this version..."
                rows={3}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Next version: <Badge variant="outline">{generateNextVersion(versionControl.currentVersion)}</Badge></p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setVersionControl(prev => ({ ...prev, showVersionDialog: false }))}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateVersion}
              disabled={!versionControl.newVersionName.trim() || versionControl.isSaving}
            >
              {versionControl.isSaving ? 'Creating...' : 'Create Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog 
        open={versionControl.showHistoryDialog} 
        onOpenChange={(open) => setVersionControl(prev => ({ ...prev, showHistoryDialog: open }))}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-auto">
            {versionControl.versions.map((version) => (
              <Card key={version.id} className={`${version.isCurrent ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{version.name}</h4>
                        <Badge variant={version.isCurrent ? "default" : "outline"}>
                          v{version.version}
                        </Badge>
                        {version.isCurrent && (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {version.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.createdBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {version.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      {version.changes.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Changes:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {version.changes.map((change, index) => (
                              <li key={index} className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!version.isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadVersion(version.id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Export version functionality
                          const dataStr = JSON.stringify(version, null, 2)
                          const dataBlob = new Blob([dataStr], { type: 'application/json' })
                          const url = URL.createObjectURL(dataBlob)
                          const link = document.createElement('a')
                          link.href = url
                          link.download = `template-version-${version.version}.json`
                          link.click()
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setVersionControl(prev => ({ ...prev, showHistoryDialog: false }))}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setVersionControl(prev => ({ ...prev, showHistoryDialog: false, showVersionDialog: true }))
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
