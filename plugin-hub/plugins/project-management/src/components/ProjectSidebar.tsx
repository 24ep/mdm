'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Repeat,
    Boxes,
    CheckSquare,
    KanbanSquare,
    FileText,
    Settings,
    ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarItemProps {
    icon: React.ElementType
    label: string
    href: string
    isActive?: boolean
}

function SidebarItem({ icon: Icon, label, href, isActive }: SidebarItemProps) {
    return (
        <Link href={href}>
            <div
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                <Icon className="h-4 w-4" />
                {label}
            </div>
        </Link>
    )
}

interface ProjectSidebarProps {
    projectId: string
    projectName?: string
}

export function ProjectSidebar({ projectId, projectName = 'Project' }: ProjectSidebarProps) {
    const pathname = usePathname()

    const items = [
        {
            icon: LayoutDashboard,
            label: 'Overview',
            href: `/admin/projects/${projectId}`,
            exact: true
        },
        {
            icon: Repeat,
            label: 'Cycles',
            href: `/admin/projects/${projectId}/cycles`
        },
        {
            icon: Boxes,
            label: 'Modules',
            href: `/admin/projects/${projectId}/modules`
        },
        {
            icon: CheckSquare,
            label: 'Issues',
            href: `/admin/projects/${projectId}/issues`
        },
        {
            icon: KanbanSquare,
            label: 'Views',
            href: `/admin/projects/${projectId}/views`
        },
        {
            icon: FileText,
            label: 'Pages',
            href: `/admin/projects/${projectId}/pages`
        },
        {
            icon: Settings,
            label: 'Settings',
            href: `/admin/projects/${projectId}/settings`
        }
    ]

    return (
        <div className="w-64 border-r h-full bg-card flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/admin/projects">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <span className="font-semibold truncate">{projectName}</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                {items.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname?.startsWith(item.href)

                    return (
                        <SidebarItem
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            isActive={isActive}
                        />
                    )
                })}
            </div>
        </div>
    )
}
