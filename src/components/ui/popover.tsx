"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { useControlledDialogState } from "@/lib/dialog-utils"
import { Z_INDEX } from "@/lib/z-index"

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined)

const Popover = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}) => {
  const { open, setOpen } = useControlledDialogState({
    open: controlledOpen,
    onOpenChange,
    defaultOpen
  })
  const triggerRef = React.useRef<HTMLElement>(null)

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(PopoverContext)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement)
  React.useEffect(() => {
    if (context) {
      (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = triggerRef.current
    }
  }, [context])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context?.setOpen(!context.open)
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        handleClick(e)
        if (typeof (children as any).props?.onClick === 'function') {
          (children as any).props.onClick(e)
        }
      },
      ref: (node: HTMLButtonElement) => {
        triggerRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
        if ((children as any).ref) {
          if (typeof (children as any).ref === 'function') {
            (children as any).ref(node)
          } else {
            ((children as any).ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
          }
        }
        if (context) {
          (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
      },
    })
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end"
    sideOffset?: number
  }
>(({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
  const context = React.useContext(PopoverContext)
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement)

  const calculatePosition = React.useCallback(() => {
    if (!context?.open || !context.triggerRef.current) {
      setPosition(null)
      return
    }

    const rect = context.triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current?.getBoundingClientRect()
    
    // If content isn't rendered yet, use default dimensions
    if (!contentRect) {
      // Set initial position, will be recalculated once content is rendered
      const defaultWidth = 256
      let left = rect.left
      if (align === "center") {
        left = rect.left + (rect.width / 2) - (defaultWidth / 2)
      } else if (align === "end") {
        left = rect.right - defaultWidth
      }
      setPosition({
        top: rect.bottom + sideOffset,
        left,
      })
      return
    }

    const width = contentRect.width
    const height = contentRect.height
    
    // Calculate initial position
    let left = rect.left
    if (align === "center") {
      left = rect.left + (rect.width / 2) - (width / 2)
    } else if (align === "end") {
      left = rect.right - width
    }

    // Calculate top position (below trigger by default)
    let top = rect.bottom + sideOffset

    // Keep popover within viewport bounds
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 8 // Padding from viewport edges

    // Adjust horizontal position if it goes off-screen
    if (left < padding) {
      left = padding
    } else if (left + width > viewportWidth - padding) {
      left = viewportWidth - width - padding
    }

    // If popover would go off bottom, show it above the trigger instead
    if (top + height > viewportHeight - padding) {
      top = rect.top - height - sideOffset
      // If it still doesn't fit above, position it at the top of viewport
      if (top < padding) {
        top = padding
      }
    }

    // Ensure top is within bounds
    if (top < padding) {
      top = padding
    } else if (top + height > viewportHeight - padding) {
      top = viewportHeight - height - padding
    }

    setPosition({
      top,
      left,
    })
  }, [context?.open, align, sideOffset])

  React.useEffect(() => {
    calculatePosition()
  }, [calculatePosition])

  // Recalculate position when content is rendered and measured
  React.useEffect(() => {
    if (context?.open && contentRef.current) {
      // Use requestAnimationFrame to ensure content is rendered
      const frame = requestAnimationFrame(() => {
        calculatePosition()
      })
      return () => cancelAnimationFrame(frame)
    }
  }, [context?.open, calculatePosition])

  // Recalculate position on window resize
  React.useEffect(() => {
    if (!context?.open) return

    const handleResize = () => {
      calculatePosition()
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [context?.open, calculatePosition])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        context?.open &&
        contentRef.current &&
        context.triggerRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        !context.triggerRef.current.contains(e.target as Node)
      ) {
        context.setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && context?.open) {
        context.setOpen(false)
      }
    }

    if (context?.open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [context?.open])

  if (!context?.open || !position) return null

  const content = (
    <div
      ref={contentRef}
      className={cn(
        "min-w-[8rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none animate-in fade-in-0 zoom-in-95 [background-color:hsl(var(--popover))]",
        className
      )}
      style={{
        position: "fixed",
        zIndex: Z_INDEX.popover,
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      {...props}
    >
      {children}
    </div>
  )

  return typeof window !== "undefined" ? createPortal(content, document.body) : null
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
