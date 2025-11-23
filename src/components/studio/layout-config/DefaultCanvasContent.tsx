'use client'

import React from 'react'

interface DefaultCanvasContentProps {
  isMobile: boolean
}

export function DefaultCanvasContent({ isMobile }: DefaultCanvasContentProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="text-center max-w-md">
        <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-muted-foreground mb-2`}>
          Start Building Your Page
        </h1>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          Drag widgets from the palette to build your layout
        </p>
      </div>
    </div>
  )
}

