'use client'

import React from 'react'

interface DefaultCanvasContentProps {
  isMobile: boolean
}

export function DefaultCanvasContent({ isMobile }: DefaultCanvasContentProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-foreground mb-2`}>
          Welcome to Your Dashboard
        </h1>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          Drag widgets from the palette to build your layout
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 mb-6`}>
        {['Total Users', 'Active Projects', 'Completed Tasks'].map((title, idx) => (
          <div key={idx} className="bg-background rounded-lg border border-border p-4 shadow-sm">
            <div className="text-xs text-muted-foreground mb-1">{title}</div>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>
              {idx === 0 ? '1,234' : idx === 1 ? '45' : '892'}
            </div>
            <div className={`text-xs ${idx === 0 ? 'text-green-600' : idx === 1 ? 'text-blue-600' : 'text-purple-600'} mt-1`}>
              {idx === 0 ? '+12%' : idx === 1 ? '+5%' : '+23%'} from last month
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Activity */}
      <div className="bg-background rounded-lg border border-border p-4 shadow-sm">
        <h2 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-foreground mb-3`}>
          Recent Activity
        </h2>
        <div className="space-y-2">
          {['New user registered', 'Project updated', 'Task completed', 'Report generated']
            .slice(0, isMobile ? 2 : 4)
            .map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-foreground flex-1`}>
                  {activity}
                </span>
                <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                  2h ago
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

