'use client'


import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/contexts/sidebar-context'
import { useSpace } from '@/contexts/space-context'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  Download,
  Workflow,
  ChevronDown,
  ChevronRight,
  Building2,
  Plus,
  BarChart3,
  Kanban,
  FileText,
  Smartphone,
  Database,
} from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SystemSettingsModal } from '@/components/settings/SystemSettingsModal'

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: MenuItem[]
}

const getMenuItems = (
  spaceId: string | null,
  flags?: { assignments?: boolean; bulk_activity?: boolean; workflows?: boolean; dashboard?: boolean; projects?: boolean }
): MenuItem[] => {
  if (!spaceId) {
    return [
      {
        title: 'Others',
        icon: Settings,
        children: [
          { title: 'System Settings', href: `/settings`, icon: Settings },
        ]
      }
    ]
  }

  const items: MenuItem[] = []

  const generalChildren: MenuItem[] = []
  if (flags?.dashboard !== false) {
    generalChildren.push({ title: 'Dashboards', href: `/dashboards`, icon: BarChart3 })
  }
  generalChildren.push({ title: 'Reports', href: `/reports`, icon: FileText })
  if (flags?.assignments !== false) {
    generalChildren.push({ title: 'Assignment', href: `/${spaceId}/assignments`, icon: ClipboardList })
  }
  if (flags?.projects !== false) {
    generalChildren.push({ title: 'Projects', href: `/${spaceId}/projects`, icon: Kanban })
  }
  if (generalChildren.length > 0) {
    items.push({ title: 'General', icon: LayoutDashboard, children: generalChildren })
  }


  items.push({
    title: 'Automation', icon: Workflow, children: [
      { title: 'Workflows', href: `/${spaceId}/workflows`, icon: Workflow },
    ]
  })

  // Channels / Tools
  items.push({
    title: 'Channels', icon: Smartphone, children: [
      { title: 'PWA Studio', href: `/tools/pwa`, icon: Smartphone },
    ]
  })

  const otherChildren: MenuItem[] = []
  if (flags?.bulk_activity !== false) {
    otherChildren.push({ title: 'Bulk Activity', href: `/${spaceId}/import-export`, icon: Download })
  }
  otherChildren.push({ title: 'Users & Roles', href: `/user-roles`, icon: Users })
  otherChildren.push({ title: 'System Settings', href: `/settings`, icon: Settings })
  items.push({ title: 'Others', icon: Settings, children: otherChildren })

  return items
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { settings, isHydrated } = useSidebar()
  const { currentSpace, spaces, setCurrentSpace, isLoading: spacesLoading } = useSpace()
  const [dynamicModels, setDynamicModels] = useState<any[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const isActive = (href: string) => pathname === href

  // Get width based on size setting
  const getWidth = () => {
    const size = currentSpace?.sidebar_config?.style?.size || settings.size
    switch (size) {
      case 'small': return 'w-48'
      case 'medium': return 'w-64'
      case 'large': return 'w-80'
      default: return 'w-64'
    }
  }

  // Get background style
  const getBackgroundStyle = () => {
    const style = currentSpace?.sidebar_config?.style
    const bgType = style?.backgroundType || settings.backgroundType
    if (bgType === 'image' && (style?.backgroundImage || settings.backgroundImage)) {
      const img = style?.backgroundImage || settings.backgroundImage
      return {
        backgroundImage: `url(${img})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    if (bgType === 'gradient' && style?.gradient?.from && style?.gradient?.to) {
      const angle = style?.gradient?.angle ?? 180
      return {
        backgroundImage: `linear-gradient(${angle}deg, ${style.gradient.from}, ${style.gradient.to})`
      }
    }
    return {
      backgroundColor: style?.backgroundColor || settings.backgroundColor
    }
  }

  // Load data models from API to show under Data Entries
  useEffect(() => {
    async function load() {
      if (!currentSpace?.id) return

      setLoadingModels(true)
      setModelsError(null)
      try {
        const res = await fetch(`/api/data-models?page=1&limit=100&space_id=${currentSpace.id}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to load data models')
        }
        const json = await res.json()
        // Prefer pinned models; if none pinned, show all models
        const allModels = (json.dataModels || [])
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        const pinnedModels = allModels.filter((m: any) => m.is_pinned)
        setDynamicModels(pinnedModels.length > 0 ? pinnedModels : allModels)
      } catch (e: any) {
        setModelsError(e.message || 'Failed to load data models')
      } finally {
        setLoadingModels(false)
      }
    }
    load()
  }, [currentSpace?.id])

  // Don't render until hydrated to prevent flash of default styles
  if (!isHydrated) {
    return (
      <div className={cn('flex h-full flex-col border-r border-border w-64', className)}>
        <div className="p-6">
          <h1 className="text-xl font-bold">{currentSpace?.name || 'Customer Data'}</h1>
        </div>
        <div className="flex-1 px-4">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  const customMenu = currentSpace?.sidebar_config?.menu
  const menuItems = (customMenu && customMenu.length > 0)
    ? customMenu as any
    : getMenuItems(
      currentSpace?.slug || currentSpace?.id || null,
      currentSpace?.features || {
        assignments: (currentSpace as any)?.enable_assignments,
        bulk_activity: (currentSpace as any)?.enable_bulk_activity,
        workflows: (currentSpace as any)?.enable_workflows,
        dashboard: (currentSpace as any)?.enable_dashboard,
        projects: (currentSpace as any)?.enable_projects !== false, // Default to true
      }
    )

  return (
    <div
      className={cn('flex h-full flex-col border-r border-border', getWidth(), className)}
      style={{
        ...getBackgroundStyle(),
        color: currentSpace?.sidebar_config?.style?.fontColor || settings.fontColor
      }}
    >
      <div className="p-6">
        {spacesLoading ? (
          <div className="text-sm" style={{ color: settings.fontColor, opacity: 0.7 }}>Loading...</div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-lg font-bold pr-2 pl-0"
                style={{
                  color: settings.fontColor
                }}
              >
                <div className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  {currentSpace?.name || 'Select Space'}
                </div>
                <ChevronDown className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {spaces.map((space) => (
                <DropdownMenuItem
                  key={space.id}
                  onClick={() => {
                    setCurrentSpace(space)
                    const slug = (space as any).slug || space.id
                    router.push(`/${slug}/dashboard`)
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{space.name}</span>
                    {space.is_default && (
                      <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                    )}
                  </div>
                  {currentSpace?.id === space.id && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              {spaces.length > 0 && (
                <>
                  <div className="border-t border-border my-1" />
                  <DropdownMenuItem
                    onClick={() => {
                      sessionStorage.setItem('navigate-to-spaces', 'true')
                      router.push('/spaces')
                    }}
                    className="flex items-center"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>All Spaces</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div
          className="mt-3 border-t border-border"
          style={{ borderColor: settings.fontColor, opacity: 0.3 }}
        />
      </div>

      <nav className="flex-1 space-y-2 px-4">
        {!currentSpace && (
          <div className="px-2 text-xs" style={{ color: settings.fontColor, opacity: 0.7 }}>
            Select a space to view content
          </div>
        )}
        <Accordion type="single" collapsible defaultValue="General">
          {menuItems.map((item: any, index: number) => (
            <React.Fragment key={item.title}>
              <AccordionItem value={item.title} className="border-none">
                <AccordionTrigger className="py-2 hover:no-underline md:py-2 px-2" style={{ color: settings.fontColor, opacity: 0.9 }}>
                  <div className="flex items-center text-xs font-medium uppercase tracking-wide">
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  {item.children && (
                    <div className="ml-2 space-y-1">
                      {item.children.map((child: any) => (
                        child.title === 'System Settings' ? (
                          <Button
                            key={child.href}
                            variant="ghost"
                            className="w-full justify-start text-sm"
                            onClick={() => setShowSettingsModal(true)}
                            style={{
                              color: settings.fontColor,
                              backgroundColor: 'transparent'
                            }}
                          >
                            <child.icon className="mr-2 h-4 w-4" />
                            {child.title}
                          </Button>
                        ) : (
                          <Link key={child.href} href={child.href!}>
                            <Button
                              variant={isActive(child.href!) ? "secondary" : "ghost"}
                              className="w-full justify-start text-sm"
                              style={{
                                color: settings.fontColor,
                                backgroundColor: isActive(child.href!) ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                              }}
                            >
                              <child.icon className="mr-2 h-4 w-4" />
                              {child.title}
                            </Button>
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {index === 0 && currentSpace && (
                <AccordionItem value="Data Entities" className="border-none mt-2">
                  <AccordionTrigger className="py-2 hover:no-underline md:py-2 px-2" style={{ color: settings.fontColor, opacity: 0.9 }}>
                    <div className="flex items-center text-xs font-medium uppercase tracking-wide">
                      <Database className="mr-2 h-4 w-4" />
                      Data Entities
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="ml-2 space-y-1">
                      {loadingModels && (
                        <div className="px-2 text-xs" style={{ color: settings.fontColor, opacity: 0.7 }}>Loading...</div>
                      )}
                      {modelsError && (
                        <div className="px-2 text-xs text-red-500">{modelsError}</div>
                      )}
                      {(!loadingModels && !modelsError) && (dynamicModels || []).map((m) => {
                        const slug = (m as any).slug || m.id
                        const href = `/${(currentSpace?.slug || currentSpace?.id)}/data/entities/${encodeURIComponent(slug)}`
                        return (
                          <Link key={m.id} href={href}>
                            <Button
                              variant={isActive(href) ? "secondary" : "ghost"}
                              className="w-full justify-start text-sm"
                              style={{
                                color: settings.fontColor,
                                backgroundColor: isActive(href) ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                              }}
                            >
                              {m.icon ? (
                                <AnimatedIcon
                                  icon={m.icon}
                                  size={16}
                                  animation="float"
                                  trigger="hover"
                                  className="mr-2"
                                />
                              ) : (
                                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded bg-black/10">
                                  {(String(m.display_name || m.name || '')?.slice(0, 1) || '?').toUpperCase()}
                                </span>
                              )}
                              {m.display_name || m.name}
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Divider logic moved inside visual flow or removed if Accordion style suffices */}
            </React.Fragment>
          ))}
        </Accordion>
      </nav>

      <SystemSettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </div>
  )
}
