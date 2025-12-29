'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Monitor, Globe, Share2, Rocket } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

// Types
interface WebsitePWA {
  id: string
  name: string
  url: string
  iconUrl?: string
  isPublished: boolean
  currentVersion?: string
  createdAt: string
  updatedAt: string
}

export default function PwaManagerPage() {
  const router = useRouter()
  const [pwas, setPwas] = useState<WebsitePWA[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newPwaData, setNewPwaData] = useState({ name: '', url: 'https://' })

  useEffect(() => {
    fetchPwas()
  }, [])

  const fetchPwas = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/pwa')
      if (!res.ok) throw new Error('Failed to fetch PWAs')
      const data = await res.json()
      setPwas(data.pwas || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load PWAs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newPwaData.name || !newPwaData.url) {
      toast.error('Please fill in all fields')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPwaData)
      })
      
      if (!res.ok) throw new Error('Failed to create PWA')
      
      const data = await res.json()
      toast.success('PWA Project created')
      fetchPwas() // Refresh list
      setIsModalOpen(false)
      setNewPwaData({ name: '', url: 'https://' })
      
      if (data.pwa && data.pwa.id) {
        router.push(`/tools/pwa/${data.pwa.id}`)
      }
    } catch (error) {
      toast.error('Failed to create PWA project')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PWA Manager</h1>
          <p className="text-muted-foreground mt-2">
            Turn any website into a high-quality Progressive Web App.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New PWA Project
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pwas.map(pwa => (
            <div 
              key={pwa.id} 
              className="group border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer bg-card"
              onClick={() => router.push(`/tools/pwa/${pwa.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {pwa.iconUrl ? (
                    <img src={pwa.iconUrl} alt={pwa.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <Globe className="h-6 w-6" />
                  )}
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  pwa.isPublished 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                )}>
                  {pwa.isPublished ? 'Published' : 'Draft'} {pwa.currentVersion && `(${pwa.currentVersion})`}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{pwa.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-1">{pwa.url}</p>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 hover:text-foreground">
                   <Settings className="h-3 w-3" /> Config
                </div>
                <div className="flex items-center gap-1 hover:text-foreground ml-auto">
                   <Share2 className="h-3 w-3" /> Embed
                </div>
              </div>
            </div>
          ))}
          
          {pwas.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                <Rocket className="h-10 w-10 mb-4 opacity-50" />
                <p>No PWA projects yet. Create your first one!</p>
             </div>
          )}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New PWA Project</DialogTitle>
            <DialogDescription>
              Enter the details for your new Progressive Web App.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="My Awesome App"
                value={newPwaData.name}
                onChange={(e) => setNewPwaData({ ...newPwaData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={newPwaData.url}
                onChange={(e) => setNewPwaData({ ...newPwaData, url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
