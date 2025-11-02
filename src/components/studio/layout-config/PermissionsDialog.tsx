'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'

interface PermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId: string
  selectedPageForPermissions: SpacesEditorPage | null
  spaceUsers: Array<{ id: string; name: string; email: string; space_role: string }>
  permissionsRoles: string[]
  permissionsUserIds: string[]
  setPermissionsRoles: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsUserIds: React.Dispatch<React.SetStateAction<string[]>>
  setSelectedPageForPermissions: React.Dispatch<React.SetStateAction<SpacesEditorPage | null>>
  setPages: React.Dispatch<React.SetStateAction<SpacesEditorPage[]>>
}

export function PermissionsDialog({
  open,
  onOpenChange,
  spaceId,
  selectedPageForPermissions,
  spaceUsers,
  permissionsRoles,
  permissionsUserIds,
  setPermissionsRoles,
  setPermissionsUserIds,
  setSelectedPageForPermissions,
  setPages,
}: PermissionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Page Permissions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Roles</Label>
            <div className="space-y-2">
              {['owner', 'admin', 'member'].map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role}`}
                    checked={permissionsRoles.includes(role)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPermissionsRoles([...permissionsRoles, role])
                      } else {
                        setPermissionsRoles(permissionsRoles.filter(r => r !== role))
                      }
                    }}
                  />
                  <label
                    htmlFor={`role-${role}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                  >
                    {role}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Users</Label>
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
              {spaceUsers.length === 0 ? (
                <div className="text-xs text-muted-foreground">No users in this space</div>
              ) : (
                spaceUsers.map(user => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={permissionsUserIds.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPermissionsUserIds([...permissionsUserIds, user.id])
                        } else {
                          setPermissionsUserIds(permissionsUserIds.filter(id => id !== user.id))
                        }
                      }}
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      <div>{user.name || user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.email} • {user.space_role}</div>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>If no roles or users are selected, the page will be visible to everyone.</p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setSelectedPageForPermissions(null)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!selectedPageForPermissions) return
              const permissions = {
                roles: permissionsRoles.length > 0 ? permissionsRoles : undefined,
                userIds: permissionsUserIds.length > 0 ? permissionsUserIds : undefined
              }
              try {
                await SpacesEditorManager.updatePage(spaceId, selectedPageForPermissions.id, {
                  permissions: permissionsRoles.length > 0 || permissionsUserIds.length > 0 ? permissions : undefined
                })
                setPages((prev) => prev.map((p) => 
                  p.id === selectedPageForPermissions.id 
                    ? { ...p, permissions }
                    : p
                ))
                toast.success('Permissions updated')
                onOpenChange(false)
                setSelectedPageForPermissions(null)
              } catch (err) {
                toast.error('Failed to update permissions')
                console.error(err)
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

