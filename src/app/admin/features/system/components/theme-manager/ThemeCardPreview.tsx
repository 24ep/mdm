'use client'

import { useThemes } from '../../hooks/useThemes'
import { ThemeCard } from './ThemeCard'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ThemeCardPreview() {
    const {
        themes,
        isLoading,
        error,
        cloneTheme,
        deleteTheme,
        activateTheme,
        exportTheme
    } = useThemes()

    const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
    const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [themeToClone, setThemeToClone] = useState<string | null>(null)
    const [themeToDelete, setThemeToDelete] = useState<string | null>(null)
    const [cloneName, setCloneName] = useState('')

    const handleClone = (themeId: string) => {
        const theme = themes.find(t => t.id === themeId)
        setThemeToClone(themeId)
        setCloneName(theme ? `${theme.name} (Copy)` : 'New Theme')
        setCloneDialogOpen(true)
    }

    const handleDelete = (themeId: string) => {
        setThemeToDelete(themeId)
        setDeleteDialogOpen(true)
    }

    const confirmClone = async () => {
        if (themeToClone && cloneName.trim()) {
            await cloneTheme(themeToClone, cloneName.trim())
            setCloneDialogOpen(false)
            setThemeToClone(null)
            setCloneName('')
        }
    }

    const confirmDelete = async () => {
        if (themeToDelete) {
            await deleteTheme(themeToDelete)
            setDeleteDialogOpen(false)
            setThemeToDelete(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-destructive mb-2">Error loading themes</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Theme Card Preview</h1>
                <p className="text-muted-foreground">
                    Preview of the new theme card design with live data from the database
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map((theme) => (
                    <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={selectedThemeId === theme.id}
                        onSelect={() => setSelectedThemeId(theme.id)}
                        onEdit={() => alert(`Edit theme: ${theme.name}`)}
                        onClone={() => handleClone(theme.id)}
                        onDelete={() => handleDelete(theme.id)}
                        onActivate={() => activateTheme(theme.id)}
                        onExport={(format) => exportTheme(theme.id, format)}
                    />
                ))}
            </div>

            {themes.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No themes found</p>
                </div>
            )}

            {/* Clone Dialog */}
            <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clone Theme</DialogTitle>
                        <DialogDescription>
                            Create a copy of this theme with a new name
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="clone-name">Theme Name</Label>
                            <Input
                                id="clone-name"
                                value={cloneName}
                                onChange={(e) => setCloneName(e.target.value)}
                                placeholder="Enter theme name"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmClone} disabled={!cloneName.trim()}>
                            Clone Theme
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Theme</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this theme? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
