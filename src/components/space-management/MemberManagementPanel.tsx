'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserInviteInput } from '@/components/ui/user-invite-input'
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreVertical, 
  UserPlus, 
  Users, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Mail,
  FileText,
  BarChart3
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'

interface Member {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_system_role: string
  role: 'member' | 'admin' | 'owner'
  joined_at: string
  last_active?: string
  is_active: boolean
  avatar?: string
}

interface MemberManagementPanelProps {
  spaceId: string
  members: Member[]
  onInvite: (user: any, role: string) => Promise<void>
  onUpdateRole: (userId: string, role: string) => Promise<void>
  onRemoveMember: (userId: string) => Promise<void>
  onBulkOperation: (operation: string, userIds: string[], data?: any) => Promise<void>
  canManageMembers: boolean
  loading?: boolean
}

export function MemberManagementPanel({
  spaceId,
  members,
  onInvite,
  onUpdateRole,
  onRemoveMember,
  onBulkOperation,
  canManageMembers,
  loading = false
}: MemberManagementPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkOperation, setBulkOperation] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Filter members based on search and filters
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = 
        member.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || member.role === roleFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && member.is_active) ||
        (statusFilter === 'inactive' && !member.is_active)
      
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [members, searchTerm, roleFilter, statusFilter])

  // Member statistics
  const stats = useMemo(() => {
    const total = members.length
    const active = members.filter(m => m.is_active).length
    const admins = members.filter(m => m.role === 'admin' || m.role === 'owner').length
    const recent = members.filter(m => {
      if (!m.last_active) return false
      const lastActive = new Date(m.last_active)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return lastActive > weekAgo
    }).length

    return { total, active, admins, recent }
  }, [members])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(filteredMembers.map(m => m.user_id))
    } else {
      setSelectedMembers([])
    }
  }

  const handleSelectMember = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, userId])
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== userId))
    }
  }

  const handleBulkOperation = async (operation: string) => {
    if (selectedMembers.length === 0) {
      toast.error('Please select members first')
      return
    }

    try {
      await onBulkOperation(operation, selectedMembers)
      setSelectedMembers([])
      setShowBulkDialog(false)
      toast.success(`Bulk operation completed successfully`)
    } catch (error) {
      toast.error('Failed to perform bulk operation')
    }
  }

  const exportMembers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Joined', 'Last Active'].join(','),
      ...filteredMembers.map(member => [
        member.user_name,
        member.user_email,
        member.role,
        member.is_active ? 'Active' : 'Inactive',
        new Date(member.joined_at).toLocaleDateString(),
        member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `space-members-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'member': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (member: Member) => {
    if (!member.is_active) return <XCircle className="h-4 w-4 text-red-500" />
    if (member.last_active) {
      const lastActive = new Date(member.last_active)
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return lastActive > hourAgo ? 
        <CheckCircle className="h-4 w-4 text-green-500" /> : 
        <Clock className="h-4 w-4 text-yellow-500" />
    }
    return <AlertTriangle className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.recent}</p>
                <p className="text-sm text-muted-foreground">Recent Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invite">Invite</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedMembers.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMembers([])}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Bulk Actions
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Actions</DialogTitle>
                          <DialogDescription>
                            Choose an action to perform on {selectedMembers.length} selected members.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setBulkOperation('change_role')
                                // Handle role change dialog
                              }}
                            >
                              Change Role
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleBulkOperation('remove')}
                            >
                              Remove Members
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleBulkOperation('deactivate')}
                            >
                              Deactivate
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleBulkOperation('activate')}
                            >
                              Activate
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={exportMembers}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="p-4 text-left">
                        <Checkbox
                          checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-4 text-left font-medium">Member</th>
                      <th className="p-4 text-left font-medium">Role</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-left font-medium">Joined</th>
                      <th className="p-4 text-left font-medium">Last Active</th>
                      <th className="p-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-4">
                          <Checkbox
                            checked={selectedMembers.includes(member.user_id)}
                            onCheckedChange={(checked) => handleSelectMember(member.user_id, checked as boolean)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>
                                {member.user_name ? member.user_name[0].toUpperCase() : member.user_email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.user_name}</div>
                              <div className="text-sm text-muted-foreground">{member.user_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {canManageMembers && member.role !== 'owner' ? (
                            <Select
                              value={member.role}
                              onValueChange={(role) => onUpdateRole(member.user_id, role)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={getRoleColor(member.role)}>
                              {member.role}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(member)}
                            <span className="text-sm">
                              {member.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {member.last_active ? 
                            new Date(member.last_active).toLocaleDateString() : 
                            'Never'
                          }
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              {canManageMembers && member.role !== 'owner' && (
                                <>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => onRemoveMember(member.user_id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite New Members</CardTitle>
              <CardDescription>
                Invite existing users or send email invitations to new users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserInviteInput
                spaceId={spaceId}
                onInvite={onInvite}
                disabled={!canManageMembers}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Analytics</CardTitle>
              <CardDescription>
                Insights about member activity and engagement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
