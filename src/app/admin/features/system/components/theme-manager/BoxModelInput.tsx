import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Maximize2, Move, Layout, Box, Minus } from 'lucide-react'

interface BoxModelInputProps {
    label: string
    basePath: string
    config: any
    type: 'margin' | 'padding' | 'radius' | 'border-width'
    onChange: (path: string, value: string) => void
    icon?: React.ReactNode
    placeholder?: string
}

export function BoxModelInput({
    label,
    basePath,
    config,
    type,
    onChange,
    icon,
    placeholder = '0'
}: BoxModelInputProps) {
    const componentKey = basePath.split('.').pop() as string
    const componentStyle = config.componentStyling?.[componentKey] || {}

    // Define property keys based on type
    const getKeys = () => {
        switch (type) {
            case 'margin':
                return {
                    main: 'margin',
                    top: 'marginTop',
                    right: 'marginRight',
                    bottom: 'marginBottom',
                    left: 'marginLeft'
                }
            case 'padding':
                return {
                    main: 'padding',
                    top: 'paddingTop',
                    right: 'paddingRight',
                    bottom: 'paddingBottom',
                    left: 'paddingLeft'
                }
            case 'radius':
                return {
                    main: 'borderRadius',
                    top: 'borderTopLeftRadius',
                    right: 'borderTopRightRadius',
                    bottom: 'borderBottomRightRadius',
                    left: 'borderBottomLeftRadius'
                }
            case 'border-width':
                 return {
                    main: 'borderWidth',
                    top: 'borderTopWidth',
                    right: 'borderRightWidth',
                    bottom: 'borderBottomWidth',
                    left: 'borderLeftWidth'
                }
        }
    }

    const { main, top, right, bottom, left } = getKeys()

    // Get values
    const mainValue = componentStyle[main] || ''
    const topValue = componentStyle[top] || ''
    const rightValue = componentStyle[right] || ''
    const bottomValue = componentStyle[bottom] || ''
    const leftValue = componentStyle[left] || ''

    // Determine state
    const hasMixedValues = topValue || rightValue || bottomValue || leftValue
    
    // If mixed, show "Mixed" in main input, otherwise show main value
    const displayValue = hasMixedValues ? (mainValue ? 'Mixed' : 'Mixed') : mainValue

    // Handle main input change
    const handleMainChange = (value: string) => {
        onChange(`${basePath}.${main}`, value)
        // Clear individual sides when main is set? 
        // Or should specific sides override main?
        // Usually specific sides override. But if user types in main, they might expect to reset all sides.
        // Let's reset individual sides to keep it simple and consistent with "Basic vs Advanced"
        if (type !== 'radius') {
             // For radius, it's corners
             onChange(`${basePath}.${top}`, '')
             onChange(`${basePath}.${right}`, '')
             onChange(`${basePath}.${bottom}`, '')
             onChange(`${basePath}.${left}`, '')
        } else {
             onChange(`${basePath}.${top}`, '')
             onChange(`${basePath}.${right}`, '')
             onChange(`${basePath}.${bottom}`, '')
             onChange(`${basePath}.${left}`, '')
        }
    }

    const getSideLabels = () => {
        switch(type) {
             case 'radius': return { t: 'TL', r: 'TR', b: 'BR', l: 'BL' } // Top-Left, Top-Right...
             default: return { t: 'T', r: 'R', b: 'B', l: 'L' }
        }
    }
    const sideLabels = getSideLabels()


    return (
        <div className="flex items-center gap-4">
             <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                {icon}
                {label}
            </Label>
            <div className="flex-1 flex gap-2">
                <Input
                    value={displayValue}
                    onChange={(e) => handleMainChange(e.target.value)}
                    className="flex-1 font-mono text-sm"
                    placeholder={hasMixedValues ? "Mixed" : placeholder}
                />
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="end">
                        <div className="space-y-3">
                            <div className="text-xs font-medium text-muted-foreground text-center mb-2 uppercase tracking-wider">
                                {type === 'radius' ? 'Corner Radii' : 'Individual Sides'}
                            </div>
                            
                            {/* Visual Box Model Representation - Simplified Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* Top / Top-Left */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground flex justify-center">{sideLabels.t}</Label>
                                    <Input 
                                        value={topValue} 
                                        onChange={(e) => onChange(`${basePath}.${top}`, e.target.value)}
                                        className="h-8 text-xs text-center"
                                        placeholder={mainValue || "0"}
                                    />
                                </div>

                                {/* Right / Top-Right */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground flex justify-center">{sideLabels.r}</Label>
                                    <Input 
                                        value={rightValue} 
                                        onChange={(e) => onChange(`${basePath}.${right}`, e.target.value)}
                                        className="h-8 text-xs text-center"
                                        placeholder={mainValue || "0"}
                                    />
                                </div>

                                {/* Left / Bottom-Left */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground flex justify-center">{sideLabels.l}</Label>
                                    <Input 
                                        value={leftValue} 
                                        onChange={(e) => onChange(`${basePath}.${left}`, e.target.value)}
                                        className="h-8 text-xs text-center"
                                        placeholder={mainValue || "0"}
                                    />
                                </div>
                                
                                {/* Bottom / Bottom-Right */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground flex justify-center">{sideLabels.b}</Label>
                                    <Input 
                                        value={bottomValue} 
                                        onChange={(e) => onChange(`${basePath}.${bottom}`, e.target.value)}
                                        className="h-8 text-xs text-center"
                                        placeholder={mainValue || "0"}
                                    />
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}
