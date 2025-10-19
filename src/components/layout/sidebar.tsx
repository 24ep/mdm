'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: MenuItem[]
}

const getMenuItems = (
  spaceId: string | null,
  flags?: { assignments?: boolean; bulk_activity?: boolean; workflows?: boolean; dashboard?: boolean }
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
  if (flags?.assignments !== false) {
    generalChildren.push({ title: 'Assignment', href: `/${spaceId}/assignments`, icon: ClipboardList })
  }
  if (generalChildren.length > 0) {
    items.push({ title: 'General', icon: LayoutDashboard, children: generalChildren })
  }


  if (flags?.workflows !== false) {
    items.push({ title: 'Automation', icon: Workflow, children: [
      { title: 'Workflows', href: `/${spaceId}/workflows`, icon: Workflow },
    ] })
  }

  const otherChildren: MenuItem[] = []
  if (flags?.bulk_activity !== false) {
    otherChildren.push({ title: 'Bulk Activity', href: `/${spaceId}/import-export`, icon: Download })
  }
  otherChildren.push({ title: 'Space Settings', href: `/${spaceId}/settings`, icon: Settings })
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
      <div className={cn('flex h-full flex-col border-r w-64', className)}>
        <div className="p-6">
              <h1 className="text-xl font-bold">{currentSpace?.name || 'Customer Data'}</h1>
        </div>
        <div className="flex-1 px-4">
          <div className="text-sm text-gray-500">Loading...</div>
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
        }
      )

  return (
    <div 
      className={cn('flex h-full flex-col border-r', getWidth(), className)}
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
                  {currentSpace?.logo_url ? (
                    <img src={currentSpace.logo_url} alt={currentSpace.name} className="mr-2 h-6 w-6 rounded" />
                  ) : currentSpace?.icon && (LucideIcons as any)[currentSpace.icon] ? (
                    (() => { const Icon = (LucideIcons as any)[currentSpace.icon] as React.ComponentType<{ className?: string }>; return <Icon className="mr-2 h-5 w-5" /> })()
                  ) : (
                    <Building2 className="mr-2 h-5 w-5" />
                  )}
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
                    {space.logo_url ? (
                      <img src={space.logo_url} alt={space.name} className="mr-2 h-5 w-5 rounded" />
                    ) : (space as any).icon && (LucideIcons as any)[(space as any).icon] ? (
                      (() => { const Icon = (LucideIcons as any)[(space as any).icon] as React.ComponentType<{ className?: string }>; return <Icon className="mr-2 h-4 w-4" /> })()
                    ) : (
                      <Building2 className="mr-2 h-4 w-4" />
                    )}
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
                  <div className="border-t my-1" />
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
          className="mt-3 border-t"
          style={{ borderColor: settings.fontColor, opacity: 0.3 }}
        />
      </div>
      
      <nav className="flex-1 space-y-2 px-4">
        {!currentSpace && (
                  <div className="px-2 text-xs" style={{ color: (currentSpace?.sidebar_config?.style?.fontColor || settings.fontColor), opacity: 0.7 }}>
            Select a space to view content
          </div>
        )}
        {menuItems.map((item, index) => (
          <div key={item.title}>
            <div 
              className="px-2 text-xs font-medium uppercase tracking-wide mb-1"
              style={{ color: settings.fontColor, opacity: 0.7 }}
            >
              {item.title}
            </div>
            {item.children && (
              <div className="ml-2 space-y-1">
                {item.children.map((child) => (
                  <Link key={child.href} href={child.href!}>
                    <Button
                      variant={isActive(child.href!) ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm"
                      style={{ 
                        color: settings.fontColor,
                        backgroundColor: isActive(child.href!) ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                      }}
                    >
                      <AnimatedIcon 
                        icon={child.icon} 
                        size={16} 
                        animation="scale" 
                        trigger="hover"
                        className="mr-2"
                      />
                      {child.title}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
            {index === 0 && currentSpace && (
              <div>
                <div 
                  className="px-2 text-xs font-medium uppercase tracking-wide mb-1 mt-3"
                  style={{ color: settings.fontColor, opacity: 0.7 }}
                >
                  Data Entities
                </div>
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
              const AnyIcons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
              const IconComp = (m.icon && AnyIcons[m.icon]) || null
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
                    {IconComp ? (
                      <AnimatedIcon 
                        icon={m.icon} 
                        size={16} 
                        animation="float" 
                        trigger="hover"
                        className="mr-2"
                      />
                    ) : (
                      <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded bg-black/10">
                        {(String(m.display_name || m.name || '')?.slice(0,1) || '?').toUpperCase()}
                      </span>
                    )}
                          {m.display_name || m.name}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
            {index < menuItems.length - 1 && (
              <div 
                className="my-3 border-t"
                style={{ borderColor: settings.fontColor, opacity: 0.3 }}
              />
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}
