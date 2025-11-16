"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type UserOption = { value: string; label: string; email?: string }

export interface UserComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function UserCombobox({ value, onValueChange, placeholder = "Select user...", disabled = false, className }: UserComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [options, setOptions] = React.useState<UserOption[]>([])

  const selected = options.find(o => o.value === value)

  const fetchUsers = React.useCallback(async (q: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      params.set('limit', '10')
      const res = await fetch(`/api/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const opts: UserOption[] = (data.users || []).map((u: any) => ({ value: u.id, label: u.name || u.email || u.id, email: u.email }))
        setOptions(opts)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      void fetchUsers("")
    }
  }, [open, fetchUsers])

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", !selected && "text-muted-foreground")}
            disabled={disabled}
            type="button"
          >
            <span className="flex items-center gap-2 truncate">
              <User className="h-4 w-4" />
              {selected ? (
                <span className="truncate">{selected.label}{selected.email ? ` (${selected.email})` : ''}</span>
              ) : (
                placeholder
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            <CommandInput placeholder="Search users..." value={query} onValueChange={(v) => { setQuery(v); void fetchUsers(v) }} />
            <CommandList>
              <CommandEmpty>{loading ? 'Loading...' : 'No users found.'}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onValueChange?.(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.email && <span className="text-xs text-muted-foreground">{option.email}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}


