'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { DeepNoteLayoutRefactored } from '@/components/datascience/DeepNoteLayoutRefactored'
import { getRoleCapabilities, NotebookRole } from '@/components/datascience/mock'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { PanelLeft, Save as SaveIcon, Settings, FileText, Eye, Edit } from 'lucide-react'

// minimal mock notebook
const mockNotebook = (id: string) => ({
  id,
  name: `Notebook ${id}`,
  description: '',
  cells: [
    { id: 'c1', type: 'markdown', title: 'Intro', content: '# Hello\nSome notes', status: 'idle', timestamp: new Date(), metadata: {} },
    { id: 'c2', type: 'code', title: 'Py', content: 'print("hello")', status: 'idle', timestamp: new Date(), metadata: {} },
    { id: 'c3', type: 'sql', title: 'Query', content: 'select 1', sqlQuery: 'select 1', status: 'idle', timestamp: new Date(), metadata: {} },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
  isPublic: false,
  author: 'system',
  theme: 'light',
  settings: { autoSave: true, executionMode: 'sequential', showLineNumbers: true, fontSize: 14, tabSize: 2, wordWrap: true }
})

export default function NotebookPage() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const role = (search.get('role') || 'viewer') as NotebookRole
  const caps = useMemo(() => getRoleCapabilities(role), [role])
  const [editToggle, setEditToggle] = useState(false)
  const [activeTab, setActiveTab] = useState('notebook')
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const nb = useMemo(() => mockNotebook(params.id), [params.id])
  const [controls, setControls] = useState<{ toggleSidebar: () => void; save: () => void; openSettings: () => void; renameProject?: (name: string) => void } | null>(null)
  const [title, setTitle] = useState(nb.name)
  
  // keep title in sync if notebook changes
  

  const effectiveCanEdit = caps.canEdit && editToggle

  return (
    <PlatformLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      selectedSpace={selectedSpace}
      onSpaceChange={setSelectedSpace}
    >
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
            {caps.canEdit ? (
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  controls?.renameProject?.(e.target.value)
                }}
                className="text-sm font-medium bg-transparent border-b border-transparent focus:border-blue-400 outline-none text-gray-900 dark:text-gray-100 truncate"
                aria-label="Project title"
              />
            ) : (
              <span className="text-sm font-medium truncate">{title}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-9 px-3" onClick={() => controls?.toggleSidebar()}>
              <PanelLeft className="h-4 w-4 mr-1" />
              <span className="text-xs">Toggle Sidebar</span>
            </Button>
            {caps.canEdit && (
              <>
                <Button size="sm" variant="outline" className="h-9 px-3" onClick={() => controls?.save()}>
                  <SaveIcon className="h-4 w-4 mr-1" /> Save
                </Button>
                <Button size="sm" variant="ghost" className="h-9 px-3" onClick={() => controls?.openSettings()}>
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
            {caps.canEdit && (
              <Button
                size="sm"
                variant={editToggle ? 'default' : 'outline'}
                className="h-9 px-3 text-xs"
                onClick={() => setEditToggle(!editToggle)}
                title="Toggle View/Edit"
              >
                {editToggle ? (
                  <>
                    <Edit className="h-4 w-4 mr-1" /> Edit mode
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" /> View mode
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <DeepNoteLayoutRefactored
            initialNotebook={nb as any}
            canEdit={effectiveCanEdit}
            canExecute={caps.canExecute}
            onControlsReady={setControls}
          />
        </div>
      </div>
    </PlatformLayout>
  )
}
