"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

// Ensure accordion trigger is always transparent with border bottom
if (typeof document !== 'undefined') {
  const styleId = 'accordion-transparent-override'
  const addStyle = () => {
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        button[data-component="accordion-trigger"],
        [data-component="accordion-trigger"],
        button[type="button"][data-component="accordion-trigger"] {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          border-radius: 0px !important;
          border-top-left-radius: 0px !important;
          border-top-right-radius: 0px !important;
          border-bottom-left-radius: 0px !important;
          border-bottom-right-radius: 0px !important;
          color: #000000 !important; /* Black font color */
          border-bottom-color: rgba(0, 0, 0, 0.06) !important;
          border-bottom-width: 0.5px !important;
          border-bottom-style: solid !important;
          box-shadow: none !important;
        }
        button[data-component="accordion-trigger"]:hover,
        [data-component="accordion-trigger"]:hover,
        button[type="button"][data-component="accordion-trigger"]:hover {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          color: #000000 !important; /* Black font color */
          border-bottom-color: rgba(0, 0, 0, 0.06) !important;
          border-bottom-width: 0.5px !important;
          border-bottom-style: solid !important;
          box-shadow: none !important;
        }
        button[data-component="accordion-trigger"][data-state="open"],
        [data-component="accordion-trigger"][data-state="open"],
        button[type="button"][data-component="accordion-trigger"][data-state="open"],
        button[data-component="accordion-trigger"][data-state="closed"],
        [data-component="accordion-trigger"][data-state="closed"],
        button[type="button"][data-component="accordion-trigger"][data-state="closed"] {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          color: #000000 !important; /* Black font color */
          border-bottom-color: rgba(0, 0, 0, 0.06) !important;
          border-bottom-width: 0.5px !important;
          border-bottom-style: solid !important;
          box-shadow: none !important;
        }
      `
      document.head.appendChild(style)
    }
  }
  
  // Add style for accordion content background
  const contentStyleId = 'accordion-content-background'
  const addContentStyle = () => {
    if (!document.getElementById(contentStyleId)) {
      const style = document.createElement('style')
      style.id = contentStyleId
      style.textContent = `
        [data-radix-accordion-content],
        [class*="AccordionContent"] {
          background-color: transparent !important;
          color: #000000 !important; /* Black font color */
        }
      `
      document.head.appendChild(style)
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addContentStyle)
  } else {
    addContentStyle()
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addStyle)
  } else {
    addStyle()
  }
}

interface AccordionContextValue {
  value: string[]
  onValueChange: (itemValue: string) => void
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
    className={cn("border-b border-border", className)}
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
>(({ className, children, showCustomChevron, style, ...props }, ref) => {
  const context = React.useContext(AccordionContext)
  const itemValue = React.useContext(AccordionItemContext)
  const isOpen = context?.value.includes(itemValue || "") || false
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  
  // Combine refs
  const combinedRef = React.useCallback((node: HTMLButtonElement | null) => {
    buttonRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }, [ref])

  // Ensure transparent background is applied after render
  React.useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.style.setProperty('background', 'transparent', 'important')
      buttonRef.current.style.setProperty('background-color', 'transparent', 'important')
      buttonRef.current.style.setProperty('background-image', 'none', 'important')
      buttonRef.current.style.setProperty('border-radius', '0px', 'important')
      buttonRef.current.style.setProperty('border-bottom-color', 'rgba(0, 0, 0, 0.06)', 'important')
      buttonRef.current.style.setProperty('border-bottom-width', '0.5px', 'important')
      buttonRef.current.style.setProperty('border-bottom-style', 'solid', 'important')
      buttonRef.current.style.setProperty('box-shadow', 'none', 'important')
    }
  }, [isOpen])

  return (
    <button
      ref={combinedRef}
      type="button"
      data-component="accordion-trigger"
      data-state={isOpen ? "open" : "closed"}
      onClick={() => itemValue && context?.onValueChange(itemValue)}
      className={cn(
        "flex flex-1 items-center justify-between w-full py-3 font-medium transition-all",
        "no-underline",
        className
      )}
      style={{
        backgroundColor: 'transparent',
        background: 'transparent',
        backgroundImage: 'none',
        borderRadius: '0px',
        color: '#000000', // Black font color
        borderBottomColor: 'rgba(0, 0, 0, 0.06)',
        borderBottomWidth: '0.5px',
        borderBottomStyle: 'solid',
        boxShadow: 'none',
        ...style
      } as React.CSSProperties}
      {...props}
    >
      <span className="flex-1 text-left">{children}</span>
      {!showCustomChevron && (
        <div className="flex items-center shrink-0 ml-2">
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
          )}
        </div>
      )}
    </button>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, style, ...props }, ref) => {
  const context = React.useContext(AccordionContext)
  const itemValue = React.useContext(AccordionItemContext)
  const isOpen = context?.value.includes(itemValue || "") || false

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all",
        "pb-4 pt-4 px-4",
        "bg-muted/30",
        className
      )}
      style={{
        backgroundColor: 'transparent', // Transparent background
        color: '#000000', // Black font color
        ...style
      } as React.CSSProperties}
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
