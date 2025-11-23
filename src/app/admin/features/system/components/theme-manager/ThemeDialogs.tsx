'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CreateThemeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreate: (name: string, description: string) => Promise<void>
}

export function CreateThemeDialog({
    open,
    onOpenChange,
    onCreate
}: CreateThemeDialogProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const handleCreate = async () => {
        if (!name.trim()) return

        setIsCreating(true)
        try {
            await onCreate(name.trim(), description.trim())
            // Reset form
            setName('')
            setDescription('')
            onOpenChange(false)
        } catch (error) {
            // Error is handled by the parent component
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Theme</DialogTitle>
                    <DialogDescription>
                        Create a new theme from scratch. You can customize it after creation.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="theme-name">Theme Name *</Label>
                        <Input
                            id="theme-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Ocean Blue"
                            autoFocus
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="theme-description">Description</Label>
                        <Textarea
                            id="theme-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of your theme..."
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!name.trim() || isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Theme'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface CloneThemeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    themeName: string
    onClone: (name: string) => Promise<void>
}

export function CloneThemeDialog({
    open,
    onOpenChange,
    themeName,
    onClone
}: CloneThemeDialogProps) {
    const [name, setName] = useState(`${themeName} (Copy)`)
    const [isCloning, setIsCloning] = useState(false)

    const handleClone = async () => {
        if (!name.trim()) return

        setIsCloning(true)
        try {
            await onClone(name.trim())
            onOpenChange(false)
        } catch (error) {
            // Error is handled by the parent component
        } finally {
            setIsCloning(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Clone Theme</DialogTitle>
                    <DialogDescription>
                        Create a copy of "{themeName}" with a new name
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="clone-name">New Theme Name *</Label>
                        <Input
                            id="clone-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter theme name"
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isCloning}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleClone}
                        disabled={!name.trim() || isCloning}
                    >
                        {isCloning ? 'Cloning...' : 'Clone Theme'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface DeleteThemeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    themeName: string
    onDelete: () => Promise<void>
}

export function DeleteThemeDialog({
    open,
    onOpenChange,
    themeName,
    onDelete
}: DeleteThemeDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await onDelete()
            onOpenChange(false)
        } catch (error) {
            // Error is handled by the parent component
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Theme</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{themeName}"? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
