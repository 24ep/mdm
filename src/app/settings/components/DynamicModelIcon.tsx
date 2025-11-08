'use client'

import * as LucideIcons from 'lucide-react'

export function DynamicModelIcon({ name, className }: { name?: string, className?: string }) {
  if (!name) return (
    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded bg-black/10">?</span>
  )
  const AnyIcons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  const Icon = AnyIcons[name]
  if (!Icon) return (
    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded bg-black/10">?</span>
  )
  return <Icon className={className} />
}
