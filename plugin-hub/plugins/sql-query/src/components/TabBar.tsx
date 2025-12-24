'use client'

import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

interface QueryTab {
  id: string
  name: string
  query: string
  isSaved: boolean
}

interface TabBarProps {
  tabs: QueryTab[]
  activeTabId: string
  onTabChange: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onCreateNewTab: () => void
}

export function TabBar({
  tabs,
  activeTabId,
  onTabChange,
  onCloseTab,
  onCreateNewTab
}: TabBarProps) {
  return (
    <div className="bg-background border-b border-border px-4">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-3 text-sm border-b-[3px] cursor-pointer ${
              tab.id === activeTabId
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <span>{tab.name}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tab.id)
                }}
                className="ml-1 hover:bg-muted rounded p-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onClick={onCreateNewTab}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
