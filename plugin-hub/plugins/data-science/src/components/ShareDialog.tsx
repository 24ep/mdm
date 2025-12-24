"use client"

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { NotebookRole } from './mock'

const mockUsers = [
  { id: 'u1', email: 'owner@example.com', role: 'owner' as NotebookRole },
  { id: 'u2', email: 'alice@example.com', role: 'editor' as NotebookRole },
  { id: 'u3', email: 'bob@example.com', role: 'viewer' as NotebookRole }
]

export function ShareDialog({ openId, onOpenChange }: { openId: string | null; onOpenChange: (id: string | null) => void }) {
  const [rows, setRows] = useState(mockUsers)
  const [inviteEmail, setInviteEmail] = useState('')
  const isOpen = useMemo(() => Boolean(openId), [openId])

  const setRole = (id: string, role: NotebookRole) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, role } : r))
  }

  const addInvite = () => {
    if (!inviteEmail.trim()) return
    setRows(prev => [...prev, { id: `inv-${Date.now()}`, email: inviteEmail.trim(), role: 'viewer' }])
    setInviteEmail('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onOpenChange(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Notebook</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {rows.map(u => (
            <div key={u.id} className="flex items-center justify-between gap-3">
              <div className="text-sm truncate">{u.email}</div>
              <Select value={u.role} onValueChange={(v) => setRole(u.id, v as NotebookRole)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Input placeholder="Invite by email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <Button variant="outline" onClick={addInvite}>Invite</Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(null)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
