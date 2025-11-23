'use client'

import { ThemeManager } from '@/app/admin/features/system'

export default function ThemesPage() {
  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      <ThemeManager />
    </div>
  )
}

