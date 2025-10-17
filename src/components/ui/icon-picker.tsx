"use client"

import React, { useMemo, useState } from "react"
import * as LucideIcons from "lucide-react"
import { Input } from "@/components/ui/input"
import { AnimatedIcon } from "./animated-icon"

type IconComponent = React.ComponentType<{ className?: string }>

export interface IconPickerProps {
  value?: string
  onChange: (iconName: string) => void
  placeholder?: string
  grouped?: boolean
  animated?: boolean
  animation?: 'none' | 'bounce' | 'pulse' | 'spin' | 'wiggle' | 'float' | 'scale' | 'rotate' | 'shake' | 'glow'
}

// Determine which exports are icon components
function isIconEntry([key, value]: [string, any]): value is IconComponent {
  // Lucide icons are ForwardRefExoticComponent objects in React 18
  if (!value) return false
  const isLikelyComponent = typeof value === "function" || typeof value === "object"
  const isPascalCase = key && key[0] === key[0]?.toUpperCase()
  return isLikelyComponent && isPascalCase
}

function categorizeIcon(name: string): string {
  // Simple heuristics based on common Lucide prefixes/semantics
  if (/^(user|users|user|contact|profile|id)/i.test(name)) return 'Users & People'
  if (/^(building|home|house|factory|warehouse|store)/i.test(name)) return 'Places & Buildings'
  if (/^(calendar|clock|timer|hourglass|alarm|watch)/i.test(name)) return 'Date & Time'
  if (/^(file|folder|clipboard|document|note|book)/i.test(name)) return 'Files & Folders'
  if (/^(arrow|chevron|move|navigation|locate|pin)/i.test(name)) return 'Arrows & Navigation'
  if (/^(settings|cog|wrench|tool|hammer|gear)/i.test(name)) return 'Settings & Tools'
  if (/^(chart|bar|pie|line|trend|graph|activity)/i.test(name)) return 'Charts & Analytics'
  if (/^(credit|wallet|bank|coin|currency|shopping|cart)/i.test(name)) return 'Commerce & Finance'
  if (/^(message|mail|phone|chat|comment|inbox|send)/i.test(name)) return 'Communication'
  if (/^(image|photo|camera|video|play|pause|music|mic)/i.test(name)) return 'Media'
  if (/^(shield|lock|key|fingerprint|badge)/i.test(name)) return 'Security & Access'
  if (/^(bug|server|database|code|terminal)/i.test(name)) return 'Dev & System'
  if (/^(heart|star|like|dislike|smile|emoji)/i.test(name)) return 'Feedback & Status'
  return 'Others'
}

export function IconPicker({ value, onChange, placeholder = "Search icons...", grouped = true, animated = false, animation = 'scale' }: IconPickerProps) {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("All")

  const iconEntries = useMemo(() => {
    return Object.entries(LucideIcons).filter(isIconEntry) as Array<[
      string,
      IconComponent
    ]>
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return iconEntries
    return iconEntries.filter(([name]) => name.toLowerCase().includes(q))
  }, [iconEntries, query])

  const renderIconButton = (name: string, Icon: IconComponent) => {
    const selected = value === name
    return (
      <button
        key={name}
        type="button"
        onClick={() => onChange(name)}
        className="p-2 rounded-md flex flex-col items-center space-y-1 transition-colors"
        title={name}
      >
        <div
          className={
            "h-10 w-10 rounded-full flex items-center justify-center transition-colors " +
            (selected
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200")
          }
        >
          {animated ? (
            <AnimatedIcon 
              icon={name} 
              size={20} 
              animation={animation} 
              trigger="hover"
              className="text-current"
            />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        <span className="text-[8px] text-center break-all leading-none">{name}</span>
      </button>
    )
  }

  const groupedIcons = useMemo(() => {
    if (!grouped) return null
    const map = new Map<string, Array<[name: string, icon: IconComponent]>>()
    for (const [name, Icon] of filtered) {
      const cat = categorizeIcon(name)
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push([name, Icon as unknown as IconComponent])
    }
    const list = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === 'Others') return 1
      if (b[0] === 'Others') return -1
      return a[0].localeCompare(b[0])
    })
    // Prepend an "All" virtual category combining all icons
    const allIcons: Array<[string, IconComponent]> = []
    list.forEach(([, arr]) => allIcons.push(...arr))
    return [["All", allIcons] as [string, Array<[string, IconComponent]>], ...list]
  }, [filtered, grouped])

  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      {filtered.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-6 border rounded-md">No icons found</div>
      ) : grouped && groupedIcons ? (
        <div className="flex border rounded-md overflow-hidden" style={{ height: 330 }}>
          {/* Left: Category list */}
          <div className="w-64 border-r overflow-auto p-2 bg-gray-50">
            <ul className="space-y-1">
              {groupedIcons.map(([category, items]) => (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={
                      "w-full text-left px-2 py-1 rounded-md text-sm transition-colors " +
                      (activeCategory === category
                        ? "bg-white shadow-sm"
                        : "hover:bg-white/60")
                    }
                  >
                    {category}
                    <span className="text-[10px] text-muted-foreground ml-1">({items.length})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* Right: Icons grid */}
          <div className="flex-1 overflow-auto p-2">
            {groupedIcons
              .filter(([category]) => category === activeCategory)
              .map(([category, items]) => (
                <div key={category}>
                  <div className="grid grid-cols-6 gap-2">
                    {items.map(([name, Icon]) => renderIconButton(name, Icon))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-2 max-h-72 overflow-auto border rounded-md p-2">
          {filtered.map(([name, Icon]) => renderIconButton(name, Icon as unknown as IconComponent))}
        </div>
      )}
    </div>
  )
}

export default IconPicker


