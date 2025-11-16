import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface RadioGroupItemProps {
  value: string
  id?: string
  className?: string
  disabled?: boolean
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("grid gap-2", className)}
        role="radiogroup"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === RadioGroupItem) {
            return React.cloneElement(child, {
              checked: value === (child.props as any).value,
              onChange: () => onValueChange?.((child.props as any).value),
            } as any)
          }
          return child
        })}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, disabled, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          type="radio"
          value={value}
          id={id}
          disabled={disabled}
          className={cn(
            "h-4 w-4 rounded-full border-2 border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer",
            "checked:bg-primary checked:border-primary",
            className
          )}
          {...props}
        />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={cn(
            "w-2 h-2 rounded-full bg-white transition-opacity",
            (props as any).checked ? "opacity-100" : "opacity-0"
          )} />
        </div>
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
