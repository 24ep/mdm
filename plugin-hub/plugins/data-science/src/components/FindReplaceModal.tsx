'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Replace, ChevronUp, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FindReplaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFind: (searchText: string) => void
  onReplace: (searchText: string, replaceText: string) => void
  onReplaceAll: (searchText: string, replaceText: string) => void
  onFindNext: () => void
  onFindPrevious: () => void
  matchCount?: number
  currentMatch?: number
  initialSearchText?: string
  initialReplaceText?: string
}

export function FindReplaceModal({
  open,
  onOpenChange,
  onFind,
  onReplace,
  onReplaceAll,
  onFindNext,
  onFindPrevious,
  matchCount = 0,
  currentMatch = 0,
  initialSearchText = '',
  initialReplaceText = ''
}: FindReplaceModalProps) {
  const [searchText, setSearchText] = useState(initialSearchText)
  const [replaceText, setReplaceText] = useState(initialReplaceText)
  const [isReplaceMode, setIsReplaceMode] = useState(false)

  useEffect(() => {
    if (open) {
      setSearchText(initialSearchText)
      setReplaceText(initialReplaceText)
    }
  }, [open, initialSearchText, initialReplaceText])

  const handleFind = () => {
    if (searchText.trim()) {
      onFind(searchText)
    }
  }

  const handleReplace = () => {
    if (searchText.trim()) {
      onReplace(searchText, replaceText)
    }
  }

  const handleReplaceAll = () => {
    if (searchText.trim()) {
      onReplaceAll(searchText, replaceText)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (e.shiftKey && isReplaceMode) {
        handleReplace()
      } else {
        handleFind()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {isReplaceMode ? 'Find and Replace' : 'Find'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Find</Label>
            <div className="flex items-center gap-2">
              <Input
                id="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                autoFocus
                className="flex-1"
              />
              {matchCount > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {currentMatch} / {matchCount}
                </div>
              )}
            </div>
          </div>

          {/* Replace Input - shown when in replace mode */}
          {isReplaceMode && (
            <div className="space-y-2">
              <Label htmlFor="replace">Replace with</Label>
              <Input
                id="replace"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Replace with..."
              />
            </div>
          )}

          {/* Match Navigation */}
          {matchCount > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div>
                {matchCount} match{matchCount !== 1 ? 'es' : ''} found
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onFindPrevious}
                  className="h-7 px-2"
                  title="Previous match (Shift+F3)"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onFindNext}
                  className="h-7 px-2"
                  title="Next match (F3)"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isReplaceMode ? 'default' : 'outline'}
              onClick={() => setIsReplaceMode(!isReplaceMode)}
            >
              <Replace className="h-4 w-4 mr-1" />
              Replace
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {isReplaceMode && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReplace}
                  disabled={!searchText.trim()}
                >
                  Replace
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReplaceAll}
                  disabled={!searchText.trim()}
                >
                  Replace All
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={handleFind}
              disabled={!searchText.trim()}
            >
              Find
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

