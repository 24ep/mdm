'use client'

import React from 'react'
import { BarChart3 } from 'lucide-react'

interface ChartErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ChartErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ChartErrorBoundary extends React.Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart rendering error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="w-full h-full p-3 flex flex-col items-center justify-center">
          <BarChart3 className="h-8 w-8 mb-2 text-muted-foreground" />
          <div className="text-xs text-red-500 text-center font-medium">
            Chart Error
          </div>
          <div className="text-xs text-muted-foreground text-center mt-1 px-2">
            {this.state.error?.message || 'Unable to render chart'}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

