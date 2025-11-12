"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface AccordionContextValue {
  value: string[]
  onValueChange: (value: string[]) => void
  type?: "single" | "multiple"
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined)

const Accordion = ({ children, value: controlledValue, onValueChange, defaultValue, type = "single", collapsible }: {
  children: React.ReactNode
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  defaultValue?: string | string[]
  type?: "single" | "multiple"
  collapsible?: boolean
}) => {
  const [internalValue, setInternalValue] = React.useState<string[]>(
    type === "single" 
      ? (defaultValue ? [String(defaultValue)] : [])
      : (Array.isArray(defaultValue) ? defaultValue : [])
  )
  const isControlled = controlledValue !== undefined
  const value = isControlled 
    ? (type === "single" ? [String(controlledValue)] : (Array.isArray(controlledValue) ? controlledValue : []))
    : internalValue

  const handleValueChange = React.useCallback((itemValue: string) => {
    let newValue: string[]
    if (type === "single") {
      // If collapsible is false, don't allow closing (always keep one open)
      if (!collapsible && value.includes(itemValue)) {
        return // Don't allow closing
      }
      newValue = value.includes(itemValue) ? [] : [itemValue]
    } else {
      newValue = value.includes(itemValue)
        ? value.filter(v => v !== itemValue)
        : [...value, itemValue]
    }

    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(type === "single" ? newValue[0] || "" : newValue)
  }, [isControlled, onValueChange, type, value, collapsible])

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, type }}>
      {children}
    </AccordionContext.Provider>
  )
}

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
  }
>(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionItemContext = React.createContext<string | undefined>(undefined)

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    showCustomChevron?: boolean
  }
>(({ className, children, showCustomChevron, ...props }, ref) => {
  const context = React.useContext(AccordionContext)
  const itemValue = React.useContext(AccordionItemContext)
  const isOpen = context?.value.includes(itemValue || "") || false

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => itemValue && context?.onValueChange(itemValue)}
      className={cn(
        "flex flex-1 items-center justify-between py-3 font-medium transition-all hover:underline",
        isOpen && "[&>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      {!showCustomChevron && <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />}
    </button>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AccordionContext)
  const itemValue = React.useContext(AccordionItemContext)
  const isOpen = context?.value.includes(itemValue || "") || false

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all",
        "pb-4 pt-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

// Wrap AccordionItem to provide context
const AccordionItemWithContext = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
  }
>(({ className, value, children, ...props }, ref) => {
  return (
    <AccordionItemContext.Provider value={value}>
      <AccordionItem ref={ref} className={className} value={value} {...props}>
        {children}
      </AccordionItem>
    </AccordionItemContext.Provider>
  )
})
AccordionItemWithContext.displayName = "AccordionItem"

export { Accordion, AccordionItemWithContext as AccordionItem, AccordionTrigger, AccordionContent }
