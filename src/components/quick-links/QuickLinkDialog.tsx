'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QuickLink, addQuickLink, updateQuickLink, getCategories } from '@/lib/quick-links'
import { getFaviconUrl } from '@/lib/favicon-utils'
import { showSuccess, showError } from '@/lib/toast-utils'

interface QuickLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  link?: QuickLink | null
  onSuccess: () => void
}

export function QuickLinkDialog({
  open,
  onOpenChange,
  link,
  onSuccess,
}: QuickLinkDialogProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '',
    url: '',
    category: '',
    faviconUrl: '',
  })

  useEffect(() => {
    if (open) {
      // Load categories
      const existingCategories = getCategories()
      setCategories(existingCategories)
      
      if (link) {
        // Edit mode
        setForm({
          name: link.name,
          url: link.url,
          category: link.category || '',
          faviconUrl: link.faviconUrl || '',
        })
      } else {
        // Add mode
        setForm({
          name: '',
          url: '',
          category: '',
          faviconUrl: '',
        })
      }
    }
  }, [open, link])

  // Auto-fetch favicon when URL changes
  useEffect(() => {
    if (form.url && !form.faviconUrl && !link?.faviconUrl) {
      const faviconUrl = getFaviconUrl(form.url)
      setForm(prev => ({ ...prev, faviconUrl }))
    }
  }, [form.url, form.faviconUrl, link?.faviconUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate URL
      if (!form.url) {
        throw new Error('URL is required')
      }

      try {
        new URL(form.url)
      } catch {
        throw new Error('Invalid URL format')
      }

      if (!form.name.trim()) {
        throw new Error('Name is required')
      }

      const faviconUrl = form.faviconUrl || getFaviconUrl(form.url)

      if (link) {
        // Update existing link
        updateQuickLink(link.id, {
          name: form.name.trim(),
          url: form.url.trim(),
          category: form.category.trim() || undefined,
          faviconUrl,
        })
        showSuccess('Quick link updated successfully')
      } else {
        // Add new link
        addQuickLink({
          name: form.name.trim(),
          url: form.url.trim(),
          category: form.category.trim() || undefined,
          faviconUrl,
        })
        showSuccess('Quick link added successfully')
      }

      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      showError(error.message || 'Failed to save quick link')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (value: string) => {
    setForm(prev => ({ ...prev, category: value }))
    
    // If "new" is selected, we'll handle it differently
    if (value === '__new__') {
      const newCategory = prompt('Enter new category name:')
      if (newCategory && newCategory.trim()) {
        setForm(prev => ({ ...prev, category: newCategory.trim() }))
        // Add to categories list
        if (!categories.includes(newCategory.trim())) {
          setCategories(prev => [...prev, newCategory.trim()].sort())
        }
      } else {
        setForm(prev => ({ ...prev, category: '' }))
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{link ? 'Edit Quick Link' : 'Add Quick Link'}</DialogTitle>
          <DialogDescription>
            {link
              ? 'Update the quick link information.'
              : 'Add a new quick link to access external data platforms and applications.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., BigQuery Console"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={form.url}
                onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                The platform's favicon will be automatically fetched from the URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category || ''} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or create category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Create new category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faviconUrl">Custom Favicon URL (optional)</Label>
              <Input
                id="faviconUrl"
                type="url"
                value={form.faviconUrl}
                onChange={(e) => setForm(prev => ({ ...prev, faviconUrl: e.target.value }))}
                placeholder="Leave empty to auto-fetch from URL"
              />
              {form.faviconUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <img
                    src={form.faviconUrl}
                    alt="Favicon preview"
                    className="w-6 h-6"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <span className="text-xs text-muted-foreground">Favicon preview</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : link ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

