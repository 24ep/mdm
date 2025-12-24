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
import { Database, Settings, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Space {
  id: string
  name: string
  slug: string
}

interface HeaderProps {
  selectedSpace: string
  spaces: Space[]
  onSpaceChange: (spaceId: string) => void
}

export function Header({ selectedSpace, spaces, onSpaceChange }: HeaderProps) {
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
    <div className="bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-foreground">SQL Query</h1>
          </div>
          
          {/* Space Selection Dropdown */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between h-8 px-3"
              >
                <span className="truncate">
                  {currentSpace?.name || 'Select space...'}
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
                          <span className="text-xs text-muted-foreground">{space.slug}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 px-3">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
