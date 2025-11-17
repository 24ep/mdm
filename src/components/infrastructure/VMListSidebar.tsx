'use client'

import { useState, useMemo } from 'react'
import { useInfrastructureInstances } from '@/features/infrastructure/hooks/useInfrastructureInstances'
import { InfrastructureInstance } from '@/features/infrastructure/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Server, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VMListSidebarProps {
  selectedVmId?: string | null
  onVmSelect?: (vm: InfrastructureInstance) => void
  spaceId?: string | null
}

export function VMListSidebar({
  selectedVmId,
  onVmSelect,
  spaceId,
}: VMListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const { instances, loading } = useInfrastructureInstances({
    spaceId,
    filters: {
      type: 'vm',
    },
  })

  // Filter VMs based on search query
  const filteredVms = useMemo(() => {
    if (!searchQuery.trim()) {
      return instances
    }
    
    const query = searchQuery.toLowerCase()
    return instances.filter((vm) => {
      return (
        vm.name?.toLowerCase().includes(query) ||
        vm.host?.toLowerCase().includes(query) ||
        vm.id?.toLowerCase().includes(query) ||
        vm.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    })
  }, [instances, searchQuery])

  const handleVmClick = (vm: InfrastructureInstance) => {
    if (onVmSelect) {
      onVmSelect(vm)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-gray-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-yellow-500'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search VMs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-xs text-muted-foreground">
            {filteredVms.length} VM{filteredVms.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* VM List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading VMs...
            </div>
          ) : filteredVms.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No VMs found matching your search' : 'No VMs available'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredVms.map((vm) => (
                <Button
                  key={vm.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start items-center text-sm h-auto px-3 py-2 transition-colors duration-150 cursor-pointer",
                    selectedVmId === vm.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => handleVmClick(vm)}
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <div className={cn(
                      "h-2 w-2 rounded-full flex-shrink-0",
                      getStatusColor(vm.status)
                    )} />
                    <Server className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="truncate font-medium">{vm.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {vm.host}
                        {vm.port && `:${vm.port}`}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

