"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined)

const TooltipProvider = ({ children, delayDuration = 300 }: { children: React.ReactNode; delayDuration?: number }) => {
  return <>{children}</>
}

const Tooltip = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(TooltipContext)

  const handleMouseEnter = () => {
    context?.setOpen(true)
  }

  const handleMouseLeave = () => {
    context?.setOpen(false)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        handleMouseEnter()
        if (typeof (children as any).props?.onMouseEnter === 'function') {
          (children as any).props.onMouseEnter(e)
        }
      },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        handleMouseLeave()
        if (typeof (children as any).props?.onMouseLeave === 'function') {
          (children as any).props.onMouseLeave(e)
        }
      },
      ref: (node: HTMLElement) => {
        if (typeof ref === 'function') {
          ref(node as any)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node as any
        }
        if ((children as any).ref) {
          if (typeof (children as any).ref === 'function') {
            (children as any).ref(node)
          } else {
            ((children as any).ref as React.MutableRefObject<HTMLElement | null>).current = node
          }
        }
      },
    })
  }

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    sideOffset?: number
  }
>(({ className, sideOffset = 4, children, ...props }, ref) => {
  const context = React.useContext(TooltipContext)
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement)

  React.useEffect(() => {
    if (context?.open) {
      // Find the trigger element by traversing up from the content
      const findTrigger = () => {
        let element = contentRef.current?.previousElementSibling as HTMLElement
        while (element) {
          if (element.onmouseenter) {
            return element
          }
          element = element.previousElementSibling as HTMLElement
        }
        return null
      }
      
      const trigger = findTrigger()
      if (trigger) {
        triggerRef.current = trigger
        const rect = trigger.getBoundingClientRect()
        const contentRect = contentRef.current?.getBoundingClientRect()
        setPosition({
          top: rect.bottom + sideOffset,
          left: rect.left + (rect.width / 2),
        })
      }
    } else {
      setPosition(null)
    }
  }, [context?.open, sideOffset])

  if (!context?.open || !position) return null

  const content = (
    <div
      ref={contentRef}
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
      {...props}
    >
      {children}
    </div>
  )

  return typeof window !== "undefined" ? createPortal(content, document.body) : null
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
