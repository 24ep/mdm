'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Key, 
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Settings,
  Globe,
  Folder,
  Download,
  Upload
} from 'lucide-react'
import toast from 'react-hot-toast'
import { User } from '../types'

interface Space {
  id: string
  name: string
  slug: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [spaceFilter, setSpaceFilter] = useState('all')
  
  // User management
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'USER',
    isActive: true,
    defaultSpaceId: '',
    spaces: [] as Array<{ spaceId: string; role: string }>
  })
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    isActive: true,
    defaultSpaceId: '',
    spaces: [] as Array<{ spaceId: string; role: string }>
  })
  const [creatingUser, setCreatingUser] = useState(false)

  // Reset password
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

  // Bulk operations
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [bulkOperation, setBulkOperation] = useState<'role' | 'space' | 'activate' | 'deactivate' | 'delete' | null>(null)
  const [bulkRole, setBulkRole] = useState('')
  const [bulkSpaceId, setBulkSpaceId] = useState('')
  const [bulkSpaceRole, setBulkSpaceRole] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Import
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ success: any[]; failed: any[] } | null>(null)

  const pages = useMemo(() => Math.ceil(total / limit), [total, limit])

  useEffect(() => {
    loadUsers()
    loadSpaces()
  }, [page, limit, roleFilter, activeFilter, spaceFilter, search])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        role: roleFilter === 'all' ? '' : roleFilter,
        active: activeFilter === 'all' ? '' : activeFilter,
        spaceId: spaceFilter === 'all' ? '' : spaceFilter
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match the component's interface
        const transformedUsers = data.users?.map((user: any) => ({
          ...user,
          isActive: user.is_active,
          lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined,
          defaultSpaceId: user.default_space_id,
          avatar: user.avatar,
          createdAt: new Date(user.created_at)
        })) || []
        setUsers(transformedUsers)
        setTotal(data.total || 0)
        setError(null)
      } else {
        let message = 'Failed to load users'
        try {
          const err = await response.json()
          if (err?.error) message = err.error
        } catch {}
        setError(`${response.status} ${message}`)
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load users')
    } finally {
      setLoading(false)
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

  const openCreateDialog = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      isActive: true,
      defaultSpaceId: '',
      spaces: []
    })
    setShowCreateDialog(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      defaultSpaceId: user.defaultSpaceId || '',
      spaces: user.spaces || []
    })
    setShowEditDialog(true)
  }

  const createUser = async () => {
    if (!createForm.email || !createForm.name || !createForm.password) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreatingUser(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createForm.email,
          name: createForm.name,
          password: createForm.password,
          role: createForm.role,
          isActive: createForm.isActive,
          defaultSpaceId: createForm.defaultSpaceId && createForm.defaultSpaceId !== 'none' ? createForm.defaultSpaceId : null,
          spaces: createForm.spaces
        }),
      })

      if (response.ok) {
        toast.success('User created successfully')
        setShowCreateDialog(false)
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'USER',
          isActive: true,
          defaultSpaceId: '',
          spaces: []
        })
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const saveUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        toast.success('User updated successfully')
        setShowEditDialog(false)
        setEditingUser(null)
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const resetPassword = async () => {
    if (!resetPasswordUser || !newPassword || newPassword !== confirmPassword) {
      toast.error('Please enter matching passwords')
      return
    }

    setResettingPassword(true)
    try {
      const response = await fetch(`/api/admin/users/${resetPasswordUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (response.ok) {
        toast.success('Password reset successfully')
        setShowResetPasswordDialog(false)
        setResetPasswordUser(null)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'ADMIN':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'USER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across all spaces
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {
            // Navigate to role management
            const url = new URL(window.location.href)
            url.searchParams.set('tab', 'roles')
            window.location.href = url.toString()
          }}>
            <Shield className="h-4 w-4 mr-2" />
            Manage Roles
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const params = new URLSearchParams({
                  search,
                  role: roleFilter === 'all' ? '' : roleFilter,
                  active: activeFilter === 'all' ? '' : activeFilter,
                  spaceId: spaceFilter === 'all' ? '' : spaceFilter
                })
                const response = await fetch(`/api/admin/users/export?${params}`)
                if (response.ok) {
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                  toast.success('Users exported successfully')
                } else {
                  toast.error('Failed to export users')
                }
              } catch (error) {
                console.error('Error exporting users:', error)
                toast.error('Failed to export users')
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              if (selectedUserIds.length === 0) {
                toast.error('Please select users first')
                return
              }
              setShowBulkDialog(true)
            }}
            disabled={selectedUserIds.length === 0}
          >
            <Users className="h-4 w-4 mr-2" />
            Bulk Actions ({selectedUserIds.length})
          </Button>
          <Button onClick={openCreateDialog}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={spaceFilter} onValueChange={setSpaceFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Spaces" />
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
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className={`flex items-center gap-4 p-4 border rounded hover:bg-muted/50 transition-colors ${selectedUserIds.includes(user.id) ? 'bg-primary/10 border-primary' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds([...selectedUserIds, user.id])
                        } else {
                          setSelectedUserIds(selectedUserIds.filter(id => id !== user.id))
                        }
                      }}
                      className="rounded"
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{user.name}</span>
                        {getStatusIcon(user.isActive)}
                        <Badge className={`text-xs ${getRoleColor(user.role)}`} variant="default">
                          Global: {user.role}
                        </Badge>
                        {user.spaces && user.spaces.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {user.spaces.slice(0, 3).map((space, idx) => (
                              <Badge key={idx} className="text-xs" variant="outline">
                                {space.spaceName}: {space.role}
                              </Badge>
                            ))}
                            {user.spaces.length > 3 && (
                              <Badge className="text-xs" variant="outline">
                                +{user.spaces.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                        {user.lastLoginAt && (
                          <span> • Last login {new Date(user.lastLoginAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowUserDetails(true)
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResetPasswordUser(user)
                          setShowResetPasswordDialog(true)
                        }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page === pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Avatar Upload */}
            {editingUser && (
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <AvatarUpload
                  userId={editingUser.id}
                  currentAvatar={editingUser.avatar}
                  userName={editForm.name}
                  userEmail={editForm.email}
                  onAvatarChange={(avatarUrl) => {
                    // Update the user in the list
                    setUsers(users.map(u => 
                      u.id === editingUser.id ? { ...u, avatar: avatarUrl || undefined } : u
                    ))
                    // Update editing user
                    setEditingUser({ ...editingUser, avatar: avatarUrl || undefined })
                  }}
                  size="lg"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Global Role (System-wide)
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  This role applies across all spaces and controls system-level access
                </p>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-default-space">Default Space</Label>
                <Select value={editForm.defaultSpaceId} onValueChange={(value) => setEditForm({ ...editForm, defaultSpaceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default space" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default space</SelectItem>
                    {spaces.map(space => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingUser && editingUser.spaces && editingUser.spaces.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Space Roles
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Roles assigned in specific spaces
                  </p>
                  <div className="space-y-2">
                    {editingUser.spaces.map((space) => (
                      <div key={space.spaceId} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="text-sm font-medium">{space.spaceName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {space.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Note: Space roles are managed from the space settings
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-name">Name *</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-role">Role</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-default-space">Default Space</Label>
                <Select value={createForm.defaultSpaceId} onValueChange={(value) => setCreateForm({ ...createForm, defaultSpaceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default space" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default space</SelectItem>
                    {spaces.map(space => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="create-active"
                checked={createForm.isActive}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, isActive: checked })}
              />
              <Label htmlFor="create-active">Active</Label>
            </div>

            {/* Space Assignments */}
            <div className="space-y-2">
              <Label>Space Access</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Assign user to spaces and set their role in each space
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {spaces.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No spaces available</div>
                ) : (
                  spaces.map(space => {
                    const userSpace = createForm.spaces.find((s: any) => s.spaceId === space.id)
                    return (
                      <div key={space.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`create-space-${space.id}`}
                            checked={!!userSpace}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreateForm({
                                  ...createForm,
                                  spaces: [...createForm.spaces, { spaceId: space.id, role: 'member' }]
                                })
                              } else {
                                setCreateForm({
                                  ...createForm,
                                  spaces: createForm.spaces.filter((s: any) => s.spaceId !== space.id)
                                })
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`create-space-${space.id}`} className="text-sm cursor-pointer">
                            {space.name}
                          </label>
                        </div>
                        {userSpace && (
                          <Select
                            value={userSpace.role}
                            onValueChange={(role) => {
                              setCreateForm({
                                ...createForm,
                                spaces: createForm.spaces.map((s: any) =>
                                  s.spaceId === space.id ? { ...s, role } : s
                                )
                              })
                            }}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createUser} disabled={creatingUser}>
              {creatingUser ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Operations Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Apply actions to {selectedUserIds.length} selected user(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Operation Type</Label>
              <Select value={bulkOperation || ''} onValueChange={(value) => setBulkOperation(value as 'role' | 'space' | 'activate' | 'deactivate' | 'delete' | null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Update Global Role</SelectItem>
                  <SelectItem value="space">Assign to Space</SelectItem>
                  <SelectItem value="activate">Activate Users</SelectItem>
                  <SelectItem value="deactivate">Deactivate Users</SelectItem>
                  <SelectItem value="delete">Delete Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkOperation === 'role' && (
              <div>
                <Label>Global Role</Label>
                <Select value={bulkRole} onValueChange={setBulkRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {bulkOperation === 'space' && (
              <div className="space-y-4">
                <div>
                  <Label>Space</Label>
                  <Select value={bulkSpaceId} onValueChange={setBulkSpaceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select space" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaces.map(space => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Space Role</Label>
                  <Select value={bulkSpaceRole} onValueChange={setBulkSpaceRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(bulkOperation === 'activate' || bulkOperation === 'deactivate') && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  This will {bulkOperation === 'activate' ? 'activate' : 'deactivate'} {selectedUserIds.length} selected user(s).
                  {bulkOperation === 'deactivate' && ' Deactivated users will not be able to log in.'}
                </p>
              </div>
            )}

            {bulkOperation === 'delete' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                <p className="text-sm text-red-900 dark:text-red-200 font-semibold">
                  ⚠️ Warning: This action cannot be undone. This will permanently delete {selectedUserIds.length} user(s) and all their associated data.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkDialog(false)
              setBulkOperation(null)
              setBulkRole('')
              setBulkSpaceId('')
              setBulkSpaceRole('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!bulkOperation) {
                  toast.error('Please select an operation')
                  return
                }
                if (bulkOperation === 'role' && !bulkRole) {
                  toast.error('Please select a role')
                  return
                }
                if (bulkOperation === 'space' && (!bulkSpaceId || !bulkSpaceRole)) {
                  toast.error('Please select space and role')
                  return
                }
                if (bulkOperation === 'delete') {
                  if (!confirm(`Are you sure you want to permanently delete ${selectedUserIds.length} user(s)? This action cannot be undone.`)) {
                    return
                  }
                }

                setBulkProcessing(true)
                try {
                  const response = await fetch('/api/admin/users/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userIds: selectedUserIds,
                      operation: ['activate', 'deactivate', 'delete'].includes(bulkOperation) ? bulkOperation : undefined,
                      role: bulkOperation === 'role' ? bulkRole : undefined,
                      spaceId: bulkOperation === 'space' ? bulkSpaceId : undefined,
                      spaceRole: bulkOperation === 'space' ? bulkSpaceRole : undefined
                    })
                  })

                  if (response.ok) {
                    const data = await response.json()
                    const actionName = bulkOperation === 'delete' ? 'deleted' : bulkOperation === 'activate' ? 'activated' : bulkOperation === 'deactivate' ? 'deactivated' : 'updated'
                    toast.success(`Successfully ${actionName} ${data.results.success.length} user(s)`)
                    if (data.results.failed.length > 0) {
                      toast.error(`${data.results.failed.length} user(s) failed: ${data.results.failed.map((f: any) => f.error).join(', ')}`)
                    }
                    setShowBulkDialog(false)
                    setSelectedUserIds([])
                    setBulkOperation(null)
                    setBulkRole('')
                    setBulkSpaceId('')
                    setBulkSpaceRole('')
                    loadUsers()
                  } else {
                    const error = await response.json()
                    toast.error(error.error || 'Bulk operation failed')
                  }
                } catch (error) {
                  console.error('Error in bulk operation:', error)
                  toast.error('Bulk operation failed')
                } finally {
                  setBulkProcessing(false)
                }
              }}
              disabled={bulkProcessing || !bulkOperation || (bulkOperation === 'role' && !bulkRole) || (bulkOperation === 'space' && (!bulkSpaceId || !bulkSpaceRole))}
              variant={bulkOperation === 'delete' ? 'destructive' : 'default'}
            >
              {bulkProcessing ? 'Processing...' : bulkOperation === 'delete' ? 'Delete Users' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="text-2xl">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusIcon(selectedUser.isActive)}
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">User ID</Label>
                  <p className="text-sm font-mono">{selectedUser.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="text-sm">{selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                {selectedUser.lastLoginAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Login</Label>
                    <p className="text-sm">{new Date(selectedUser.lastLoginAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedUser.defaultSpaceId && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Default Space</Label>
                    <p className="text-sm">{spaces.find(s => s.id === selectedUser.defaultSpaceId)?.name || 'N/A'}</p>
                  </div>
                )}
              </div>

              {selectedUser.spaces && selectedUser.spaces.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-2 block">Space Memberships</Label>
                  <div className="space-y-2">
                    {selectedUser.spaces.map((space, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm font-medium">{space.spaceName}</span>
                        <Badge variant="outline">{space.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUserDetails(false)
                    openEditDialog(selectedUser)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUserDetails(false)
                    setResetPasswordUser(selectedUser)
                    setShowResetPasswordDialog(true)
                  }}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPasswordUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={resetPassword} disabled={resettingPassword}>
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Users Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Users</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import users. Required columns: name, email, password. Optional: role, isActive
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!importResults ? (
              <>
                <div>
                  <Label htmlFor="import-file">CSV File</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setImportFile(file)
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    CSV format: name,email,password,role,isActive
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Example CSV:</strong><br />
                    name,email,password,role,isActive<br />
                    John Doe,john@example.com,password123,USER,true<br />
                    Jane Smith,jane@example.com,password456,ADMIN,true
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <p className="text-sm text-green-900 dark:text-green-200 font-semibold">
                    Successfully imported {importResults.success.length} user(s)
                  </p>
                </div>
                {importResults.failed.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-sm text-red-900 dark:text-red-200 font-semibold mb-2">
                      Failed to import {importResults.failed.length} user(s):
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResults.failed.map((failure, idx) => (
                        <p key={idx} className="text-xs text-red-800 dark:text-red-200">
                          {failure.email}: {failure.error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            {importResults ? (
              <>
                <Button variant="outline" onClick={() => {
                  setShowImportDialog(false)
                  setImportFile(null)
                  setImportResults(null)
                  loadUsers()
                }}>
                  Close
                </Button>
                <Button onClick={() => {
                  setImportFile(null)
                  setImportResults(null)
                }}>
                  Import More
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => {
                  setShowImportDialog(false)
                  setImportFile(null)
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (!importFile) {
                      toast.error('Please select a file')
                      return
                    }

                    setImporting(true)
                    try {
                      const formData = new FormData()
                      formData.append('file', importFile)

                      const response = await fetch('/api/admin/users/import', {
                        method: 'POST',
                        body: formData
                      })

                      if (response.ok) {
                        const data = await response.json()
                        setImportResults(data.results)
                        toast.success(`Imported ${data.results.success.length} user(s)`)
                        if (data.results.failed.length > 0) {
                          toast.error(`${data.results.failed.length} user(s) failed to import`)
                        }
                      } else {
                        const error = await response.json()
                        toast.error(error.error || 'Failed to import users')
                      }
                    } catch (error) {
                      console.error('Error importing users:', error)
                      toast.error('Failed to import users')
                    } finally {
                      setImporting(false)
                    }
                  }}
                  disabled={!importFile || importing}
                >
                  {importing ? 'Importing...' : 'Import Users'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
