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
    <div className="bg-white border-b border-gray-200 px-4">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 cursor-pointer ${
              tab.id === activeTabId
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
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
                className="ml-1 hover:bg-gray-200 rounded p-1"
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
