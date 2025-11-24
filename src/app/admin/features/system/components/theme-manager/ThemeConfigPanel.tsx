import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Theme, BrandingConfig } from '../../types-theme'
import { useThemes } from '../../hooks/useThemes'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Paintbrush, Type, Layout, Image as ImageIcon, Component, Eye, X, Settings, ArrowUp, ArrowRight, ArrowDown, ArrowLeft, ArrowLeftRight, Minus, Maximize2, Minimize2, AlignLeft, AlignCenter, AlignRight, AlignJustify, CaseUpper, Underline, Italic, Bold, EyeOff, MousePointer, Focus, Grid3x3, Layers, Move, RotateCw, Filter as FilterIcon, Sparkles, Box, Zap, MoreVertical } from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { applyBrandingColors, applyGlobalStyling, applyComponentStyling } from '@/lib/branding'

interface ThemeConfigPanelProps {
    theme: Theme
}

// Memoized ColorInputField component to prevent unnecessary re-renders
const ColorInputField = React.memo(({ 
    label, 
    path, 
    value, 
    onChange 
}: { 
    label: string
    path: string
    value?: string
    onChange: (path: string, value: string) => void
}) => {
    const handleColorChange = useCallback((color: string) => {
        onChange(path, color)
    }, [path, onChange])

    return (
        <div className="flex items-center gap-4">
            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0">{label}</Label>
            <div className="flex-1">
                <ColorInput
                    value={value || ''}
                    onChange={handleColorChange}
                    allowImageVideo={false}
                    className="relative w-full"
                    placeholder="#000000"
                    inputClassName="font-mono text-sm pl-10 h-9"
                />
            </div>
        </div>
    )
})

ColorInputField.displayName = 'ColorInputField'

// Memoized TextInput component to prevent unnecessary re-renders
const TextInput = React.memo(({ 
    label, 
    path, 
    value, 
    placeholder, 
    icon,
    onChange
}: { 
    label: string
    path: string
    value?: string
    placeholder?: string
    icon?: React.ReactNode
    onChange: (path: string, value: string) => void
}) => {
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(path, e.target.value)
    }, [path, onChange])

    return (
        <div className="flex items-center gap-4">
            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                {icon && <span className="text-muted-foreground">{icon}</span>}
                {label}
            </Label>
            <Input
                value={value || ''}
                onChange={handleInputChange}
                className="flex-1"
                placeholder={placeholder}
            />
        </div>
    )
})

TextInput.displayName = 'TextInput'

