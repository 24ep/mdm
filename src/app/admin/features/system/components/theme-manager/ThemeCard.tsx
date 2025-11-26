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
    const handleCardClick = (e: React.MouseEvent) => {
        // Only select if clicking on the card itself, not on buttons or action area
        const target = e.target as HTMLElement
        const isButton = target.closest('button') || target.closest('[role="button"]')
        const isActionArea = target.closest('.action-area')
        if (!isButton && !isActionArea) {
            onSelect()
        }
    }

    return (
        <div
            className={cn(
                'group relative p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md',
                isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/50'
            )}
            role="button"
            tabIndex={0}
            onClick={handleCardClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect()
                }
            }}
        >
            {/* Active Badge */}
            {theme.isActive && (
                <div className="absolute top-2 right-2 pointer-events-none z-0">
                    <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                    </Badge>
                </div>
            )}

            {/* Default Badge */}
            {theme.isDefault && !theme.isActive && (
                <div className="absolute top-2 right-2 pointer-events-none z-0">
                    <Badge variant="outline">Default</Badge>
                </div>
            )}

            {/* Clickable Content Area */}
            <div onClick={handleCardClick} className="cursor-pointer">
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
                                    className="text-xs px-1.5 py-0 pointer-events-none"
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
            </div>

            {/* Actions */}
            <div 
                className="flex items-center gap-2 relative z-10 action-area" 
                onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                }}
            >
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        onEdit()
                    }}
                    className="flex-1"
                    type="button"
                >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                </Button>

                {theme.isActive ? (
                    <Button
                        variant="default"
                        size="sm"
                        disabled
                        className="flex-1 pointer-events-none"
                        type="button"
                    >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                    </Button>
                ) : (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            onActivate()
                        }}
                        className="flex-1"
                        type="button"
                    >
                        Activate
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                            }}
                            type="button"
                        >
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
