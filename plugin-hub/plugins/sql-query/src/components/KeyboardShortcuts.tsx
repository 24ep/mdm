'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick keyboard shortcuts to improve your workflow
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Query Operations</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Run Query</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Save Query</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + S</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">New Tab</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + N</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Close Tab</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + W</kbd>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Navigation</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Show Templates</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + T</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Show Bookmarks</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + B</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Show History</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + H</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Show Results</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + R</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Show Visualization</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + V</kbd>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">General</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Show Shortcuts Help</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">F1</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Close Dialogs</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Escape</kbd>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
