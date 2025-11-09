'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { User, Users, X, Plus } from 'lucide-react'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { useModal } from '@/hooks/common'

interface ReportPermissionsDialogProps {
  reportId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface Permission {
  id?: string
  user_id?: string
  role_id?: string
  permission: 'view' | 'edit' | 'delete' | 'share'
  user_name?: string
  role_name?: string
  type: 'user' | 'role'
}

export function ReportPermissionsDialog({
  reportId,
  open,
  onOpenChange,
  onSuccess
}: ReportPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const addDialog = useModal()
  const [newPermission, setNewPermission] = useState({
    type: 'user' as 'user' | 'role',
    id: '',
    permission: 'view' as 'view' | 'edit' | 'delete' | 'share'
  })

  useEffect(() => {
    if (open && reportId) {
      loadPermissions()
      loadUsers()
      loadRoles()
    }
  }, [open, reportId])

  const loadPermissions = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/permissions`)
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  const handleAddPermission = async () => {
    if (!newPermission.id) {
      showError('Please select a user or role')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/reports/${reportId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [newPermission.type === 'user' ? 'user_id' : 'role_id']: newPermission.id,
          permission: newPermission.permission
        })
      })

      if (!response.ok) throw new Error('Failed to add permission')
      
      showSuccess(ToastMessages.CREATED)
      addDialog.close()
      setNewPermission({ type: 'user', id: '', permission: 'view' })
      loadPermissions()
      onSuccess?.()
    } catch (error: any) {
      showError(error.message || ToastMessages.CREATE_ERROR)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePermission = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/permissions/${permissionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete permission')
      
      showSuccess(ToastMessages.DELETED)
      loadPermissions()
      onSuccess?.()
    } catch (error: any) {
      showError(error.message || ToastMessages.DELETE_ERROR)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Permissions</DialogTitle>
            <DialogDescription>
              Manage who can view, edit, or delete this report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Permissions</h3>
              <Button size="sm" onClick={() => addDialog.open()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Permission
              </Button>
            </div>

            {permissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No permissions set. This report is only accessible to the owner.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User/Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell>
                        {perm.type === 'user' ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {perm.user_name || 'Unknown User'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {perm.role_name || 'Unknown Role'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {perm.type === 'user' ? 'User' : 'Role'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{perm.permission}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePermission(perm.id!)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Permission Dialog */}
      <Dialog open={addDialog.isOpen} onOpenChange={(open) => open ? addDialog.open() : addDialog.close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Permission</DialogTitle>
            <DialogDescription>
              Grant access to a user or role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select
                value={newPermission.type}
                  onValueChange={(value) => setNewPermission({ ...newPermission, type: value as 'user' | 'role', id: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{newPermission.type === 'user' ? 'User' : 'Role'}</Label>
              <Select
                value={newPermission.id}
                onValueChange={(value) => setNewPermission({ ...newPermission, id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${newPermission.type}`} />
                </SelectTrigger>
                <SelectContent>
                  {newPermission.type === 'user' 
                    ? users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))
                    : roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Permission Level</Label>
              <Select
                value={newPermission.permission}
                onValueChange={(value) => setNewPermission({ ...newPermission, permission: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="share">Share</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => addDialog.close()}>
              Cancel
            </Button>
            <Button onClick={handleAddPermission} disabled={loading}>
              {loading ? 'Adding...' : 'Add Permission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

