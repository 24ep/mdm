'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw,
  Settings,
  Share2,
  Download,
  Eye,
  Filter,
  Search
} from 'lucide-react'
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign'

interface MobileDashboardLayoutProps {
  children: React.ReactNode
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onFullscreen: () => void
  isFullscreen: boolean
  onRefresh: () => void
  onSettings: () => void
  onShare: () => void
  onExport: () => void
  onPreview: () => void
  onFilter: () => void
  onSearch: () => void
  title: string
  subtitle?: string
}

export function MobileDashboardLayout({
  children,
  onToggleSidebar,
  sidebarOpen,
  onFullscreen,
  isFullscreen,
  onRefresh,
  onSettings,
  onShare,
  onExport,
  onPreview,
  onFilter,
  onSearch,
  title,
  subtitle
}: MobileDashboardLayoutProps) {
  const { isMobile, isTablet } = useResponsiveDesign()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  if (!isMobile && !isTablet) {
    return <>{children}</>
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="p-2"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div>
            <h1 className="text-lg font-semibold truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="p-2"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFullscreen}
            className="p-2"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="absolute top-16 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSearch()
                setShowMobileMenu(false)
              }}
              className="w-full justify-start"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onFilter()
                setShowMobileMenu(false)
              }}
              className="w-full justify-start"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onShare()
                setShowMobileMenu(false)
              }}
              className="w-full justify-start"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onExport()
                setShowMobileMenu(false)
              }}
              className="w-full justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onPreview()
                setShowMobileMenu(false)
              }}
              className="w-full justify-start"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSettings()
                setShowMobileMenu(false)
              }}
              className="w-full justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Navigation (for very small screens) */}
      {isMobile && (
        <div className="bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-around">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="flex flex-col items-center space-y-1 p-2"
            >
              <Menu className="h-4 w-4" />
              <span className="text-xs">Menu</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFilter}
              className="flex flex-col items-center space-y-1 p-2"
            >
              <Filter className="h-4 w-4" />
              <span className="text-xs">Filter</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="flex flex-col items-center space-y-1 p-2"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Share</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="flex flex-col items-center space-y-1 p-2"
            >
              <Settings className="h-4 w-4" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