export function ThemeConfigPanel({ theme }: ThemeConfigPanelProps) {
    const { updateTheme } = useThemes()

    // Local editable copy of config
    const [config, setConfig] = useState<BrandingConfig>(theme.config)
    const [name, setName] = useState<string>(theme.name)
    const [description, setDescription] = useState<string>(theme.description || '')
    const [tags, setTags] = useState<string[]>(theme.tags || [])
    const [isSaving, setIsSaving] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [newTag, setNewTag] = useState('')
    
    // Ref to track previous config to prevent infinite loops
    const prevConfigRef = useRef<string>('')
    const isApplyingRef = useRef(false)

    // Update local config when theme selection changes
    useEffect(() => {
        setConfig(theme.config)
        setName(theme.name)
        setDescription(theme.description || '')
        setTags(theme.tags || [])
        // Reset prev config when theme changes
        prevConfigRef.current = ''
    }, [theme.id, theme.config, theme.name, theme.description, theme.tags])

    // Apply branding immediately when config changes (for live preview)
    // Only auto-apply if theme is active, otherwise user can click "Apply Preview"
    useEffect(() => {
        if (!config || isApplyingRef.current) return
        
        // Serialize config to compare with previous
        const configString = JSON.stringify(config)
        
        // Only apply if config actually changed
        if (configString === prevConfigRef.current) return
        
        // Only auto-apply if this is the active theme
        if (theme.isActive) {
            isApplyingRef.current = true
            try {
                // Apply branding directly (no light/dark mode conversion needed)
                applyBrandingColors(config)
                applyGlobalStyling(config)
                applyComponentStyling(config)
                // Update ref after successful application
                prevConfigRef.current = configString
            } catch (error) {
                console.error('Error applying branding:', error)
            } finally {
                // Use setTimeout to ensure DOM updates complete before allowing next application
                setTimeout(() => {
                    isApplyingRef.current = false
                }, 0)
            }
        } else {
            // Update ref even if not active to prevent re-applying on next render
            prevConfigRef.current = configString
        }
    }, [config, theme.isActive])

    const handleChange = useCallback((path: string, value: any) => {
        const keys = path.split('.')
        setConfig((prev: any) => {
            const newConfig = { ...prev }
            let cur = newConfig
            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i]
                cur[k] = { ...(cur[k] || {}) }
                cur = cur[k]
            }
            cur[keys[keys.length - 1]] = value
            return newConfig
        })
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateTheme(theme.id, { name, description, config, tags })
        } catch (e) {
            // error handling is done in hook
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddTag = () => {
        const trimmedTag = newTag.trim().toLowerCase()
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag])
            setNewTag('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleTagKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddTag()
        }
    }

    const handleApply = () => {
        // Apply branding immediately without saving (for preview)
        try {
            // Apply branding directly (no light/dark mode conversion needed)
            applyBrandingColors(config)
            applyGlobalStyling(config)
            applyComponentStyling(config)
            console.log('Branding applied successfully', { themeMode: theme.themeMode, themeId: theme.id })
        } catch (error) {
            console.error('Error applying branding:', error)
        }
    }


    // Helper component for advanced styling properties
    const AdvancedStyling = React.memo(({ basePath }: { basePath: string }) => {
        const componentKey = basePath.split('.').pop() as keyof typeof config.componentStyling
        const componentStyle = config.componentStyling?.[componentKey] as any
        
        return (
            <>
                <Separator />
                <div className="space-y-4">
                    <div className="text-xs font-semibold text-muted-foreground">Advanced Styling</div>
                    
                    {/* Layout & Sizing */}
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                        <div className="text-xs font-medium text-muted-foreground/80">Layout & Sizing</div>
                        <TextInput onChange={handleChange} label="Margin" path={`${basePath}.margin`} value={componentStyle?.margin} placeholder="0.5rem" icon={<Move className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Width" path={`${basePath}.width`} value={componentStyle?.width} placeholder="100%" icon={<ArrowLeftRight className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Height" path={`${basePath}.height`} value={componentStyle?.height} placeholder="auto" icon={<ArrowLeftRight className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Min Width" path={`${basePath}.minWidth`} value={componentStyle?.minWidth} placeholder="0" icon={<Minimize2 className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Max Width" path={`${basePath}.maxWidth`} value={componentStyle?.maxWidth} placeholder="none" icon={<Maximize2 className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Min Height" path={`${basePath}.minHeight`} value={componentStyle?.minHeight} placeholder="0" icon={<Minimize2 className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Max Height" path={`${basePath}.maxHeight`} value={componentStyle?.maxHeight} placeholder="none" icon={<Maximize2 className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Gap" path={`${basePath}.gap`} value={componentStyle?.gap} placeholder="0.5rem" icon={<Grid3x3 className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Z-Index" path={`${basePath}.zIndex`} value={componentStyle?.zIndex} placeholder="0" icon={<Layers className="h-3 w-3" />} />
                    </div>
                    
                    {/* Typography */}
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                        <div className="text-xs font-medium text-muted-foreground/80">Typography</div>
                        <TextInput onChange={handleChange} label="Font Family" path={`${basePath}.fontFamily`} value={componentStyle?.fontFamily} placeholder="inherit" icon={<Type className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Font Style" path={`${basePath}.fontStyle`} value={componentStyle?.fontStyle} placeholder="normal" icon={<Italic className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Font Weight" path={`${basePath}.fontWeight`} value={componentStyle?.fontWeight} placeholder="400" icon={<Bold className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Letter Spacing" path={`${basePath}.letterSpacing`} value={componentStyle?.letterSpacing} placeholder="0" icon={<Type className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Line Height" path={`${basePath}.lineHeight`} value={componentStyle?.lineHeight} placeholder="1.5" icon={<Type className="h-3 w-3" />} />
                        <div className="flex items-center gap-4">
                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                                <AlignLeft className="h-3 w-3 text-muted-foreground" />
                                Text Align
                            </Label>
                            <Select
                                value={componentStyle?.textAlign || ''}
                                onValueChange={(value) => handleChange(`${basePath}.textAlign`, value)}
                            >
                                <SelectTrigger className="flex-1 h-8 text-sm">
                                    <SelectValue placeholder="inherit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">inherit</SelectItem>
                                    <SelectItem value="left">left</SelectItem>
                                    <SelectItem value="center">center</SelectItem>
                                    <SelectItem value="right">right</SelectItem>
                                    <SelectItem value="justify">justify</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                                <CaseUpper className="h-3 w-3 text-muted-foreground" />
                                Text Transform
                            </Label>
                            <Select
                                value={componentStyle?.textTransform || ''}
                                onValueChange={(value) => handleChange(`${basePath}.textTransform`, value)}
                            >
                                <SelectTrigger className="flex-1 h-8 text-sm">
                                    <SelectValue placeholder="none" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">none</SelectItem>
                                    <SelectItem value="uppercase">uppercase</SelectItem>
                                    <SelectItem value="lowercase">lowercase</SelectItem>
                                    <SelectItem value="capitalize">capitalize</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                                <Underline className="h-3 w-3 text-muted-foreground" />
                                Text Decoration
                            </Label>
                            <Select
                                value={componentStyle?.textDecoration || ''}
                                onValueChange={(value) => handleChange(`${basePath}.textDecoration`, value)}
                            >
                                <SelectTrigger className="flex-1 h-8 text-sm">
                                    <SelectValue placeholder="none" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">none</SelectItem>
                                    <SelectItem value="underline">underline</SelectItem>
                                    <SelectItem value="overline">overline</SelectItem>
                                    <SelectItem value="line-through">line-through</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(componentStyle?.textDecoration && componentStyle?.textDecoration !== 'none') && (
                            <div className="space-y-3 pl-4 border-l-2 border-muted">
                                <TextDecorationLineInput basePath={basePath} componentStyle={componentStyle} />
                                {componentStyle?.textDecoration === 'underline' && (
                                    <>
                                        <TextInput onChange={handleChange} label="Underline Offset" path={`${basePath}.textUnderlineOffset`} value={componentStyle?.textUnderlineOffset} placeholder="auto" icon={<ArrowUp className="h-3 w-3" />} />
                                        <div className="flex items-center gap-4">
                                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                                                <ArrowUp className="h-3 w-3 text-muted-foreground" />
                                                Underline Position
                                            </Label>
                                            <Select
                                                value={componentStyle?.textUnderlinePosition || ''}
                                                onValueChange={(value) => handleChange(`${basePath}.textUnderlinePosition`, value)}
                                            >
                                                <SelectTrigger className="flex-1 h-8 text-sm">
                                                    <SelectValue placeholder="auto" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">auto</SelectItem>
                                                    <SelectItem value="under">under</SelectItem>
                                                    <SelectItem value="left">left</SelectItem>
                                                    <SelectItem value="right">right</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        <TextInput onChange={handleChange} label="White Space" path={`${basePath}.whiteSpace`} value={componentStyle?.whiteSpace} placeholder="normal" icon={<Type className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Word Break" path={`${basePath}.wordBreak`} value={componentStyle?.wordBreak} placeholder="normal" icon={<Type className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Text Overflow" path={`${basePath}.textOverflow`} value={componentStyle?.textOverflow} placeholder="clip" icon={<Type className="h-3 w-3" />} />
                    </div>
                    
                    {/* Visual Effects */}
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                        <div className="text-xs font-medium text-muted-foreground/80">Visual Effects</div>
                        <TextInput onChange={handleChange} label="Opacity" path={`${basePath}.opacity`} value={componentStyle?.opacity} placeholder="1" icon={<Eye className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Backdrop Filter" path={`${basePath}.backdropFilter`} value={componentStyle?.backdropFilter} placeholder="blur(10px)" icon={<Sparkles className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Box Shadow" path={`${basePath}.boxShadow`} value={componentStyle?.boxShadow} placeholder="0 1px 2px rgba(0,0,0,0.1)" icon={<Box className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Filter" path={`${basePath}.filter`} value={componentStyle?.filter} placeholder="brightness(1.1)" icon={<FilterIcon className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Transform" path={`${basePath}.transform`} value={componentStyle?.transform} placeholder="scale(1.05)" icon={<RotateCw className="h-3 w-3" />} />
                    </div>
                    
                    {/* Interaction & Behavior */}
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                        <div className="text-xs font-medium text-muted-foreground/80">Interaction & Behavior</div>
                        <div className="flex items-center gap-4">
                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                                <MousePointer className="h-3 w-3 text-muted-foreground" />
                                Cursor
                            </Label>
                            <Select
                                value={componentStyle?.cursor || ''}
                                onValueChange={(value) => handleChange(`${basePath}.cursor`, value)}
                            >
                                <SelectTrigger className="flex-1 h-8 text-sm">
                                    <SelectValue placeholder="default" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">default</SelectItem>
                                    <SelectItem value="pointer">pointer</SelectItem>
                                    <SelectItem value="not-allowed">not-allowed</SelectItem>
                                    <SelectItem value="wait">wait</SelectItem>
                                    <SelectItem value="text">text</SelectItem>
                                    <SelectItem value="move">move</SelectItem>
                                    <SelectItem value="grab">grab</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <TextInput onChange={handleChange} label="Outline" path={`${basePath}.outline`} value={componentStyle?.outline} placeholder="2px solid #007AFF" icon={<Focus className="h-3 w-3" />} />
                        <ColorInputField onChange={handleChange} label="Outline Color" path={`${basePath}.outlineColor`} value={componentStyle?.outlineColor} />
                        <TextInput onChange={handleChange} label="Outline Width" path={`${basePath}.outlineWidth`} value={componentStyle?.outlineWidth} placeholder="0" icon={<Focus className="h-3 w-3" />} />
                        <div className="flex items-center gap-4">
                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                                <MoreVertical className="h-3 w-3 text-muted-foreground" />
                                Overflow
                            </Label>
                            <Select
                                value={componentStyle?.overflow || ''}
                                onValueChange={(value) => handleChange(`${basePath}.overflow`, value)}
                            >
                                <SelectTrigger className="flex-1 h-8 text-sm">
                                    <SelectValue placeholder="visible" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">visible</SelectItem>
                                    <SelectItem value="hidden">hidden</SelectItem>
                                    <SelectItem value="scroll">scroll</SelectItem>
                                    <SelectItem value="auto">auto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <TextInput onChange={handleChange} label="Overflow X" path={`${basePath}.overflowX`} value={componentStyle?.overflowX} placeholder="visible" icon={<MoreVertical className="h-3 w-3" />} />
                        <TextInput onChange={handleChange} label="Overflow Y" path={`${basePath}.overflowY`} value={componentStyle?.overflowY} placeholder="visible" icon={<MoreVertical className="h-3 w-3" />} />
                        <div className="flex items-center gap-4">
                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                                <EyeOff className="h-3 w-3 text-muted-foreground" />
                                Visibility
                            </Label>
                            <Select
                                value={componentStyle?.visibility || ''}
                                onValueChange={(value) => handleChange(`${basePath}.visibility`, value)}
                            >
                                <SelectTrigger className="flex-1 h-8 text-sm">
                                    <SelectValue placeholder="visible" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">visible</SelectItem>
                                    <SelectItem value="hidden">hidden</SelectItem>
                                    <SelectItem value="collapse">collapse</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                                <MousePointer className="h-3 w-3 text-muted-foreground" />
                                Pointer Events
                            </Label>
                            <Select
                                value={componentStyle?.pointerEvents || ''}
                                onValueChange={(value) => handleChange(`${basePath}.pointerEvents`, value)}
                            >
                                <SelectTrigger className="flex-1 h-8 text-sm">
                                    <SelectValue placeholder="auto" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">auto</SelectItem>
                                    <SelectItem value="none">none</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                                <MousePointer className="h-3 w-3 text-muted-foreground" />
                                User Select
                            </Label>
                            <Select
                                value={componentStyle?.userSelect || ''}
                                onValueChange={(value) => handleChange(`${basePath}.userSelect`, value)}
                            >
                                <SelectTrigger className="flex-1 h-8 text-sm">
                                    <SelectValue placeholder="auto" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">auto</SelectItem>
                                    <SelectItem value="none">none</SelectItem>
                                    <SelectItem value="text">text</SelectItem>
                                    <SelectItem value="all">all</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </>
        )
    })

    // Helper component for component state variants (focus, hover, active, disabled, selected)
    const ComponentStates = ({ basePath }: { basePath: string }) => {
        const componentKey = basePath.split('.').pop() as keyof typeof config.componentStyling
        
        return (
            <>
                <Separator />
                <div className="space-y-4">
                    <div className="text-xs font-semibold text-muted-foreground">Component States</div>
                    
                    {/* Focus State */}
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                        <div className="text-xs font-medium text-muted-foreground/80">Focus State</div>
                        <ColorInputField onChange={handleChange} label="Background" path={`${basePath}-focus.backgroundColor`} value={config.componentStyling?.[`${componentKey}-focus` as keyof typeof config.componentStyling]?.['backgroundColor' as keyof typeof config.componentStyling[string]]} />
                        <ColorInputField onChange={handleChange} label="Text" path={`${basePath}-focus.textColor`} value={config.componentStyling?.[`${componentKey}-focus` as keyof typeof config.componentStyling]?.['textColor' as keyof typeof config.componentStyling[string]]} />
                        <BorderConfig basePath={`${basePath}-focus`} />
                        <div className="p-2 bg-muted/20 rounded border">
                            <TextInput onChange={handleChange} 
                                label="Focus Ring (Box Shadow)" 
                                path={`${basePath}-focus.boxShadow`} 
                                value={config.componentStyling?.[`${componentKey}-focus` as keyof typeof config.componentStyling]?.['boxShadow' as keyof typeof config.componentStyling[string]]} 
                                placeholder="0 0 0 3px rgba(0, 122, 255, 0.1)" 
                                icon={<Focus className="h-3 w-3" />}
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                                Creates the focus ring effect for accessibility
                            </div>
                        </div>
                        <AdvancedStyling basePath={`${basePath}-focus`} />
                    </div>
                    
                    {/* Hover State */}
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                        <div className="text-xs font-medium text-muted-foreground/80">Hover State</div>
                        <ColorInputField onChange={handleChange} label="Background" path={`${basePath}-hover.backgroundColor`} value={config.componentStyling?.[`${componentKey}-hover` as keyof typeof config.componentStyling]?.['backgroundColor' as keyof typeof config.componentStyling[string]]} />
                        <ColorInputField onChange={handleChange} label="Text" path={`${basePath}-hover.textColor`} value={config.componentStyling?.[`${componentKey}-hover` as keyof typeof config.componentStyling]?.['textColor' as keyof typeof config.componentStyling[string]]} />
                        <BorderConfig basePath={`${basePath}-hover`} />
                        <AdvancedStyling basePath={`${basePath}-hover`} />
                    </div>
                    
                    {/* Active State */}
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                        <div className="text-xs font-medium text-muted-foreground/80">Active State</div>
                        <ColorInputField onChange={handleChange} label="Background" path={`${basePath}-active.backgroundColor`} value={config.componentStyling?.[`${componentKey}-active` as keyof typeof config.componentStyling]?.['backgroundColor' as keyof typeof config.componentStyling[string]]} />
                        <ColorInputField onChange={handleChange} label="Text" path={`${basePath}-active.textColor`} value={config.componentStyling?.[`${componentKey}-active` as keyof typeof config.componentStyling]?.['textColor' as keyof typeof config.componentStyling[string]]} />
                        <BorderConfig basePath={`${basePath}-active`} />
                        <AdvancedStyling basePath={`${basePath}-active`} />
                    </div>
                    
                    {/* Disabled State */}
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                        <div className="text-xs font-medium text-muted-foreground/80">Disabled State</div>
                        <ColorInputField onChange={handleChange} label="Background" path={`${basePath}-disabled.backgroundColor`} value={config.componentStyling?.[`${componentKey}-disabled` as keyof typeof config.componentStyling]?.['backgroundColor' as keyof typeof config.componentStyling[string]]} />
                        <ColorInputField onChange={handleChange} label="Text" path={`${basePath}-disabled.textColor`} value={config.componentStyling?.[`${componentKey}-disabled` as keyof typeof config.componentStyling]?.['textColor' as keyof typeof config.componentStyling[string]]} />
                        <BorderConfig basePath={`${basePath}-disabled`} />
                        <div className="p-2 bg-muted/20 rounded border">
                            <TextInput onChange={handleChange} 
                                label="Opacity" 
                                path={`${basePath}-disabled.opacity`} 
                                value={config.componentStyling?.[`${componentKey}-disabled` as keyof typeof config.componentStyling]?.['opacity' as keyof typeof config.componentStyling[string]]} 
                                placeholder="0.6" 
                                icon={<EyeOff className="h-3 w-3" />}
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                                Controls disabled state visibility (0-1)
                            </div>
                        </div>
                        <AdvancedStyling basePath={`${basePath}-disabled`} />
                    </div>
                    
                    {/* Selected/Checked State (for checkboxes, radios, switches) */}
                    {(componentKey === 'checkbox' || componentKey === 'radio' || componentKey === 'switch') && (
                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                            <div className="text-xs font-medium text-muted-foreground/80">Selected/Checked State</div>
                            <ColorInputField onChange={handleChange} label="Background" path={`${basePath}-checked.backgroundColor`} value={config.componentStyling?.[`${componentKey}-checked` as keyof typeof config.componentStyling]?.['backgroundColor' as keyof typeof config.componentStyling[string]]} />
                            <ColorInputField onChange={handleChange} label="Text" path={`${basePath}-checked.textColor`} value={config.componentStyling?.[`${componentKey}-checked` as keyof typeof config.componentStyling]?.['textColor' as keyof typeof config.componentStyling[string]]} />
                            <BorderConfig basePath={`${basePath}-checked`} />
                            <AdvancedStyling basePath={`${basePath}-checked`} />
                        </div>
                    )}
                </div>
            </>
        )
    }

    // Helper component for grouped border side input with popover
    const BorderSideInput = ({ 
        side, 
        basePath, 
        componentStyle, 
        icon 
    }: { 
        side: 'Top' | 'Right' | 'Bottom' | 'Left'
        basePath: string
        componentStyle: any
        icon: React.ReactNode
    }) => {
        const colorPath = `${basePath}.border${side}Color`
        const widthPath = `${basePath}.border${side}Width`
        const stylePath = `${basePath}.border${side}Style`
        
        const color = componentStyle?.[`border${side}Color`] || ''
        const width = componentStyle?.[`border${side}Width`] || ''
        const style = componentStyle?.[`border${side}Style`] || ''
        
        // Create summary text for the input
        const summary = [color && `Color: ${color}`, width && `Width: ${width}`, style && `Style: ${style}`]
            .filter(Boolean)
            .join(', ') || 'Click to configure'
        
        // Get border width as number for preview
        const borderWidthNum = width ? parseFloat(width.replace('px', '').replace('rem', '').replace('em', '')) || 1 : 1
        const borderStyle = style || 'solid'
        const borderColor = color || '#e5e7eb'
        
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9"
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-muted-foreground">{icon}</span>
                            <span className="text-xs font-medium text-muted-foreground/80 shrink-0">{side}</span>
                            {/* Border preview */}
                            <div 
                                className="w-12 h-4 rounded border shrink-0"
                                style={{
                                    borderColor: borderColor,
                                    borderWidth: `${borderWidthNum}px`,
                                    borderStyle: borderStyle,
                                    backgroundColor: 'transparent'
                                }}
                            />
                            <span className="text-xs text-muted-foreground truncate flex-1">{summary}</span>
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Border {side} Configuration</div>
                        <ColorInputField onChange={handleChange} label="Color" path={colorPath} value={color} />
                        <TextInput onChange={handleChange} label="Width" path={widthPath} value={width} placeholder="0.5px" icon={icon} />
                        <TextInput onChange={handleChange} label="Style" path={stylePath} value={style} placeholder="solid" icon={icon} />
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    // Helper component for grouped text decoration line styling input with popover
    const TextDecorationLineInput = ({ 
        basePath, 
        componentStyle 
    }: { 
        basePath: string
        componentStyle: any
    }) => {
        const colorPath = `${basePath}.textDecorationColor`
        const weightPath = `${basePath}.textDecorationThickness`
        const stylePath = `${basePath}.textDecorationStyle`
        
        const color = componentStyle?.textDecorationColor || ''
        const weight = componentStyle?.textDecorationThickness || ''
        const style = componentStyle?.textDecorationStyle || ''
        
        // Create summary text for the input
        const summary = [color && `Color: ${color}`, weight && `Weight: ${weight}`, style && `Style: ${style}`]
            .filter(Boolean)
            .join(', ') || 'Click to configure'
        
        // Get line thickness for preview
        const lineThickness = weight ? parseFloat(weight.replace('px', '').replace('rem', '').replace('em', '')) || 1 : 1
        const lineStyle = style || 'solid'
        const lineColor = color || '#000000'
        
        // Generate border style for preview based on line style
        const getBorderStyle = (style: string) => {
            switch(style) {
                case 'dashed': return 'dashed'
                case 'dotted': return 'dotted'
                case 'double': return 'double'
                case 'wavy': return 'solid' // wavy can't be represented with border, use solid
                default: return 'solid'
            }
        }
        
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-9"
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-muted-foreground"><Minus className="h-3 w-3" /></span>
                            <span className="text-xs font-medium text-muted-foreground/80 shrink-0">Line Styling</span>
                            {/* Text decoration line preview */}
                            <div className="relative w-12 h-4 shrink-0 flex items-center justify-center">
                                <div 
                                    className="w-full"
                                    style={{
                                        borderBottom: `${lineThickness}px ${getBorderStyle(lineStyle)} ${lineColor}`,
                                        height: '0',
                                        position: 'relative'
                                    }}
                                />
                                {lineStyle === 'double' && (
                                    <div 
                                        className="absolute w-full"
                                        style={{
                                            borderBottom: `${Math.max(1, lineThickness / 3)}px ${getBorderStyle(lineStyle)} ${lineColor}`,
                                            top: `${lineThickness + 2}px`,
                                            height: '0'
                                        }}
                                    />
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate flex-1">{summary}</span>
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Text Decoration Line Configuration</div>
                        <ColorInputField onChange={handleChange} label="Line Color" path={colorPath} value={color} />
                        <TextInput onChange={handleChange} label="Line Weight" path={weightPath} value={weight} placeholder="1px" icon={<Minus className="h-3 w-3" />} />
                        <div className="flex items-center gap-4">
                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1.5">
                                <Minus className="h-3 w-3 text-muted-foreground" />
                                Line Style
                            </Label>
                            <Select
                                value={style || ''}
                                onValueChange={(value) => handleChange(stylePath, value)}
                            >
                                <SelectTrigger className="flex-1 h-8 text-sm">
                                    <SelectValue placeholder="solid" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">solid</SelectItem>
                                    <SelectItem value="double">double</SelectItem>
                                    <SelectItem value="dotted">dotted</SelectItem>
                                    <SelectItem value="dashed">dashed</SelectItem>
                                    <SelectItem value="wavy">wavy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    // Helper component for border configuration with individual sides
    const BorderConfig = ({ basePath }: { basePath: string }) => {
        const componentKey = basePath.split('.').pop() as keyof typeof config.componentStyling
        const componentStyle = config.componentStyling?.[componentKey] as any
        
        return (
            <>
                <Separator />
                <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Border (All Sides)</div>
                    <ColorInputField onChange={handleChange} label="Color" path={`${basePath}.borderColor`} value={componentStyle?.borderColor} />
                    <TextInput onChange={handleChange} label="Width" path={`${basePath}.borderWidth`} value={componentStyle?.borderWidth} placeholder="0.5px" icon={<Minus className="h-3 w-3" />} />
                    <TextInput onChange={handleChange} label="Style" path={`${basePath}.borderStyle`} value={componentStyle?.borderStyle} placeholder="solid" icon={<Minus className="h-3 w-3" />} />
                </div>
                <Separator />
                <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Individual Border Sides</div>
                    <div className="space-y-2 pl-4">
                        <BorderSideInput 
                            side="Top" 
                            basePath={basePath} 
                            componentStyle={componentStyle} 
                            icon={<ArrowUp className="h-3 w-3" />} 
                        />
                    </div>
                    <div className="space-y-2 pl-4">
                        <BorderSideInput 
                            side="Right" 
                            basePath={basePath} 
                            componentStyle={componentStyle} 
                            icon={<ArrowRight className="h-3 w-3" />} 
                        />
                    </div>
                    <div className="space-y-2 pl-4">
                        <BorderSideInput 
                            side="Bottom" 
                            basePath={basePath} 
                            componentStyle={componentStyle} 
                            icon={<ArrowDown className="h-3 w-3" />} 
                        />
                    </div>
                    <div className="space-y-2 pl-4">
                        <BorderSideInput 
                            side="Left" 
                            basePath={basePath} 
                            componentStyle={componentStyle} 
                            icon={<ArrowLeft className="h-3 w-3" />} 
                        />
                    </div>
                </div>
            </>
        )
    }

    return (
        <div className="relative h-full p-6">
            {/* Configuration Panel */}
                <div className="flex flex-col overflow-hidden border rounded-lg h-full">
                <div className="pb-4 px-6 pt-6 border-b space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Theme Configuration</h2>
                            <p className="text-sm text-muted-foreground">Customize the look and feel of your application</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleApply}>
                                Apply Preview
                            </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <Tabs defaultValue="general" className="h-full flex flex-col">
                        <div className="px-6 py-2 border-b bg-muted/30">
                            <TabsList className="grid w-full grid-cols-6">
                                <TabsTrigger value="general" className="text-xs"><Settings className="w-3 h-3 mr-2" />General</TabsTrigger>
                                <TabsTrigger value="colors" className="text-xs"><Paintbrush className="w-3 h-3 mr-2" />Colors</TabsTrigger>
                                <TabsTrigger value="layout" className="text-xs"><Layout className="w-3 h-3 mr-2" />Layout</TabsTrigger>
                                <TabsTrigger value="typography" className="text-xs"><Type className="w-3 h-3 mr-2" />Type</TabsTrigger>
                                <TabsTrigger value="branding" className="text-xs"><ImageIcon className="w-3 h-3 mr-2" />Brand</TabsTrigger>
                                <TabsTrigger value="components" className="text-xs"><Component className="w-3 h-3 mr-2" />Comps</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            {/* General Tab */}
                            <TabsContent value="general" className="space-y-6 mt-0">
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Theme Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Theme Name</Label>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Theme name..."
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Description</Label>
                                            <Textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Theme description..."
                                                className="min-h-[60px] text-sm resize-none"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <Separator />
                                
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Tags</h3>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {tags.map(tag => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                    className="text-xs px-2 py-0.5"
                                                >
                                                    {tag}
                                                    <button
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="ml-1.5 hover:text-destructive"
                                                        type="button"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyPress={handleTagKeyPress}
                                                placeholder="Add tag..."
                                                className="flex-1 h-8 text-sm"
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleAddTag}
                                                size="sm"
                                                variant="outline"
                                                disabled={!newTag.trim() || tags.includes(newTag.trim().toLowerCase())}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Colors Tab */}
                            <TabsContent value="colors" className="space-y-8 mt-0">
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Color Palette ({theme.themeMode})</h3>
                                    <div className="space-y-3">
                                        <ColorInputField label="Primary" path="primaryColor" value={config.primaryColor} onChange={handleChange} />
                                        <ColorInputField label="Secondary" path="secondaryColor" value={config.secondaryColor} onChange={handleChange} />
                                        <ColorInputField label="Background" path="uiBackgroundColor" value={config.uiBackgroundColor} onChange={handleChange} />
                                        <ColorInputField label="Body BG" path="bodyBackgroundColor" value={config.bodyBackgroundColor} onChange={handleChange} />
                                        <ColorInputField label="Body Text" path="bodyTextColor" value={config.bodyTextColor} onChange={handleChange} />
                                        <ColorInputField label="Border" path="uiBorderColor" value={config.uiBorderColor} onChange={handleChange} />
                                        <ColorInputField label="Warning" path="warningColor" value={config.warningColor} onChange={handleChange} />
                                        <ColorInputField label="Danger" path="dangerColor" value={config.dangerColor} onChange={handleChange} />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Layout Colors Tab */}
                            <TabsContent value="layout" className="space-y-8 mt-0">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold">Top Menu Bar</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="topMenuBackgroundColor" value={config.topMenuBackgroundColor} />
                                        <ColorInputField onChange={handleChange} label="Text" path="topMenuTextColor" value={config.topMenuTextColor} />
                                        <div className="p-3 bg-muted/30 rounded-lg border border-primary/20">
                                            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                <Sparkles className="h-3 w-3" />
                                                Glassmorphism Effect (Backdrop Blur)
                                            </div>
                                            <TextInput onChange={handleChange} 
                                                label="Backdrop Filter" 
                                                path="componentStyling.top-menu-bar.backdropFilter" 
                                                value={config.componentStyling?.['top-menu-bar']?.backdropFilter} 
                                                placeholder="blur(30px) saturate(200%)" 
                                                icon={<Sparkles className="h-3 w-3" />}
                                            />
                                            <div className="text-xs text-muted-foreground mt-2">
                                                Example: <code className="px-1 py-0.5 bg-muted rounded">blur(30px) saturate(200%)</code> for frosted glass effect
                                            </div>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg border">
                                            <div className="text-xs font-medium text-muted-foreground mb-2">Border & Shadow</div>
                                            <ColorInputField onChange={handleChange} label="Border Color" path="componentStyling.top-menu-bar.borderColor" value={config.componentStyling?.['top-menu-bar']?.borderColor} />
                                            <TextInput onChange={handleChange} label="Border Width" path="componentStyling.top-menu-bar.borderWidth" value={config.componentStyling?.['top-menu-bar']?.borderWidth} placeholder="0px 0px 0.5px 0px" />
                                            <TextInput onChange={handleChange} label="Box Shadow" path="componentStyling.top-menu-bar.boxShadow" value={config.componentStyling?.['top-menu-bar']?.boxShadow} placeholder="0 1px 3px 0 rgba(0, 0, 0, 0.05)" />
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg border">
                                            <div className="text-xs font-medium text-muted-foreground mb-2">Animation</div>
                                            <TextInput onChange={handleChange} label="Transition" path="componentStyling.top-menu-bar.transition" value={config.componentStyling?.['top-menu-bar']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold">Platform Sidebar</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="platformSidebarBackgroundColor" value={config.platformSidebarBackgroundColor} />
                                        <ColorInputField onChange={handleChange} label="Text" path="platformSidebarTextColor" value={config.platformSidebarTextColor} />
                                        <div className="p-3 bg-muted/30 rounded-lg border border-primary/20">
                                            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                <Sparkles className="h-3 w-3" />
                                                Glassmorphism Effect (Backdrop Blur)
                                            </div>
                                            <TextInput onChange={handleChange} 
                                                label="Backdrop Filter" 
                                                path="componentStyling.platform-sidebar-primary.backdropFilter" 
                                                value={config.componentStyling?.['platform-sidebar-primary']?.backdropFilter} 
                                                placeholder="blur(30px) saturate(200%)" 
                                                icon={<Sparkles className="h-3 w-3" />}
                                            />
                                            <div className="text-xs text-muted-foreground mt-2">
                                                Example: <code className="px-1 py-0.5 bg-muted rounded">blur(30px) saturate(200%)</code> for frosted glass effect
                                            </div>
                                        </div>
                                        <TextInput onChange={handleChange} label="Transition" path="componentStyling.platform-sidebar-primary.transition" value={config.componentStyling?.['platform-sidebar-primary']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Platform Sidebar Menu Items</h3>
                                    <Tabs defaultValue="normal" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="normal">Normal</TabsTrigger>
                                            <TabsTrigger value="hover">Hover</TabsTrigger>
                                            <TabsTrigger value="active">Active</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="normal" className="space-y-3 mt-4">
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.platform-sidebar-menu-normal.backgroundColor" value={config.componentStyling?.['platform-sidebar-menu-normal']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.platform-sidebar-menu-normal.textColor" value={config.componentStyling?.['platform-sidebar-menu-normal']?.textColor} />
                                            <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.platform-sidebar-menu-normal.borderRadius" value={config.componentStyling?.['platform-sidebar-menu-normal']?.borderRadius} placeholder="8px" />
                                            <TextInput onChange={handleChange} label="Padding" path="componentStyling.platform-sidebar-menu-normal.padding" value={config.componentStyling?.['platform-sidebar-menu-normal']?.padding} placeholder="0.5rem 0.75rem" />
                                            <TextInput onChange={handleChange} label="Font Size" path="componentStyling.platform-sidebar-menu-normal.fontSize" value={config.componentStyling?.['platform-sidebar-menu-normal']?.fontSize} placeholder="0.875rem" />
                                            <TextInput onChange={handleChange} label="Font Weight" path="componentStyling.platform-sidebar-menu-normal.fontWeight" value={config.componentStyling?.['platform-sidebar-menu-normal']?.fontWeight} placeholder="500" />
                                            <TextInput onChange={handleChange} label="Backdrop Filter" path="componentStyling.platform-sidebar-menu-normal.backdropFilter" value={config.componentStyling?.['platform-sidebar-menu-normal']?.backdropFilter} placeholder="blur(10px)" />
                                            <TextInput onChange={handleChange} label="Box Shadow" path="componentStyling.platform-sidebar-menu-normal.boxShadow" value={config.componentStyling?.['platform-sidebar-menu-normal']?.boxShadow} placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)" />
                                            <TextInput onChange={handleChange} label="Transition" path="componentStyling.platform-sidebar-menu-normal.transition" value={config.componentStyling?.['platform-sidebar-menu-normal']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                            <BorderConfig basePath="componentStyling.platform-sidebar-menu-normal" />
                                            <AdvancedStyling basePath="componentStyling.platform-sidebar-menu-normal" />
                                        </TabsContent>
                                        <TabsContent value="hover" className="space-y-3 mt-4">
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.platform-sidebar-menu-hover.backgroundColor" value={config.componentStyling?.['platform-sidebar-menu-hover']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.platform-sidebar-menu-hover.textColor" value={config.componentStyling?.['platform-sidebar-menu-hover']?.textColor} />
                                            <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.platform-sidebar-menu-hover.borderRadius" value={config.componentStyling?.['platform-sidebar-menu-hover']?.borderRadius} placeholder="8px" />
                                            <TextInput onChange={handleChange} label="Padding" path="componentStyling.platform-sidebar-menu-hover.padding" value={config.componentStyling?.['platform-sidebar-menu-hover']?.padding} placeholder="0.5rem 0.75rem" />
                                            <TextInput onChange={handleChange} label="Font Size" path="componentStyling.platform-sidebar-menu-hover.fontSize" value={config.componentStyling?.['platform-sidebar-menu-hover']?.fontSize} placeholder="0.875rem" />
                                            <TextInput onChange={handleChange} label="Font Weight" path="componentStyling.platform-sidebar-menu-hover.fontWeight" value={config.componentStyling?.['platform-sidebar-menu-hover']?.fontWeight} placeholder="500" />
                                            <TextInput onChange={handleChange} label="Backdrop Filter" path="componentStyling.platform-sidebar-menu-hover.backdropFilter" value={config.componentStyling?.['platform-sidebar-menu-hover']?.backdropFilter} placeholder="blur(10px)" />
                                            <TextInput onChange={handleChange} label="Box Shadow" path="componentStyling.platform-sidebar-menu-hover.boxShadow" value={config.componentStyling?.['platform-sidebar-menu-hover']?.boxShadow} placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)" />
                                            <TextInput onChange={handleChange} label="Transition" path="componentStyling.platform-sidebar-menu-hover.transition" value={config.componentStyling?.['platform-sidebar-menu-hover']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                            <BorderConfig basePath="componentStyling.platform-sidebar-menu-hover" />
                                            <AdvancedStyling basePath="componentStyling.platform-sidebar-menu-hover" />
                                        </TabsContent>
                                        <TabsContent value="active" className="space-y-3 mt-4">
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.platform-sidebar-menu-active.backgroundColor" value={config.componentStyling?.['platform-sidebar-menu-active']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.platform-sidebar-menu-active.textColor" value={config.componentStyling?.['platform-sidebar-menu-active']?.textColor} />
                                            <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.platform-sidebar-menu-active.borderRadius" value={config.componentStyling?.['platform-sidebar-menu-active']?.borderRadius} placeholder="8px" />
                                            <TextInput onChange={handleChange} label="Padding" path="componentStyling.platform-sidebar-menu-active.padding" value={config.componentStyling?.['platform-sidebar-menu-active']?.padding} placeholder="0.5rem 0.75rem" />
                                            <TextInput onChange={handleChange} label="Font Size" path="componentStyling.platform-sidebar-menu-active.fontSize" value={config.componentStyling?.['platform-sidebar-menu-active']?.fontSize} placeholder="0.875rem" />
                                            <TextInput onChange={handleChange} label="Font Weight" path="componentStyling.platform-sidebar-menu-active.fontWeight" value={config.componentStyling?.['platform-sidebar-menu-active']?.fontWeight} placeholder="600" />
                                            <TextInput onChange={handleChange} label="Backdrop Filter" path="componentStyling.platform-sidebar-menu-active.backdropFilter" value={config.componentStyling?.['platform-sidebar-menu-active']?.backdropFilter} placeholder="blur(10px)" />
                                            <TextInput onChange={handleChange} label="Box Shadow" path="componentStyling.platform-sidebar-menu-active.boxShadow" value={config.componentStyling?.['platform-sidebar-menu-active']?.boxShadow} placeholder="0 1px 3px 0 rgba(0, 122, 255, 0.15)" />
                                            <TextInput onChange={handleChange} label="Transition" path="componentStyling.platform-sidebar-menu-active.transition" value={config.componentStyling?.['platform-sidebar-menu-active']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                            <BorderConfig basePath="componentStyling.platform-sidebar-menu-active" />
                                            <AdvancedStyling basePath="componentStyling.platform-sidebar-menu-active" />
                                        </TabsContent>
                                    </Tabs>
                                </div>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold">Secondary Sidebar</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="secondarySidebarBackgroundColor" value={config.secondarySidebarBackgroundColor} />
                                        <ColorInputField onChange={handleChange} label="Text" path="secondarySidebarTextColor" value={config.secondarySidebarTextColor} />
                                        <div className="p-3 bg-muted/30 rounded-lg border border-primary/20">
                                            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                <Sparkles className="h-3 w-3" />
                                                Glassmorphism Effect (Backdrop Blur)
                                            </div>
                                            <TextInput onChange={handleChange} 
                                                label="Backdrop Filter" 
                                                path="componentStyling.platform-sidebar-secondary.backdropFilter" 
                                                value={config.componentStyling?.['platform-sidebar-secondary']?.backdropFilter} 
                                                placeholder="blur(30px) saturate(200%)" 
                                                icon={<Sparkles className="h-3 w-3" />}
                                            />
                                            <div className="text-xs text-muted-foreground mt-2">
                                                Example: <code className="px-1 py-0.5 bg-muted rounded">blur(30px) saturate(200%)</code> for frosted glass effect
                                            </div>
                                        </div>
                                        <TextInput onChange={handleChange} label="Transition" path="componentStyling.platform-sidebar-secondary.transition" value={config.componentStyling?.['platform-sidebar-secondary']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Typography Tab */}
                            <TabsContent value="typography" className="space-y-8 mt-0">
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Fonts</h3>
                                    <div className="space-y-3">
                                        <TextInput onChange={handleChange} label="Font Family" path="globalStyling.fontFamily" value={config.globalStyling?.fontFamily} placeholder="-apple-system, BlinkMacSystemFont..." />
                                        <TextInput onChange={handleChange} label="Mono Font" path="globalStyling.fontFamilyMono" value={config.globalStyling?.fontFamilyMono} placeholder='"SF Mono", "Monaco"...' />
                                        <TextInput onChange={handleChange} label="Google Fonts API Key" path="googleFontsApiKey" value={config.googleFontsApiKey} placeholder="Optional: Your Google Fonts API key" />
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Borders & Radius</h3>
                                    <div className="space-y-3">
                                        <TextInput onChange={handleChange} label="Border Radius" path="globalStyling.borderRadius" value={config.globalStyling?.borderRadius} placeholder="10px" />
                                        <TextInput onChange={handleChange} label="Border Width" path="globalStyling.borderWidth" value={config.globalStyling?.borderWidth} placeholder="0.5px" />
                                        <TextInput onChange={handleChange} label="Button Radius" path="globalStyling.buttonBorderRadius" value={config.globalStyling?.buttonBorderRadius} placeholder="10px" />
                                        <TextInput onChange={handleChange} label="Button Width" path="globalStyling.buttonBorderWidth" value={config.globalStyling?.buttonBorderWidth} placeholder="0px" />
                                        <TextInput onChange={handleChange} label="Input Radius" path="globalStyling.inputBorderRadius" value={config.globalStyling?.inputBorderRadius} placeholder="8px" />
                                        <TextInput onChange={handleChange} label="Input Width" path="globalStyling.inputBorderWidth" value={config.globalStyling?.inputBorderWidth} placeholder="0.5px" />
                                        <TextInput onChange={handleChange} label="Select Radius" path="globalStyling.selectBorderRadius" value={config.globalStyling?.selectBorderRadius} placeholder="8px" />
                                        <TextInput onChange={handleChange} label="Select Width" path="globalStyling.selectBorderWidth" value={config.globalStyling?.selectBorderWidth} placeholder="0.5px" />
                                        <TextInput onChange={handleChange} label="Textarea Radius" path="globalStyling.textareaBorderRadius" value={config.globalStyling?.textareaBorderRadius} placeholder="8px" />
                                        <TextInput onChange={handleChange} label="Textarea Width" path="globalStyling.textareaBorderWidth" value={config.globalStyling?.textareaBorderWidth} placeholder="0.5px" />
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Animation & Shadows</h3>
                                    <div className="space-y-3">
                                        <TextInput onChange={handleChange} label="Transition Duration" path="globalStyling.transitionDuration" value={config.globalStyling?.transitionDuration} placeholder="200ms" />
                                        <TextInput onChange={handleChange} label="Transition Timing" path="globalStyling.transitionTiming" value={config.globalStyling?.transitionTiming} placeholder="cubic-bezier(0.4, 0, 0.2, 1)" />
                                        <TextInput onChange={handleChange} label="Shadow Small" path="globalStyling.shadowSm" value={config.globalStyling?.shadowSm} placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)" />
                                        <TextInput onChange={handleChange} label="Shadow Medium" path="globalStyling.shadowMd" value={config.globalStyling?.shadowMd} placeholder="0 4px 6px -1px rgba(0, 0, 0, 0.1)..." />
                                        <TextInput onChange={handleChange} label="Shadow Large" path="globalStyling.shadowLg" value={config.globalStyling?.shadowLg} placeholder="0 10px 15px -3px rgba(0, 0, 0, 0.1)..." />
                                        <TextInput onChange={handleChange} label="Shadow XL" path="globalStyling.shadowXl" value={config.globalStyling?.shadowXl} placeholder="0 20px 25px -5px rgba(0, 0, 0, 0.1)..." />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Branding Tab */}
                            <TabsContent value="branding" className="space-y-8 mt-0">
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Application</h3>
                                    <div className="space-y-3">
                                        <TextInput onChange={handleChange} label="App Name" path="applicationName" value={config.applicationName} placeholder="Unified Data Platform" />
                                        <div className="flex items-center gap-4">
                                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0">Logo Type</Label>
                                            <Select
                                                value={config.applicationLogoType || 'image'}
                                                onValueChange={(value) => handleChange('applicationLogoType', value)}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="image">Image</SelectItem>
                                                    <SelectItem value="icon">Icon</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {config.applicationLogoType === 'image' && (
                                            <TextInput onChange={handleChange} label="Logo URL" path="applicationLogo" value={config.applicationLogo} placeholder="https://..." />
                                        )}
                                        {config.applicationLogoType === 'icon' && (
                                            <>
                                                <TextInput onChange={handleChange} label="Icon Name" path="applicationLogoIcon" value={config.applicationLogoIcon} placeholder="Home, Settings, etc." />
                                                <ColorInputField onChange={handleChange} label="Icon Color" path="applicationLogoIconColor" value={config.applicationLogoIconColor} />
                                                <ColorInputField onChange={handleChange} label="Icon BG" path="applicationLogoBackgroundColor" value={config.applicationLogoBackgroundColor} />
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Login Background</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0">Type</Label>
                                            <Select
                                                value={config.loginBackground?.type || 'gradient'}
                                                onValueChange={(value) => handleChange('loginBackground.type', value)}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="color">Color</SelectItem>
                                                    <SelectItem value="gradient">Gradient</SelectItem>
                                                    <SelectItem value="image">Image</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {config.loginBackground?.type === 'color' && (
                                            <ColorInputField onChange={handleChange} label="Color" path="loginBackground.color" value={config.loginBackground?.color} />
                                        )}
                                        {config.loginBackground?.type === 'gradient' && (
                                            <>
                                                <ColorInputField onChange={handleChange} label="From" path="loginBackground.gradient.from" value={config.loginBackground?.gradient?.from} />
                                                <ColorInputField onChange={handleChange} label="To" path="loginBackground.gradient.to" value={config.loginBackground?.gradient?.to} />
                                                <TextInput onChange={handleChange} label="Angle" path="loginBackground.gradient.angle" value={config.loginBackground?.gradient?.angle?.toString()} placeholder="135" />
                                            </>
                                        )}
                                        {config.loginBackground?.type === 'image' && (
                                            <TextInput onChange={handleChange} label="Image URL" path="loginBackground.image" value={config.loginBackground?.image} placeholder="https://..." />
                                        )}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Drawer Overlay</h3>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Color" path="drawerOverlay.color" value={config.drawerOverlay?.color} />
                                        <TextInput onChange={handleChange} label="Opacity" path="drawerOverlay.opacity" value={config.drawerOverlay?.opacity?.toString()} placeholder="30" />
                                        <TextInput onChange={handleChange} label="Blur" path="drawerOverlay.blur" value={config.drawerOverlay?.blur?.toString()} placeholder="20" />
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Drawer Style</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0">Style Type</Label>
                                            <Select
                                                value={config.drawerStyle?.type || 'modern'}
                                                onValueChange={(value) => handleChange('drawerStyle.type', value)}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select style" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="normal">Normal (Full height, no margins)</SelectItem>
                                                    <SelectItem value="modern">Modern (Full height, margins top/bottom, right side)</SelectItem>
                                                    <SelectItem value="floating">Floating (Margins all around, modal-like)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <TextInput onChange={handleChange} label="Margin" path="drawerStyle.margin" value={config.drawerStyle?.margin} placeholder="16px" />
                                        <TextInput onChange={handleChange} label="Border Radius" path="drawerStyle.borderRadius" value={config.drawerStyle?.borderRadius} placeholder="12px" />
                                        <TextInput onChange={handleChange} label="Width" path="drawerStyle.width" value={config.drawerStyle?.width} placeholder="500px" />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Components Tab */}
                            <TabsContent value="components" className="space-y-8 mt-0">
                                {/* Text Input */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Text Input Fields</h3>
                                    <div className="space-y-3">
                                        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                                            <div className="text-xs font-medium text-muted-foreground mb-2">Base Styling</div>
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.text-input.backgroundColor" value={config.componentStyling?.['text-input']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.text-input.textColor" value={config.componentStyling?.['text-input']?.textColor} />
                                            <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.text-input.borderRadius" value={config.componentStyling?.['text-input']?.borderRadius} placeholder="8px" />
                                            <TextInput onChange={handleChange} label="Padding" path="componentStyling.text-input.padding" value={config.componentStyling?.['text-input']?.padding} placeholder="0.5rem 0.75rem" />
                                            <TextInput onChange={handleChange} label="Font Size" path="componentStyling.text-input.fontSize" value={config.componentStyling?.['text-input']?.fontSize} placeholder="0.875rem" />
                                        </div>
                                        <Separator />
                                        <div className="space-y-3">
                                            <div className="text-xs font-medium text-muted-foreground">Border (All Sides)</div>
                                            <ColorInputField onChange={handleChange} label="Color" path="componentStyling.text-input.borderColor" value={config.componentStyling?.['text-input']?.borderColor} />
                                            <TextInput onChange={handleChange} label="Width" path="componentStyling.text-input.borderWidth" value={config.componentStyling?.['text-input']?.borderWidth} placeholder="0.5px" icon={<Minus className="h-3 w-3" />} />
                                            <TextInput onChange={handleChange} label="Style" path="componentStyling.text-input.borderStyle" value={config.componentStyling?.['text-input']?.borderStyle} placeholder="solid" icon={<Minus className="h-3 w-3" />} />
                                        </div>
                                        <Separator />
                                        <div className="space-y-3">
                                            <div className="text-xs font-medium text-muted-foreground">Individual Border Sides</div>
                                            <div className="space-y-2 pl-4">
                                                <div className="text-xs font-medium text-muted-foreground/80">Top</div>
                                                <ColorInputField onChange={handleChange} label="Color" path="componentStyling.text-input.borderTopColor" value={config.componentStyling?.['text-input']?.borderTopColor} />
                                                <TextInput onChange={handleChange} label="Width" path="componentStyling.text-input.borderTopWidth" value={config.componentStyling?.['text-input']?.borderTopWidth} placeholder="0.5px" icon={<ArrowUp className="h-3 w-3" />} />
                                                <TextInput onChange={handleChange} label="Style" path="componentStyling.text-input.borderTopStyle" value={config.componentStyling?.['text-input']?.borderTopStyle} placeholder="solid" icon={<ArrowUp className="h-3 w-3" />} />
                                            </div>
                                            <div className="space-y-2 pl-4">
                                                <div className="text-xs font-medium text-muted-foreground/80">Right</div>
                                                <ColorInputField onChange={handleChange} label="Color" path="componentStyling.text-input.borderRightColor" value={config.componentStyling?.['text-input']?.borderRightColor} />
                                                <TextInput onChange={handleChange} label="Width" path="componentStyling.text-input.borderRightWidth" value={config.componentStyling?.['text-input']?.borderRightWidth} placeholder="0.5px" icon={<ArrowRight className="h-3 w-3" />} />
                                                <TextInput onChange={handleChange} label="Style" path="componentStyling.text-input.borderRightStyle" value={config.componentStyling?.['text-input']?.borderRightStyle} placeholder="solid" icon={<ArrowRight className="h-3 w-3" />} />
                                            </div>
                                            <div className="space-y-2 pl-4">
                                                <div className="text-xs font-medium text-muted-foreground/80">Bottom</div>
                                                <ColorInputField onChange={handleChange} label="Color" path="componentStyling.text-input.borderBottomColor" value={config.componentStyling?.['text-input']?.borderBottomColor} />
                                                <TextInput onChange={handleChange} label="Width" path="componentStyling.text-input.borderBottomWidth" value={config.componentStyling?.['text-input']?.borderBottomWidth} placeholder="0.5px" icon={<ArrowDown className="h-3 w-3" />} />
                                                <TextInput onChange={handleChange} label="Style" path="componentStyling.text-input.borderBottomStyle" value={config.componentStyling?.['text-input']?.borderBottomStyle} placeholder="solid" icon={<ArrowDown className="h-3 w-3" />} />
                                            </div>
                                            <div className="space-y-2 pl-4">
                                                <div className="text-xs font-medium text-muted-foreground/80">Left</div>
                                                <ColorInputField onChange={handleChange} label="Color" path="componentStyling.text-input.borderLeftColor" value={config.componentStyling?.['text-input']?.borderLeftColor} />
                                                <TextInput onChange={handleChange} label="Width" path="componentStyling.text-input.borderLeftWidth" value={config.componentStyling?.['text-input']?.borderLeftWidth} placeholder="0.5px" icon={<ArrowLeft className="h-3 w-3" />} />
                                                <TextInput onChange={handleChange} label="Style" path="componentStyling.text-input.borderLeftStyle" value={config.componentStyling?.['text-input']?.borderLeftStyle} placeholder="solid" icon={<ArrowLeft className="h-3 w-3" />} />
                                            </div>
                                        </div>
                                        <TextInput onChange={handleChange} label="Padding" path="componentStyling.text-input.padding" value={config.componentStyling?.['text-input']?.padding} placeholder="0.5rem 0.75rem" />
                                        <TextInput onChange={handleChange} label="Font Size" path="componentStyling.text-input.fontSize" value={config.componentStyling?.['text-input']?.fontSize} placeholder="0.875rem" />
                                        <TextInput onChange={handleChange} label="Transition" path="componentStyling.text-input.transition" value={config.componentStyling?.['text-input']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                        <AdvancedStyling basePath="componentStyling.text-input" />
                                        <ComponentStates basePath="componentStyling.text-input" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Select */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Select Dropdowns</h3>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.select.backgroundColor" value={config.componentStyling?.select?.backgroundColor} />
                                        <ColorInputField onChange={handleChange} label="Text" path="componentStyling.select.textColor" value={config.componentStyling?.select?.textColor} />
                                        <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.select.borderRadius" value={config.componentStyling?.select?.borderRadius} placeholder="8px" />
                                        <BorderConfig basePath="componentStyling.select" />
                                        <TextInput onChange={handleChange} label="Padding" path="componentStyling.select.padding" value={config.componentStyling?.select?.padding} placeholder="0.5rem 0.75rem" />
                                        <TextInput onChange={handleChange} label="Font Size" path="componentStyling.select.fontSize" value={config.componentStyling?.select?.fontSize} placeholder="0.875rem" />
                                        <TextInput onChange={handleChange} label="Transition" path="componentStyling.select.transition" value={config.componentStyling?.select?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                        <AdvancedStyling basePath="componentStyling.select" />
                                        <ComponentStates basePath="componentStyling.select" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Multi-Select */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Multi-Select Dropdowns</h3>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.multi-select.backgroundColor" value={config.componentStyling?.['multi-select']?.backgroundColor} />
                                        <ColorInputField onChange={handleChange} label="Text" path="componentStyling.multi-select.textColor" value={config.componentStyling?.['multi-select']?.textColor} />
                                        <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.multi-select.borderRadius" value={config.componentStyling?.['multi-select']?.borderRadius} placeholder="8px" />
                                        <BorderConfig basePath="componentStyling.multi-select" />
                                        <TextInput onChange={handleChange} label="Padding" path="componentStyling.multi-select.padding" value={config.componentStyling?.['multi-select']?.padding} placeholder="0.5rem 0.75rem" />
                                        <TextInput onChange={handleChange} label="Font Size" path="componentStyling.multi-select.fontSize" value={config.componentStyling?.['multi-select']?.fontSize} placeholder="0.875rem" />
                                        <TextInput onChange={handleChange} label="Transition" path="componentStyling.multi-select.transition" value={config.componentStyling?.['multi-select']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                        <AdvancedStyling basePath="componentStyling.multi-select" />
                                        <ComponentStates basePath="componentStyling.multi-select" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Textarea */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Textarea Fields</h3>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.textarea.backgroundColor" value={config.componentStyling?.textarea?.backgroundColor} />
                                        <ColorInputField onChange={handleChange} label="Text" path="componentStyling.textarea.textColor" value={config.componentStyling?.textarea?.textColor} />
                                        <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.textarea.borderRadius" value={config.componentStyling?.textarea?.borderRadius} placeholder="8px" />
                                        <BorderConfig basePath="componentStyling.textarea" />
                                        <TextInput onChange={handleChange} label="Padding" path="componentStyling.textarea.padding" value={config.componentStyling?.textarea?.padding} placeholder="0.5rem 0.75rem" />
                                        <TextInput onChange={handleChange} label="Font Size" path="componentStyling.textarea.fontSize" value={config.componentStyling?.textarea?.fontSize} placeholder="0.875rem" />
                                        <TextInput onChange={handleChange} label="Line Height" path="componentStyling.textarea.lineHeight" value={config.componentStyling?.textarea?.lineHeight} placeholder="1.5" />
                                        <TextInput onChange={handleChange} label="Transition" path="componentStyling.textarea.transition" value={config.componentStyling?.textarea?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                        <AdvancedStyling basePath="componentStyling.textarea" />
                                        <ComponentStates basePath="componentStyling.textarea" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Form */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Forms</h3>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.form.backgroundColor" value={config.componentStyling?.form?.backgroundColor} />
                                        <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.form.borderRadius" value={config.componentStyling?.form?.borderRadius} placeholder="8px" />
                                        <BorderConfig basePath="componentStyling.form" />
                                        <TextInput onChange={handleChange} label="Padding" path="componentStyling.form.padding" value={config.componentStyling?.form?.padding} placeholder="1rem" />
                                        <TextInput onChange={handleChange} label="Margin" path="componentStyling.form.margin" value={config.componentStyling?.form?.margin} placeholder="0" />
                                        <AdvancedStyling basePath="componentStyling.form" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Button */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Buttons</h3>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.button.backgroundColor" value={config.componentStyling?.button?.backgroundColor} />
                                        <ColorInputField onChange={handleChange} label="Text" path="componentStyling.button.textColor" value={config.componentStyling?.button?.textColor} />
                                        <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.button.borderRadius" value={config.componentStyling?.button?.borderRadius} placeholder="10px" />
                                        <TextInput onChange={handleChange} label="Padding" path="componentStyling.button.padding" value={config.componentStyling?.button?.padding} placeholder="0.5rem 1rem" />
                                        <TextInput onChange={handleChange} label="Font Size" path="componentStyling.button.fontSize" value={config.componentStyling?.button?.fontSize} placeholder="0.875rem" />
                                        <TextInput onChange={handleChange} label="Font Weight" path="componentStyling.button.fontWeight" value={config.componentStyling?.button?.fontWeight} placeholder="500" />
                                        <BorderConfig basePath="componentStyling.button" />
                                        <TextInput onChange={handleChange} label="Transition" path="componentStyling.button.transition" value={config.componentStyling?.button?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                        <TextInput onChange={handleChange} label="Shadow" path="componentStyling.button.boxShadow" value={config.componentStyling?.button?.boxShadow} placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)" />
                                        <AdvancedStyling basePath="componentStyling.button" />
                                        <ComponentStates basePath="componentStyling.button" />
                                    </div>
                                    <Separator className="my-4" />
                                    <div className="space-y-4">
                                        <div className="text-xs font-semibold text-muted-foreground">Button Variants</div>
                                        
                                        {/* Default Variant */}
                                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                                            <div className="text-xs font-medium text-muted-foreground/80">Default</div>
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.button-default.backgroundColor" value={config.componentStyling?.['button-default']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.button-default.textColor" value={config.componentStyling?.['button-default']?.textColor} />
                                            <BorderConfig basePath="componentStyling.button-default" />
                                        </div>
                                        
                                        {/* Destructive Variant */}
                                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                                            <div className="text-xs font-medium text-muted-foreground/80">Destructive</div>
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.button-destructive.backgroundColor" value={config.componentStyling?.['button-destructive']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.button-destructive.textColor" value={config.componentStyling?.['button-destructive']?.textColor} />
                                            <BorderConfig basePath="componentStyling.button-destructive" />
                                        </div>
                                        
                                        {/* Outline Variant */}
                                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                                            <div className="text-xs font-medium text-muted-foreground/80">Outline</div>
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.button-outline.backgroundColor" value={config.componentStyling?.['button-outline']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.button-outline.textColor" value={config.componentStyling?.['button-outline']?.textColor} />
                                            <BorderConfig basePath="componentStyling.button-outline" />
                                        </div>
                                        
                                        {/* Secondary Variant */}
                                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                                            <div className="text-xs font-medium text-muted-foreground/80">Secondary</div>
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.button-secondary.backgroundColor" value={config.componentStyling?.['button-secondary']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.button-secondary.textColor" value={config.componentStyling?.['button-secondary']?.textColor} />
                                            <BorderConfig basePath="componentStyling.button-secondary" />
                                        </div>
                                        
                                        {/* Ghost Variant */}
                                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                                            <div className="text-xs font-medium text-muted-foreground/80">Ghost</div>
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.button-ghost.backgroundColor" value={config.componentStyling?.['button-ghost']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.button-ghost.textColor" value={config.componentStyling?.['button-ghost']?.textColor} />
                                            <BorderConfig basePath="componentStyling.button-ghost" />
                                        </div>
                                        
                                        {/* Link Variant */}
                                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                                            <div className="text-xs font-medium text-muted-foreground/80">Link</div>
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.button-link.textColor" value={config.componentStyling?.['button-link']?.textColor} />
                                            <TextInput onChange={handleChange} label="Text Decoration" path="componentStyling.button-link.textDecoration" value={config.componentStyling?.['button-link']?.textDecoration} placeholder="underline" />
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                {/* Icon Button */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Icon Buttons</h3>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.iconButton.backgroundColor" value={config.componentStyling?.iconButton?.backgroundColor} />
                                        <ColorInputField onChange={handleChange} label="Text" path="componentStyling.iconButton.textColor" value={config.componentStyling?.iconButton?.textColor} />
                                        <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.iconButton.borderRadius" value={config.componentStyling?.iconButton?.borderRadius} placeholder="8px" />
                                        <TextInput onChange={handleChange} label="Padding" path="componentStyling.iconButton.padding" value={config.componentStyling?.iconButton?.padding} placeholder="0.5rem" />
                                        <TextInput onChange={handleChange} label="Font Size" path="componentStyling.iconButton.fontSize" value={config.componentStyling?.iconButton?.fontSize} placeholder="1rem" />
                                        <TextInput onChange={handleChange} label="Font Weight" path="componentStyling.iconButton.fontWeight" value={config.componentStyling?.iconButton?.fontWeight} placeholder="400" />
                                        <BorderConfig basePath="componentStyling.iconButton" />
                                        <TextInput onChange={handleChange} label="Transition" path="componentStyling.iconButton.transition" value={config.componentStyling?.iconButton?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                        <TextInput onChange={handleChange} label="Shadow" path="componentStyling.iconButton.boxShadow" value={config.componentStyling?.iconButton?.boxShadow} placeholder="none" />
                                        <AdvancedStyling basePath="componentStyling.iconButton" />
                                        <ComponentStates basePath="componentStyling.iconButton" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Card */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold">Cards</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.card.backgroundColor" value={config.componentStyling?.card?.backgroundColor} />
                                        <div className="p-3 bg-muted/30 rounded-lg border border-primary/20">
                                            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                <Sparkles className="h-3 w-3" />
                                                Glassmorphism Effect (Backdrop Blur)
                                            </div>
                                            <TextInput onChange={handleChange} 
                                                label="Backdrop Filter" 
                                                path="componentStyling.card.backdropFilter" 
                                                value={config.componentStyling?.card?.backdropFilter} 
                                                placeholder="blur(20px) saturate(180%)" 
                                                icon={<Sparkles className="h-3 w-3" />}
                                            />
                                            <div className="text-xs text-muted-foreground mt-2">
                                                Example: <code className="px-1 py-0.5 bg-muted rounded">blur(20px) saturate(180%)</code> for frosted glass effect
                                            </div>
                                        </div>
                                        <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.card.borderRadius" value={config.componentStyling?.card?.borderRadius} placeholder="12px" />
                                        <BorderConfig basePath="componentStyling.card" />
                                        <TextInput onChange={handleChange} label="Shadow" path="componentStyling.card.boxShadow" value={config.componentStyling?.card?.boxShadow} placeholder="0 4px 6px -1px rgba(0, 0, 0, 0.1)..." />
                                        <AdvancedStyling basePath="componentStyling.card" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Checkbox */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Checkboxes</h3>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.checkbox.backgroundColor" value={config.componentStyling?.checkbox?.backgroundColor} />
                                        <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.checkbox.borderRadius" value={config.componentStyling?.checkbox?.borderRadius} placeholder="4px" />
                                        <BorderConfig basePath="componentStyling.checkbox" />
                                        <AdvancedStyling basePath="componentStyling.checkbox" />
                                        <ComponentStates basePath="componentStyling.checkbox" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Radio */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Radio Buttons</h3>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.radio.backgroundColor" value={config.componentStyling?.radio?.backgroundColor} />
                                        <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.radio.borderRadius" value={config.componentStyling?.radio?.borderRadius} placeholder="50%" />
                                        <BorderConfig basePath="componentStyling.radio" />
                                        <AdvancedStyling basePath="componentStyling.radio" />
                                        <ComponentStates basePath="componentStyling.radio" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Switch */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Switches</h3>
                                    <div className="space-y-3">
                                        <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.switch.borderRadius" value={config.componentStyling?.switch?.borderRadius} placeholder="9999px" />
                                        <BorderConfig basePath="componentStyling.switch" />
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.switch.backgroundColor" value={config.componentStyling?.switch?.backgroundColor} />
                                        <AdvancedStyling basePath="componentStyling.switch" />
                                        <ComponentStates basePath="componentStyling.switch" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Separator/Divider Lines */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Separator/Divider Lines</h3>
                                    <div className="space-y-3">
                                        <ColorInputField onChange={handleChange} label="Background" path="componentStyling.separator.backgroundColor" value={config.componentStyling?.separator?.backgroundColor} />
                                        <TextInput onChange={handleChange} label="Height" path="componentStyling.separator.height" value={config.componentStyling?.separator?.height} placeholder="1px" />
                                        <TextInput onChange={handleChange} label="Width" path="componentStyling.separator.width" value={config.componentStyling?.separator?.width} placeholder="100%" />
                                        <TextInput onChange={handleChange} label="Margin Top" path="componentStyling.separator.marginTop" value={(config.componentStyling?.separator as any)?.marginTop} placeholder="1rem" />
                                        <TextInput onChange={handleChange} label="Margin Bottom" path="componentStyling.separator.marginBottom" value={(config.componentStyling?.separator as any)?.marginBottom} placeholder="1rem" />
                                        <BorderConfig basePath="componentStyling.separator" />
                                        <AdvancedStyling basePath="componentStyling.separator" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Vertical Tab Menu (Secondary Sidebar) */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Vertical Tab Menu (Secondary Sidebar)</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-medium mb-2 text-muted-foreground">Normal State</h4>
                                            <div className="space-y-2 pl-4">
                                                <ColorInputField onChange={handleChange} label="Background" path="componentStyling.vertical-tab-menu-normal.backgroundColor" value={config.componentStyling?.['vertical-tab-menu-normal']?.backgroundColor} />
                                                <ColorInputField onChange={handleChange} label="Text" path="componentStyling.vertical-tab-menu-normal.textColor" value={config.componentStyling?.['vertical-tab-menu-normal']?.textColor} />
                                                <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.vertical-tab-menu-normal.borderRadius" value={config.componentStyling?.['vertical-tab-menu-normal']?.borderRadius} placeholder="8px" />
                                                <BorderConfig basePath="componentStyling.vertical-tab-menu-normal" />
                                                <TextInput onChange={handleChange} label="Padding" path="componentStyling.vertical-tab-menu-normal.padding" value={config.componentStyling?.['vertical-tab-menu-normal']?.padding} placeholder="0.5rem 0.75rem" />
                                                <TextInput onChange={handleChange} label="Font Size" path="componentStyling.vertical-tab-menu-normal.fontSize" value={config.componentStyling?.['vertical-tab-menu-normal']?.fontSize} placeholder="0.875rem" />
                                                <TextInput onChange={handleChange} label="Font Weight" path="componentStyling.vertical-tab-menu-normal.fontWeight" value={config.componentStyling?.['vertical-tab-menu-normal']?.fontWeight} placeholder="500" />
                                                <TextInput onChange={handleChange} label="Transition" path="componentStyling.vertical-tab-menu-normal.transition" value={config.componentStyling?.['vertical-tab-menu-normal']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                                <AdvancedStyling basePath="componentStyling.vertical-tab-menu-normal" />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-medium mb-2 text-muted-foreground">Hover State</h4>
                                            <div className="space-y-2 pl-4">
                                                <ColorInputField onChange={handleChange} label="Background" path="componentStyling.vertical-tab-menu-hover.backgroundColor" value={config.componentStyling?.['vertical-tab-menu-hover']?.backgroundColor} />
                                                <ColorInputField onChange={handleChange} label="Text" path="componentStyling.vertical-tab-menu-hover.textColor" value={config.componentStyling?.['vertical-tab-menu-hover']?.textColor} />
                                                <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.vertical-tab-menu-hover.borderRadius" value={config.componentStyling?.['vertical-tab-menu-hover']?.borderRadius} placeholder="8px" />
                                                <BorderConfig basePath="componentStyling.vertical-tab-menu-hover" />
                                                <TextInput onChange={handleChange} label="Box Shadow" path="componentStyling.vertical-tab-menu-hover.boxShadow" value={config.componentStyling?.['vertical-tab-menu-hover']?.boxShadow} placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)" />
                                                <TextInput onChange={handleChange} label="Transition" path="componentStyling.vertical-tab-menu-hover.transition" value={config.componentStyling?.['vertical-tab-menu-hover']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                                <AdvancedStyling basePath="componentStyling.vertical-tab-menu-hover" />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-medium mb-2 text-muted-foreground">Active State</h4>
                                            <div className="space-y-2 pl-4">
                                                <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                                                    <div className="text-xs font-medium text-muted-foreground mb-2">Active Menu Background</div>
                                                    <ColorInputField onChange={handleChange} label="Background" path="componentStyling.vertical-tab-menu-active.backgroundColor" value={config.componentStyling?.['vertical-tab-menu-active']?.backgroundColor} />
                                                    <ColorInputField onChange={handleChange} label="Text" path="componentStyling.vertical-tab-menu-active.textColor" value={config.componentStyling?.['vertical-tab-menu-active']?.textColor} />
                                                    <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.vertical-tab-menu-active.borderRadius" value={config.componentStyling?.['vertical-tab-menu-active']?.borderRadius} placeholder="8px" />
                                                    <TextInput onChange={handleChange} label="Padding" path="componentStyling.vertical-tab-menu-active.padding" value={config.componentStyling?.['vertical-tab-menu-active']?.padding} placeholder="0.5rem 0.75rem" />
                                                    <TextInput onChange={handleChange} label="Font Size" path="componentStyling.vertical-tab-menu-active.fontSize" value={config.componentStyling?.['vertical-tab-menu-active']?.fontSize} placeholder="0.875rem" />
                                                    <TextInput onChange={handleChange} label="Font Weight" path="componentStyling.vertical-tab-menu-active.fontWeight" value={config.componentStyling?.['vertical-tab-menu-active']?.fontWeight} placeholder="600" />
                                                </div>
                                                <BorderConfig basePath="componentStyling.vertical-tab-menu-active" />
                                                <TextInput onChange={handleChange} label="Box Shadow" path="componentStyling.vertical-tab-menu-active.boxShadow" value={config.componentStyling?.['vertical-tab-menu-active']?.boxShadow} placeholder="0 1px 3px 0 rgba(0, 122, 255, 0.15)" />
                                                <TextInput onChange={handleChange} label="Backdrop Filter" path="componentStyling.vertical-tab-menu-active.backdropFilter" value={config.componentStyling?.['vertical-tab-menu-active']?.backdropFilter} placeholder="blur(10px)" />
                                                <TextInput onChange={handleChange} label="Transition" path="componentStyling.vertical-tab-menu-active.transition" value={config.componentStyling?.['vertical-tab-menu-active']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                                <AdvancedStyling basePath="componentStyling.vertical-tab-menu-active" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                {/* Space Settings Menu */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-4">Space Settings Menu</h3>
                                    <Tabs defaultValue="normal" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="normal">Normal</TabsTrigger>
                                            <TabsTrigger value="hover">Hover</TabsTrigger>
                                            <TabsTrigger value="active">Active</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="normal" className="space-y-3 mt-4">
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.space-settings-menu-normal.backgroundColor" value={config.componentStyling?.['space-settings-menu-normal']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.space-settings-menu-normal.textColor" value={config.componentStyling?.['space-settings-menu-normal']?.textColor} />
                                            <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.space-settings-menu-normal.borderRadius" value={config.componentStyling?.['space-settings-menu-normal']?.borderRadius} placeholder="6px" />
                                            <TextInput onChange={handleChange} label="Padding" path="componentStyling.space-settings-menu-normal.padding" value={config.componentStyling?.['space-settings-menu-normal']?.padding} placeholder="0.375rem 0.5rem" />
                                            <TextInput onChange={handleChange} label="Font Size" path="componentStyling.space-settings-menu-normal.fontSize" value={config.componentStyling?.['space-settings-menu-normal']?.fontSize} placeholder="0.875rem" />
                                            <TextInput onChange={handleChange} label="Font Weight" path="componentStyling.space-settings-menu-normal.fontWeight" value={config.componentStyling?.['space-settings-menu-normal']?.fontWeight} placeholder="400" />
                                            <TextInput onChange={handleChange} label="Transition" path="componentStyling.space-settings-menu-normal.transition" value={config.componentStyling?.['space-settings-menu-normal']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                            <BorderConfig basePath="componentStyling.space-settings-menu-normal" />
                                            <AdvancedStyling basePath="componentStyling.space-settings-menu-normal" />
                                        </TabsContent>
                                        <TabsContent value="hover" className="space-y-3 mt-4">
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.space-settings-menu-hover.backgroundColor" value={config.componentStyling?.['space-settings-menu-hover']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.space-settings-menu-hover.textColor" value={config.componentStyling?.['space-settings-menu-hover']?.textColor} />
                                            <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.space-settings-menu-hover.borderRadius" value={config.componentStyling?.['space-settings-menu-hover']?.borderRadius} placeholder="6px" />
                                            <TextInput onChange={handleChange} label="Padding" path="componentStyling.space-settings-menu-hover.padding" value={config.componentStyling?.['space-settings-menu-hover']?.padding} placeholder="0.375rem 0.5rem" />
                                            <TextInput onChange={handleChange} label="Font Size" path="componentStyling.space-settings-menu-hover.fontSize" value={config.componentStyling?.['space-settings-menu-hover']?.fontSize} placeholder="0.875rem" />
                                            <TextInput onChange={handleChange} label="Font Weight" path="componentStyling.space-settings-menu-hover.fontWeight" value={config.componentStyling?.['space-settings-menu-hover']?.fontWeight} placeholder="400" />
                                            <TextInput onChange={handleChange} label="Transition" path="componentStyling.space-settings-menu-hover.transition" value={config.componentStyling?.['space-settings-menu-hover']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                            <BorderConfig basePath="componentStyling.space-settings-menu-hover" />
                                            <AdvancedStyling basePath="componentStyling.space-settings-menu-hover" />
                                        </TabsContent>
                                        <TabsContent value="active" className="space-y-3 mt-4">
                                            <ColorInputField onChange={handleChange} label="Background" path="componentStyling.space-settings-menu-active.backgroundColor" value={config.componentStyling?.['space-settings-menu-active']?.backgroundColor} />
                                            <ColorInputField onChange={handleChange} label="Text" path="componentStyling.space-settings-menu-active.textColor" value={config.componentStyling?.['space-settings-menu-active']?.textColor} />
                                            <TextInput onChange={handleChange} label="Border Radius" path="componentStyling.space-settings-menu-active.borderRadius" value={config.componentStyling?.['space-settings-menu-active']?.borderRadius} placeholder="6px" />
                                            <TextInput onChange={handleChange} label="Padding" path="componentStyling.space-settings-menu-active.padding" value={config.componentStyling?.['space-settings-menu-active']?.padding} placeholder="0.375rem 0.5rem" />
                                            <TextInput onChange={handleChange} label="Font Size" path="componentStyling.space-settings-menu-active.fontSize" value={config.componentStyling?.['space-settings-menu-active']?.fontSize} placeholder="0.875rem" />
                                            <TextInput onChange={handleChange} label="Font Weight" path="componentStyling.space-settings-menu-active.fontWeight" value={config.componentStyling?.['space-settings-menu-active']?.fontWeight} placeholder="600" />
                                            <TextInput onChange={handleChange} label="Box Shadow" path="componentStyling.space-settings-menu-active.boxShadow" value={config.componentStyling?.['space-settings-menu-active']?.boxShadow} placeholder="0 1px 2px 0 rgba(0, 122, 255, 0.15)" />
                                            <TextInput onChange={handleChange} label="Transition" path="componentStyling.space-settings-menu-active.transition" value={config.componentStyling?.['space-settings-menu-active']?.transition} placeholder="all 200ms cubic-bezier(0.4, 0, 0.2, 1)" />
                                            <BorderConfig basePath="componentStyling.space-settings-menu-active" />
                                            <AdvancedStyling basePath="componentStyling.space-settings-menu-active" />
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </div>
            </div>

            {/* Floating Live Preview Button */}
            {!isPreviewOpen && (
                <Button
                    onClick={() => setIsPreviewOpen(true)}
                    className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
                    size="icon"
                >
                    <Eye className="h-5 w-5" />
                </Button>
            )}

            {/* Floating Live Preview Panel */}
            {isPreviewOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col overflow-hidden border rounded-lg shadow-2xl bg-background">
                    <div className="pb-4 px-6 pt-6 border-b flex flex-row items-center justify-between bg-muted/30">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-foreground">Live Preview ({theme.themeMode})</h3>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setIsPreviewOpen(false)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-auto flex items-center justify-center"
                    style={{
                        backgroundColor: theme.themeMode === 'dark' ? '#1a1a1a' : '#f4f4f5' // Basic background for contrast
                    }}
                >
                    <div className="w-full max-w-xs space-y-4">
                        {/* Mock UI Card */}
                        <div
                            className="rounded-lg border p-4 shadow-sm"
                            style={{
                                backgroundColor: config.uiBackgroundColor,
                                borderColor: config.uiBorderColor,
                                borderRadius: config.globalStyling?.borderRadius,
                                fontFamily: config.globalStyling?.fontFamily,
                            }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{
                                        backgroundColor: config.primaryColor + '20',
                                        color: config.primaryColor
                                    }}
                                >
                                    <Paintbrush className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm" style={{ color: config.primaryColor }}>
                                        {config.applicationName || 'App Name'}
                                    </h4>
                                    <p className="text-xs" style={{ color: config.secondaryColor }}>
                                        Preview Component
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="h-2 w-3/4 rounded" style={{ backgroundColor: config.uiBorderColor }} />
                                <div className="h-2 w-1/2 rounded" style={{ backgroundColor: config.uiBorderColor }} />
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    className="px-3 py-1.5 text-xs font-medium text-white rounded transition-opacity hover:opacity-90"
                                    style={{
                                        backgroundColor: config.primaryColor,
                                        borderRadius: config.globalStyling?.buttonBorderRadius
                                    }}
                                >
                                    Primary
                                </button>
                                <button
                                    className="px-3 py-1.5 text-xs font-medium border rounded transition-colors"
                                    style={{
                                        borderColor: config.uiBorderColor,
                                        color: config.secondaryColor,
                                        borderRadius: config.globalStyling?.buttonBorderRadius
                                    }}
                                >
                                    Secondary
                                </button>
                            </div>
                        </div>

                        {/* Mock Sidebar Item */}
                        <div
                            className="rounded-md p-3 flex items-center gap-3"
                            style={{
                                backgroundColor: config.platformSidebarBackgroundColor,
                                color: config.platformSidebarTextColor,
                                borderRadius: config.globalStyling?.borderRadius
                            }}
                        >
                            <Layout className="w-4 h-4" />
                            <span className="text-sm font-medium">Sidebar Item</span>
                        </div>

                        {/* Mock Input Field */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium" style={{ color: config.secondaryColor }}>
                                Input Label
                            </label>
                            <div
                                className="h-9 w-full rounded border px-3 py-1 text-sm shadow-sm transition-colors"
                                style={{
                                    backgroundColor: config.componentStyling?.['text-input']?.backgroundColor || config.uiBackgroundColor,
                                    borderColor: config.componentStyling?.['text-input']?.borderColor || config.uiBorderColor,
                                    borderRadius: config.globalStyling?.inputBorderRadius,
                                    color: config.secondaryColor
                                }}
                            >
                                <span className="opacity-50">Placeholder text...</span>
                            </div>
                        </div>

                        {/* Mock Alert/Badge */}
                        <div
                            className="rounded-md p-3 text-xs font-medium flex items-center gap-2"
                            style={{
                                backgroundColor: config.warningColor + '20',
                                color: config.warningColor,
                                borderRadius: config.globalStyling?.borderRadius,
                                border: `1px solid ${config.warningColor}40`
                            }}
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.warningColor }} />
                            Warning State
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    )
}

