"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { SCROLLABLE_HEIGHTS } from "@/lib/constants"
import { Z_INDEX } from "@/lib/z-index"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

const Select = ({ children, value: controlledValue, onValueChange, defaultValue }: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement>(null)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }, [isControlled, onValueChange])

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen, triggerRef }}>
      {children}
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => {
  return <div role="group">{children}</div>
}

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const context = React.useContext(SelectContext)
  return <span>{context?.value || placeholder}</span>
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement)
  React.useEffect(() => {
    if (context) {
      (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current = triggerRef.current
    }
  }, [context])

  const handleClick = () => {
    context?.setOpen(!context.open)
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-[4px] border border-border bg-input text-foreground px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    position?: "popper" | "item-aligned"
  }
>(({ className, children, position = "popper", ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const [positionState, setPositionState] = React.useState<{ top: number; left: number; width: number } | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement)

  React.useEffect(() => {
    if (context?.open && context.triggerRef.current) {
      const rect = context.triggerRef.current.getBoundingClientRect()
      setPositionState({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    } else {
      setPositionState(null)
    }
  }, [context?.open])

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

  if (!context?.open || !positionState) return null

  const content = (
    <div
      ref={contentRef}
      className={cn(
        `relative ${SCROLLABLE_HEIGHTS.SMALL} min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 [background-color:hsl(var(--popover))]`,
        className
      )}
      style={{
        position: "fixed",
        zIndex: Z_INDEX.popover,
        top: `${positionState.top}px`,
        left: `${positionState.left}px`,
        width: position === "popper" ? `${positionState.width}px` : "auto",
        minWidth: position === "popper" ? `${positionState.width}px` : "8rem",
        maxWidth: position === "popper" ? `${positionState.width}px` : "none",
      }}
      {...props}
    >
      <div className="p-1" style={{ width: position === "popper" ? `${positionState.width}px` : "auto" }}>
        {children}
      </div>
    </div>
  )

  return typeof window !== "undefined" ? createPortal(content, document.body) : null
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
  }
>(({ className, value, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const isSelected = context?.value === value

  const handleClick = () => {
    context?.onValueChange(value)
  }

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = "SelectSeparator"

const SelectScrollUpButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </div>
)

const SelectScrollDownButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </div>
)

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
