import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Maximize2, Move, Layout, Box, Minus, Settings2 } from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'

interface BoxModelInputProps {
    label: string
    basePath: string
    config: any
    type: 'margin' | 'padding' | 'radius' | 'border-width'
    onChange: (path: string, value: string) => void
    icon?: React.ReactNode
    placeholder?: string
    iconPosition?: 'left' | 'right'
}

export function BoxModelInput({
    label,
    basePath,
    config,
    type,
    onChange,
    icon,
    placeholder = '0',
    iconPosition = 'left'
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

    const handleMainChange = (value: string) => {
        onChange(`${basePath}.${main}`, value)
        if (type !== 'radius') {
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
        switch (type) {
            case 'radius': return { t: 'TL', r: 'TR', b: 'BR', l: 'BL' } // Top-Left, Top-Right...
            default: return { t: 'Top', r: 'Right', b: 'Bottom', l: 'Left' }
        }
    }
    const sideLabels = getSideLabels()

    // Helper for border configuration popover
    const BorderSideConfig = ({ side, prefix }: { side: string, prefix: string }) => {
        const widthKey = type === 'border-width' ? (side === 'Top' ? top : side === 'Right' ? right : side === 'Bottom' ? bottom : left) : ''
        const colorKey = `border${side}Color`
        const styleKey = `border${side}Style`

        const widthVal = componentStyle[widthKey] || ''
        const colorVal = componentStyle[colorKey] || ''
        const styleVal = componentStyle[styleKey] || ''

        return (
            <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 items-center">
                <Label className="text-xs text-muted-foreground">{prefix}</Label>
                <Input
                    value={widthVal}
                    onChange={(e) => onChange(`${basePath}.${widthKey}`, e.target.value)}
                    className="h-7 text-xs"
                    placeholder="Width"
                />
                <div className="h-7">
                    <ColorInput
                        value={colorVal}
                        onChange={(color) => onChange(`${basePath}.${colorKey}`, color)}
                        allowImageVideo={false}
                        className="w-full h-full"
                        inputClassName="h-7 text-xs pl-7"
                    />
                </div>
                <Select
                    value={styleVal || ''}
                    onValueChange={(value) => onChange(`${basePath}.${styleKey}`, value)}
                >
                    <SelectTrigger className="h-7 text-xs w-full">
                        <SelectValue placeholder="Style" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                        <SelectItem value="double">Double</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-4">
            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                {label}
            </Label>
            <div className="flex-1 relative">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`absolute ${iconPosition === 'left' ? 'left-1' : 'right-1'} top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground z-10`}
                        >
                            {icon || <Settings2 className="h-3.5 w-3.5" />}
                        </Button>
                    </PopoverTrigger>
                    <Input
                        value={displayValue}
                        onChange={(e) => handleMainChange(e.target.value)}
                        className={`font-mono text-sm ${iconPosition === 'left' ? 'pl-9' : 'pr-9'}`}
                        placeholder={hasMixedValues ? "Mixed" : placeholder}
                    />

                    <PopoverContent className={type === 'border-width' ? "w-[400px] p-3" : "w-64 p-3"} align={iconPosition === 'left' ? 'start' : 'end'}>
                        <div className="space-y-3">
                            <div className="text-xs font-medium text-muted-foreground text-center mb-2 uppercase tracking-wider">
                                {type === 'radius' ? 'Corner Radii' : (type === 'border-width' ? 'Individual Border Sides' : 'Individual Sides')}
                            </div>

                            {type === 'border-width' ? (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 px-1 mb-1">
                                        <div />
                                        <Label className="text-[10px] text-muted-foreground text-center">Width</Label>
                                        <Label className="text-[10px] text-muted-foreground text-center">Color</Label>
                                        <Label className="text-[10px] text-muted-foreground text-center">Style</Label>
                                    </div>
                                    <BorderSideConfig side="Top" prefix={sideLabels.t} />
                                    <BorderSideConfig side="Right" prefix={sideLabels.r} />
                                    <BorderSideConfig side="Bottom" prefix={sideLabels.b} />
                                    <BorderSideConfig side="Left" prefix={sideLabels.l} />
                                </div>
                            ) : (
                                /* Visual Box Model Representation - Simplified Grid for Padding/Margin/Radius */
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
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}
