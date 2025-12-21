'use client'

import { ThemeListItem } from '../../types-theme'
import { ThemeCard } from './ThemeCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Upload, X } from 'lucide-react'
import { useState, useRef, useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ThemeLibraryProps {
    themes: ThemeListItem[]
    selectedThemeId: string | null
    onSelectTheme: (id: string) => void
    onEditTheme: (id: string) => void
    onCloneTheme: (id: string) => void
    onDeleteTheme: (id: string) => void
    onActivateTheme: (id: string) => void
    onExportTheme: (id: string, format: 'json') => void
    onCreateTheme: () => void
    onImportTheme: (file: File) => void
}

export function ThemeLibrary({
    themes,
    selectedThemeId,
    onSelectTheme,
    onEditTheme,
    onCloneTheme,
    onDeleteTheme,
    onActivateTheme,
    onExportTheme,
    onCreateTheme,
    onImportTheme
}: ThemeLibraryProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Get all unique tags from themes
    const allTags = useMemo(() => {
        const tagSet = new Set<string>()
        themes.forEach(theme => {
            theme.tags?.forEach(tag => tagSet.add(tag))
        })
        return Array.from(tagSet).sort()
    }, [themes])

    // Filter themes based on search and tags
    const filteredThemes = useMemo(() => {
        return themes.filter(theme => {
            // Search filter
            const matchesSearch =
                theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                theme.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                theme.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

            // Tag filter
            const matchesTags = selectedTags.length === 0 ||
                selectedTags.every(tag => theme.tags?.includes(tag))

            return matchesSearch && matchesTags
        })
    }, [themes, searchQuery, selectedTags])

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        )
    }

    const clearAllTags = () => {
        setSelectedTags([])
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onImportTheme(file)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <div className="flex flex-col h-full border-r bg-muted/30">
            {/* Header */}
            <div className="p-4 border-b bg-background/50">
                <h2 className="text-lg font-semibold mb-3">Theme Library</h2>

                {/* Tag Filters */}
                {allTags.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Filter by tags:</span>
                            {selectedTags.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearAllTags}
                                    className="h-6 px-2 text-xs"
                                >
                                    Clear all
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {allTags.map(tag => {
                                const isSelected = selectedTags.includes(tag)
                                return (
                                    <Badge
                                        key={tag}
                                        variant={isSelected ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer text-xs px-2 py-0.5 transition-colors rounded-full",
                                            isSelected && "bg-secondary text-secondary-foreground"
                                        )}
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {tag}
                                    </Badge>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search themes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button onClick={onCreateTheme} className="flex-1" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        New Theme
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-4 w-4" />
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.yaml,.yml"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Theme List */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {filteredThemes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {searchQuery ? 'No themes found' : 'No themes available'}
                        </div>
                    ) : (
                        filteredThemes.map((theme) => (
                            <ThemeCard
                                key={theme.id}
                                theme={theme}
                                isSelected={selectedThemeId === theme.id}
                                onSelect={() => onSelectTheme(theme.id)}
                                onEdit={() => onEditTheme(theme.id)}
                                onClone={() => onCloneTheme(theme.id)}
                                onDelete={() => onDeleteTheme(theme.id)}
                                onActivate={() => onActivateTheme(theme.id)}
                                onExport={(format) => onExportTheme(theme.id, format)}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Footer Info */}
            <div className="p-4 border-t bg-background/50 text-xs text-muted-foreground">
                {filteredThemes.length} {filteredThemes.length === 1 ? 'theme' : 'themes'}
                {(searchQuery || selectedTags.length > 0) && ` (filtered from ${themes.length})`}
            </div>
        </div>
    )
}
