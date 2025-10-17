"use client"

import React, { useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import * as LucideIcons from "lucide-react"
import { IconPicker } from "./icon-picker"
import { AnimatedIcon } from "./animated-icon"
import { Z_INDEX } from "@/lib/z-index"

type IconComponent = React.ComponentType<{ className?: string }>

export interface IconPickerPopoverProps {
  value?: string
  onChange: (iconName: string) => void
  label?: string
  animated?: boolean
  animation?: 'none' | 'bounce' | 'pulse' | 'spin' | 'wiggle' | 'float' | 'scale' | 'rotate' | 'shake' | 'glow'
}

export default function IconPickerPopover({ value, onChange, animated = false, animation = 'scale' }: IconPickerPopoverProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const CurrentIcon = useMemo(() => {
    if (!value) return null
    const anyIcons = LucideIcons as unknown as Record<string, IconComponent>
    return anyIcons[value] || null
  }, [value])

  return (
    <div className="relative inline-block">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => {
          const rect = anchorRef.current?.getBoundingClientRect() || null
          setAnchorRect(rect)
          setOpen((v) => !v)
        }}
        className="p-2 rounded-md inline-flex items-center gap-3 border border-gray-200 hover:bg-gray-50"
        title={value || "Choose icon"}
      >
        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-700">
          {CurrentIcon ? (
            animated ? (
              <AnimatedIcon 
                icon={value!} 
                size={20} 
                animation={animation} 
                trigger="hover"
                className="text-current"
              />
            ) : (
              <CurrentIcon className="h-5 w-5" />
            )
          ) : (
            <span className="text-xs">?</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground max-w-[160px] truncate">{value || "None"}</span>
      </button>

      {open && anchorRect && createPortal(
        <>
          {/* Fullscreen click-capture above drawer/backdrops */}
          <div
            className="fixed inset-0"
            style={{ zIndex: Z_INDEX.overlay }}
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed bg-white border rounded-md shadow-xl"
            style={{
              zIndex: Z_INDEX.popover,
              top: anchorRect.bottom + window.scrollY + 8,
              left: Math.min(
                anchorRect.left + window.scrollX,
                Math.max(8, window.scrollX + window.innerWidth - 740)
              ),
              width: 720
            }}
          >
            <div className="p-3">
              <IconPicker
                value={value}
                onChange={(name) => {
                  onChange(name)
                  setOpen(false)
                }}
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}


