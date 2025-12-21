'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Plus, Globe, Lock, Loader2 } from 'lucide-react'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'

interface UploadTemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const SOURCE_OPTIONS = [
    { value: 'BUILT_IN', label: 'Built-in Dashboard' },
    { value: 'BUILT_IN_VISUALIZE', label: 'Built-in Visualization' },
    { value: 'CUSTOM_EMBED_LINK', label: 'Embed Link Template' },
    { value: 'POWER_BI', label: 'Power BI Template' },
    { value: 'GRAFANA', label: 'Grafana Template' },
    { value: 'LOOKER_STUDIO', label: 'Looker Studio Template' },
]

export function UploadTemplateDialog({
    open,
    onOpenChange,
    onSuccess
}: UploadTemplateDialogProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [source, setSource] = useState('')
    const [visibility, setVisibility] = useState<'private' | 'public'>('private')
    const [previewImage, setPreviewImage] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const [loading, setLoading] = useState(false)

    const resetForm = () => {
        setName('')
        setDescription('')
        setSource('')
        setVisibility('private')
        setPreviewImage('')
        setTags([])
        setTagInput('')
    }

    const handleSubmit = async () => {
        if (!name.trim()) {
            showError('Template name is required')
            return
        }
        if (!source) {
            showError('Please select a template type')
            return
        }

        try {
            setLoading(true)

            const response = await fetch('/api/marketplace/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    source,
                    visibility,
                    preview_image: previewImage || undefined,
                    tags: tags.length > 0 ? tags : undefined,
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to upload template')
            }

            showSuccess('Template uploaded successfully!')
            resetForm()
            onOpenChange(false)
            onSuccess?.()
        } catch (error: any) {
            showError(error.message || ToastMessages.CREATE_ERROR)
        } finally {
            setLoading(false)
        }
    }

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag))
    }

    const handleClose = () => {
        resetForm()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload Template
                    </DialogTitle>
                    <DialogDescription>
                        Share your report template with the marketplace
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Template Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Dashboard Template"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="source">Template Type <span className="text-destructive">*</span></Label>
                        <Select value={source} onValueChange={setSource}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select template type" />
                            </SelectTrigger>
                            <SelectContent>
                                {SOURCE_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this template does..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="previewImage">Preview Image URL</Label>
                        <Input
                            id="previewImage"
                            value={previewImage}
                            onChange={(e) => setPreviewImage(e.target.value)}
                            placeholder="https://example.com/preview.png"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="Add a tag..."
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            />
                            <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                        {tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="ml-1">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            {visibility === 'public' ? (
                                <Globe className="h-5 w-5 text-green-500" />
                            ) : (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                                <Label htmlFor="visibility" className="cursor-pointer">
                                    {visibility === 'public' ? 'Public Template' : 'Private Template'}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {visibility === 'public'
                                        ? 'Anyone can see and use this template'
                                        : 'Only you can see this template'}
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="visibility"
                            checked={visibility === 'public'}
                            onCheckedChange={(checked) => setVisibility(checked ? 'public' : 'private')}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Template
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
