'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  page: number
  pages: number
  onPageChange: (page: number) => void
  className?: string
  showPageNumbers?: boolean
  maxPageNumbers?: number
}

export function Pagination({
  page,
  pages,
  onPageChange,
  className,
  showPageNumbers = true,
  maxPageNumbers = 5,
}: PaginationProps) {
  const canGoPrevious = page > 1
  const canGoNext = page < pages

  const getPageNumbers = () => {
    if (!showPageNumbers || pages <= 1) return []

    const numbers: (number | string)[] = []
    const half = Math.floor(maxPageNumbers / 2)

    let start = Math.max(1, page - half)
    let end = Math.min(pages, page + half)

    if (end - start < maxPageNumbers - 1) {
      if (start === 1) {
        end = Math.min(pages, start + maxPageNumbers - 1)
      } else {
        start = Math.max(1, end - maxPageNumbers + 1)
      }
    }

    if (start > 1) {
      numbers.push(1)
      if (start > 2) {
        numbers.push('...')
      }
    }

    for (let i = start; i <= end; i++) {
      numbers.push(i)
    }

    if (end < pages) {
      if (end < pages - 1) {
        numbers.push('...')
      }
      numbers.push(pages)
    }

    return numbers
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="text-sm text-muted-foreground">
        Page {page} of {pages}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {showPageNumbers && pageNumbers.length > 0 && (
          <div className="flex items-center gap-1">
            {pageNumbers.map((num, idx) => {
              if (num === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                )
              }

              const pageNum = num as number
              const isActive = pageNum === page

              return (
                <Button
                  key={pageNum}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={cn(isActive && 'pointer-events-none')}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pages)}
          disabled={!canGoNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

