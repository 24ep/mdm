'use client'

import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

interface TopMenuProps {
  isMobileViewport: boolean
  setMobileSettingsOpen: (open: boolean) => void
}

export function TopMenu({
  isMobileViewport,
  setMobileSettingsOpen,
}: TopMenuProps) {
  return (
    <div className={`${isMobileViewport ? 'p-3' : 'p-4'} flex ${isMobileViewport ? 'flex-col' : 'items-center justify-end'} sticky top-0 z-20 bg-background border-b`}>
      {isMobileViewport && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileSettingsOpen(true)}
          aria-label="Open settings"
        >
          <Menu className="h-4 w-4 mr-2" /> Settings
        </Button>
      )}
    </div>
  )
}

