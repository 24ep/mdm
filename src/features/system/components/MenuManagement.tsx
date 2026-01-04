'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    GripVertical,
    Plus,
    Pencil,
    Trash2,
    Save,
    RefreshCw,
    Eye,
    EyeOff,
    ArrowUp,
    ArrowDown
} from 'lucide-react'
import { useMenuConfig, MenuGroupConfig, MenuItemConfig } from '@/hooks/useMenuConfig'
import { toast } from 'react-hot-toast'

interface MenuItemFormData {
    groupSlug: string
    slug: string
    name: string
    icon: string
    href: string
    section: string
    priority: number
}

export function MenuManagement() {
    const { menuConfig, loading, refetch } = useMenuConfig()
    const [selectedGroup, setSelectedGroup] = useState<string>('')
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItemConfig | null>(null)
    const [formData, setFormData] = useState<MenuItemFormData>({
        groupSlug: '',
        slug: '',
        name: '',
        icon: 'FileText',
        href: '',
        section: '',
        priority: 100
    })

    useEffect(() => {
        if (menuConfig?.groups?.length && !selectedGroup) {
            setSelectedGroup(menuConfig.groups[0].slug)
        }
    }, [menuConfig, selectedGroup])

    const handleAddItem = async () => {
        try {
            const response = await fetch('/api/admin/menu/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to add menu item')
            }

            toast.success('Menu item added successfully')
            setIsAddDialogOpen(false)
            resetForm()
            refetch()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleUpdateItem = async (item: MenuItemConfig, updates: Partial<MenuItemConfig>) => {
        try {
            const response = await fetch(`/api/admin/menu/items/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update menu item')
            }

            toast.success('Menu item updated')
            refetch()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleDeleteItem = async (item: MenuItemConfig) => {
        if (item.isBuiltin) {
            toast.error('Cannot delete built-in menu items')
            return
        }

        try {
            const response = await fetch(`/api/admin/menu/items/${item.id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete menu item')
            }

            toast.success('Menu item deleted')
            refetch()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleMoveItem = async (item: MenuItemConfig, direction: 'up' | 'down') => {
        const newPriority = direction === 'up' ? item.priority - 15 : item.priority + 15
        await handleUpdateItem(item, { priority: Math.max(1, newPriority) })
    }

    const handleToggleVisibility = async (item: MenuItemConfig) => {
        await handleUpdateItem(item, { isVisible: !item.isVisible })
    }

    const resetForm = () => {
        setFormData({
            groupSlug: selectedGroup,
            slug: '',
            name: '',
            icon: 'FileText',
            href: '',
            section: '',
            priority: 100
        })
        setEditingItem(null)
    }

    const currentGroup = menuConfig?.groups?.find(g => g.slug === selectedGroup)
    const groupedItems = currentGroup?.items || []

    // Group items by section
    const itemsBySection: Record<string, MenuItemConfig[]> = {}
    for (const item of groupedItems) {
        const section = item.section || 'Other'
        if (!itemsBySection[section]) {
            itemsBySection[section] = []
        }
        itemsBySection[section].push(item)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Menu Configuration</h2>
                    <p className="text-muted-foreground">
                        Manage sidebar menu items and their visibility
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => {
                                resetForm()
                                setFormData(prev => ({ ...prev, groupSlug: selectedGroup }))
                            }}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Menu Item</DialogTitle>
                                <DialogDescription>
                                    Add a new item to the sidebar menu
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Group</Label>
                                    <Select
                                        value={formData.groupSlug}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, groupSlug: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {menuConfig?.groups?.map(g => (
                                                <SelectItem key={g.slug} value={g.slug}>{g.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Slug</Label>
                                        <Input
                                            value={formData.slug}
                                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                            placeholder="my-menu-item"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="My Menu Item"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Icon</Label>
                                        <Input
                                            value={formData.icon}
                                            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                                            placeholder="FileText"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Section</Label>
                                        <Input
                                            value={formData.section}
                                            onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                                            placeholder="My Section"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>URL (href)</Label>
                                    <Input
                                        value={formData.href}
                                        onChange={(e) => setFormData(prev => ({ ...prev, href: e.target.value }))}
                                        placeholder="/tools/my-tool"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Priority (lower = higher in list)</Label>
                                    <Input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddItem}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
                <TabsList>
                    {menuConfig?.groups?.map(group => (
                        <TabsTrigger key={group.slug} value={group.slug}>
                            {group.name}
                            <Badge variant="secondary" className="ml-2">
                                {group.items.length}
                            </Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {menuConfig?.groups?.map(group => (
                    <TabsContent key={group.slug} value={group.slug} className="space-y-4">
                        {Object.entries(itemsBySection).map(([section, items]) => (
                            <Card key={section}>
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm font-medium">{section}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {items.sort((a, b) => a.priority - b.priority).map(item => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-3 hover:bg-muted/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {item.name}
                                                            {item.isBuiltin && (
                                                                <Badge variant="outline" className="text-xs">Built-in</Badge>
                                                            )}
                                                            {item.sourcePluginId && (
                                                                <Badge variant="secondary" className="text-xs">Plugin</Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {item.href}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleMoveItem(item, 'up')}
                                                    >
                                                        <ArrowUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleMoveItem(item, 'down')}
                                                    >
                                                        <ArrowDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleToggleVisibility(item)}
                                                    >
                                                        {item.isVisible !== false ? (
                                                            <Eye className="h-4 w-4" />
                                                        ) : (
                                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                    {!item.isBuiltin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDeleteItem(item)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
