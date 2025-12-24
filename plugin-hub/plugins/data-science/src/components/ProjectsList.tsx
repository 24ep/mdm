"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Share2, Plus, Trash2 } from 'lucide-react'
import { mockProjects, NotebookRole } from './mock'
import { ShareDialog } from './ShareDialog'

function roleColor(role: NotebookRole) {
  switch (role) {
    case 'owner': return 'bg-purple-100 text-purple-700'
    case 'editor': return 'bg-blue-100 text-blue-700'
    case 'contributor': return 'bg-green-100 text-green-700'
    case 'viewer': return 'bg-gray-100 text-gray-700'
  }
}

export function ProjectsList() {
  const [shareId, setShareId] = useState<string | null>(null)
  const [projects, setProjects] = useState(mockProjects)
  const router = useRouter()

  const addProject = () => {
    const name = prompt('New project name')?.trim()
    if (!name) return
    const item = { id: `nb-${Date.now()}`, name, description: '', role: 'owner' as NotebookRole, updatedAt: new Date().toISOString() }
    setProjects(prev => [item, ...prev])
  }

  const removeProject = (id: string) => {
    if (!confirm('Remove this project?')) return
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Projects</h1>
        <Button size="sm" className="bg-blue-600 text-white" onClick={addProject}>
          <Plus className="h-4 w-4 mr-1" /> New Project
        </Button>
      </div>
      <div className="divide-y border rounded-md bg-white dark:bg-gray-900">
        {projects.map(p => (
          <div
            key={p.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => router.push(`/datascience/${p.id}?role=${p.role}`)}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{p.name}</span>
                <Badge className={roleColor(p.role)}>{p.role}</Badge>
              </div>
              {p.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.description}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setShareId(p.id) }}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); removeProject(p.id) }}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <ShareDialog openId={shareId} onOpenChange={setShareId} />
    </div>
  )
}
