'use client'

import { ThemeListItem } from '../../types-theme'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Copy, Pencil, Trash2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'

interface ThemeCardProps {
    theme: ThemeListItem
    isSelected: boolean
    onSelect: () => void
    onEdit: () => void
    onClone: () => void
    onDelete: () => void
    onActivate: () => void
    onExport: (format: 'json') => void
}

export function ThemeCard({
    theme,
    isSelected,
    onSelect,
    onEdit,
    onClone,
    onDelete,
    onActivate,
    onExport
}: ThemeCardProps) {
    return (
        <div
            onClick={onSelect}
            className={cn(
                'group relative p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md',
                isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/50'
            )}
        >
            {/* Active Badge */}
            {theme.isActive && (
                <div className="absolute top-2 right-2">
                    <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                    </Badge>
                </div>
            )}

            {/* Default Badge */}
            {theme.isDefault && !theme.isActive && (
                <div className="absolute top-2 right-2">
                    <Badge variant="outline">Default</Badge>
                </div>
            )}

            {/* Color Preview */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                    <div
                        className="w-8 h-8 rounded-md border shadow-sm"
                        style={{ backgroundColor: theme.previewColors.primary }}
                        title="Primary Color"
                    />
                    <div
                        className="w-8 h-8 rounded-md border shadow-sm"
                        style={{ backgroundColor: theme.previewColors.secondary }}
                        title="Secondary Color"
                    />
                    <div
                        className="w-8 h-8 rounded-md border shadow-sm"
                        style={{ backgroundColor: theme.previewColors.background }}
                        title="Background"
                    />
                    <div
                        className="w-8 h-8 rounded-md border shadow-sm"
                        style={{ backgroundColor: theme.previewColors.surface }}
                        title="Surface"
                    />
                </div>
            </div>

            {/* Theme Name & Description */}
            <div className="mb-3">
                <h3 className="font-semibold text-sm mb-1">{theme.name}</h3>
                {theme.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {theme.description}
                    </p>
                )}
                {/* Tags */}
                {theme.tags && theme.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {theme.tags.map(tag => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs px-1.5 py-0"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground mb-3">
                Updated {new Date(theme.updatedAt).toLocaleDateString()}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                    }}
                    className="flex-1"
                >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                </Button>

                {!theme.isActive && (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            onActivate()
                        }}
                        className="flex-1"
                    >
                        Activate
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onClone}>
                            <Copy className="h-4 w-4 mr-2" />
                            Clone
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport('json')}>
                            <Download className="h-4 w-4 mr-2" />
                            Export JSON
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
