"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { useControlledDialogState, useDialogBodyScrollLock, useDialogEscapeKey } from "@/lib/dialog-utils"
import { Z_INDEX } from "@/lib/z-index"

interface DrawerContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DrawerContext = React.createContext<DrawerContextValue | undefined>(undefined)

const Drawer = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: {
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

  useDialogBodyScrollLock(open)

  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </DrawerContext.Provider>
  )
}

const DrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DrawerContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context?.setOpen(true)
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
      },
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
DrawerTrigger.displayName = "DrawerTrigger"

const DrawerClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DrawerContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context?.setOpen(false)
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
      },
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
DrawerClose.displayName = "DrawerClose"

const DrawerOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    overlayColor?: string
    overlayOpacity?: number
    overlayBlur?: number
  }
>(({ className, overlayColor, overlayOpacity, overlayBlur, ...props }, ref) => {
  const context = React.useContext(DrawerContext)

  if (!context?.open) return null

  // Get values from props or CSS variables (set by branding config)
  const color = overlayColor || (typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--drawer-overlay-color').trim() || '#000000' : '#000000')
  const opacity = overlayOpacity ?? (typeof window !== 'undefined' ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--drawer-overlay-opacity').trim()) || 80 : 80)
  const blur = overlayBlur ?? (typeof window !== 'undefined' ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--drawer-overlay-blur').trim().replace('px', '')) || 4 : 4)

  // Convert hex to rgba if needed
  const getBackgroundColor = () => {
    if (!color) return undefined
    
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
      // Extract RGB values and apply opacity
      const rgbMatch = color.match(/(\d+),\s*(\d+),\s*(\d+)/)
      if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity / 100})`
      }
      return color
    } else {
      // Convert hex to rgba
      const hex = color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
    }
  }

  const backgroundColor = getBackgroundColor()
  const blurValue = blur > 0 ? `${blur}px` : undefined

  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 animate-in fade-in-0",
        !backgroundColor && "bg-background/80",
        !blurValue && "backdrop-blur-sm",
        className
      )}
      style={{ 
        zIndex: Z_INDEX.overlay,
        ...(backgroundColor ? { backgroundColor } : {}),
        ...(blurValue ? { 
          backdropFilter: `blur(${blurValue})`,
          WebkitBackdropFilter: `blur(${blurValue})`
        } : {})
      }}
      {...props}
    />
  )
})
DrawerOverlay.displayName = "DrawerOverlay"

const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    widthClassName?: string
    floating?: boolean
    floatingMargin?: string
    overlayColor?: string
    overlayOpacity?: number
    overlayBlur?: number
  }
>(({ className, children, widthClassName = "w-[500px]", floating = false, floatingMargin = "16px", overlayColor, overlayOpacity, overlayBlur, ...props }, ref) => {
  const context = React.useContext(DrawerContext)

  useDialogEscapeKey(
    context?.open ?? false,
    () => context?.setOpen(false),
    true
  )

  if (!context?.open) return null

  const content = (
    <>
      <DrawerOverlay overlayColor={overlayColor} overlayOpacity={overlayOpacity} overlayBlur={overlayBlur} />
      <div
        ref={ref}
        className={cn(
          "fixed bg-background border-l border-border shadow-xl outline-none animate-in slide-in-from-right",
          floating 
            ? "rounded-l-lg" 
            : "inset-y-0 right-0 h-full",
          widthClassName,
          className
        )}
        style={{ 
          zIndex: Z_INDEX.drawer,
          ...(floating ? (() => {
            const marginNum = parseFloat(floatingMargin) || 16
            const marginUnit = floatingMargin.replace(String(marginNum), '') || 'px'
            return {
              top: floatingMargin,
              right: floatingMargin,
              bottom: floatingMargin,
              height: `calc(100vh - ${marginNum * 2}${marginUnit})`,
            }
          })() : {})
        }}
        data-drawer-content
        {...props}
      >
        {children}
      </div>
    </>
  )

  return typeof window !== "undefined" ? createPortal(content, document.body) : null
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-b border-border px-4 py-3", className)} {...props} />
)
const DrawerTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-base font-semibold", className)} {...props} />
)

const DrawerDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

export { Drawer, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription }
