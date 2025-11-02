'use client'

import { memo, useCallback } from 'react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Building2, Layout, Users as UsersIcon, Database, FolderPlus, Archive, AlertTriangle, RefreshCw } from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  tooltip: string
}

const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  {
    id: 'details',
    label: 'Space Details',
    icon: Building2,
    tooltip: 'Name, description, and basic info'
  },
  {
    id: 'space-studio',
    label: 'Space Studio',
    icon: Layout,
    tooltip: 'Design layout and manage space pages'
  },
  {
    id: 'members',
    label: 'Members',
    icon: UsersIcon,
    tooltip: 'Manage team members and permissions'
  },
  {
    id: 'data-model',
    label: 'Data Model',
    icon: Database,
    tooltip: 'Manage data models and entities'
  },
  {
    id: 'data-sync',
    label: 'Data Sync',
    icon: RefreshCw,
    tooltip: 'Schedule data synchronization from external sources'
  },
  {
    id: 'attachments',
    label: 'Attachments',
    icon: FolderPlus,
    tooltip: 'Manage file storage and attachments'
  },
  {
    id: 'restore',
    label: 'Restore',
    icon: Archive,
    tooltip: 'Backup and restore data'
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    icon: AlertTriangle,
    tooltip: 'Delete space and irreversible actions'
  }
] as const

interface SpaceSettingsSidebarProps {
  activeTab: string
  onTabChange: (value: string) => void
  showAllTabs?: boolean
}

const SidebarItemComponent = memo(function SidebarItemComponent({ 
  item, 
  isActive, 
  onClick,
  className = ''
}: { 
  item: SidebarItem
  isActive: boolean
  onClick: () => void
  className?: string
}) {
  const Icon = item.icon
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <TabsTrigger
          value={item.id}
          onClick={onClick}
          className={`justify-start w-full h-9 px-2.5 py-1.5 rounded-md border-0 text-sm transition-colors cursor-pointer ${
            isActive
              ? 'bg-gray-200 dark:bg-gray-700'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          } ${className}`}
        >
          <div className="flex items-center space-x-2.5 w-full">
            <Icon className={`h-4 w-4 ${className.includes('text-red') ? 'text-current' : 'text-foreground'} flex-shrink-0`} />
            <span className="font-medium">{item.label}</span>
          </div>
        </TabsTrigger>
      </TooltipTrigger>
      <TooltipContent>
        <p>{item.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
})

export const SpaceSettingsSidebar = memo(function SpaceSettingsSidebar({ 
  activeTab, 
  onTabChange,
  showAllTabs = true
}: SpaceSettingsSidebarProps) {
  const handleTabClick = useCallback((itemId: string) => {
    onTabChange(itemId)
  }, [onTabChange])

  const visibleItems = showAllTabs 
    ? SIDEBAR_ITEMS 
    : SIDEBAR_ITEMS.filter(item => !['restore', 'danger'].includes(item.id))

  return (
    <TooltipProvider>
      <div className="w-56 bg-background flex flex-col border-r">
        <nav className="flex-1 p-2.5 space-y-0.5">
          <TabsList className="w-full flex-col h-auto bg-transparent gap-0.5">
            {visibleItems.map((item) => {
              const isDanger = item.id === 'danger'
              return (
                <SidebarItemComponent
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={isDanger ? 'text-red-600 hover:text-red-700 data-[state=inactive]:hover:bg-red-50 dark:data-[state=inactive]:hover:bg-red-900/10' : ''}
                />
              )
            })}
          </TabsList>
        </nav>
      </div>
    </TooltipProvider>
  )
})
