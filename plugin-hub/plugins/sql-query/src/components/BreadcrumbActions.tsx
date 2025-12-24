'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Settings, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Space {
  id: string
  name: string
  slug: string
  description?: string
  isDefault: boolean
  icon?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

interface BreadcrumbActionsProps {
  selectedSpace: string
  spaces: Space[]
  spacesLoading: boolean
  spacesError: string | null
  onSpaceChange: (spaceId: string) => void
  onRetrySpaces?: () => void
}

export function BreadcrumbActions({
  selectedSpace,
  spaces,
  spacesLoading,
  spacesError,
  onSpaceChange,
  onRetrySpaces
}: BreadcrumbActionsProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const currentSpace = selectedSpace === 'all' 
    ? { id: 'all', name: 'All Spaces', slug: 'all' }
    : spaces.find(s => s.id === selectedSpace)

  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    space.slug.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <>
      {/* Space Selection Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between h-8 px-3 text-xs"
            disabled={spacesLoading}
          >
            <span className="truncate">
              {spacesLoading ? 'Loading spaces...' : 
               spacesError ? 'Error loading spaces' :
               selectedSpace === 'all' ? 'All Spaces' : 
               spaces.find(s => s.id === selectedSpace)?.name || 'Select space...'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search spaces..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {spacesLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Loading spaces...
                </div>
              ) : spacesError ? (
                <div className="p-4 text-center">
                  <div className="text-sm text-red-600 mb-2">
                    {spacesError.includes('Authentication') ? 'Please sign in to view spaces' : 'Error loading spaces'}
                  </div>
                  {onRetrySpaces && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onRetrySpaces()
                        setOpen(false)
                      }}
                      className="text-xs"
                    >
                      Retry
                    </Button>
                  )}
                </div>
              ) : spaces.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="text-sm text-gray-600 mb-2">No spaces available</div>
                  <div className="text-xs text-gray-500">Contact your administrator to create spaces</div>
                </div>
              ) : (
                <>
                  <CommandEmpty>No space found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        onSpaceChange('all')
                        setOpen(false)
                        setSearchValue('')
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSpace === 'all' ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Spaces
                    </CommandItem>
                    {filteredSpaces.map((space) => (
                      <CommandItem
                        key={space.id}
                        value={space.id}
                        onSelect={() => {
                          onSpaceChange(space.id)
                          setOpen(false)
                          setSearchValue('')
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSpace === space.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{space.name}</span>
                          <span className="text-xs text-gray-500">{space.slug}</span>
                          {space.isDefault && (
                            <span className="text-xs text-blue-600">Default</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Settings Button */}
      <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
        <Settings className="h-4 w-4 mr-1" />
        Settings
      </Button>
    </>
  )
}

