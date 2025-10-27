'use client'

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  line?: number
  column?: number
}

interface ValidationPanelProps {
  isVisible: boolean
  onClose: () => void
  validation: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
  onJumpToLine?: (line: number, column?: number) => void
}

export function ValidationPanel({ 
  isVisible, 
  onClose, 
  validation, 
  onJumpToLine 
}: ValidationPanelProps) {
  if (!isVisible) return null

  const issues: ValidationIssue[] = [
    ...validation.errors.map(error => ({ type: 'error' as const, message: error })),
    ...validation.warnings.map(warning => ({ type: 'warning' as const, message: warning }))
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-green-50 border-green-200'
    }
  }

  const getTextColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-green-800'
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Validation</h3>
          {issues.length > 0 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {issues.length}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {issues.length === 0 ? (
          <div className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No validation issues</p>
            <p className="text-xs text-gray-500 mt-1">Your query looks good!</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getBackgroundColor(issue.type)}`}
                >
                  <div className="flex items-start gap-2">
                    {getIcon(issue.type)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getTextColor(issue.type)}`}>
                        {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                      </p>
                      <p className={`text-sm mt-1 ${getTextColor(issue.type)}`}>
                        {issue.message}
                      </p>
                      {issue.line && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Line {issue.line}
                            {issue.column && `, Column ${issue.column}`}
                          </span>
                          {onJumpToLine && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => onJumpToLine(issue.line!, issue.column)}
                            >
                              Jump to line
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          {validation.isValid ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              Query is valid
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" />
              {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}, {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
