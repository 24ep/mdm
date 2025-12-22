"use client"

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import * as Icons from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Chatbot } from '../types'

interface PWATabProps {
    formData: Partial<Chatbot>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function PWATab({
    formData,
    setFormData,
}: PWATabProps) {
    return (
        <div className="w-full pt-4">
            {/* Enable/Disable PWA Toggle */}
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icons.Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-0.5">
                            <Label htmlFor="pwa-enabled" className="text-base font-medium">Enable PWA Install Banner</Label>
                            <p className="text-xs text-muted-foreground">
                                Show an install prompt inside the chat widget for users to install the chat as a standalone app
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="pwa-enabled"
                        checked={formData.pwaEnabled || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, pwaEnabled: checked })}
                    />
                </div>
            </div>

            {formData.pwaEnabled && (
                <Tabs defaultValue="general" className="flex w-full gap-6">
                    <TabsList orientation="vertical" className="bg-muted/30 p-1 min-h-[400px] h-fit flex-col justify-start items-stretch gap-1 w-[220px] rounded-lg">
                        <TabsTrigger value="general" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
                            <Icons.Settings className="h-4 w-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="metadata" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
                            <Icons.FileText className="h-4 w-4" />
                            App Metadata
                        </TabsTrigger>
                        <TabsTrigger value="banner-styling" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
                            <Icons.Palette className="h-4 w-4" />
                            Banner Styling
                        </TabsTrigger>
                        <TabsTrigger value="button-styling" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
                            <Icons.MousePointer className="h-4 w-4" />
                            Button Styling
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 w-full max-w-[800px]">
                        {/* General Section */}
                        <TabsContent value="general" className="m-0 mt-0">
                            <div className="space-y-4 border rounded-lg p-4">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <Icons.Settings className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-base font-medium">General Settings</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label>Banner Text</Label>
                                    <Input
                                        placeholder="Install app for quick access"
                                        value={formData.pwaBannerText || ''}
                                        onChange={(e) => setFormData({ ...formData, pwaBannerText: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Banner Position</Label>
                                    <Select
                                        value={formData.pwaBannerPosition || 'bottom'}
                                        onValueChange={(v) => setFormData({ ...formData, pwaBannerPosition: v as 'top' | 'bottom' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bottom">Above Input (Floating)</SelectItem>
                                            <SelectItem value="top">Top of Chat Window</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Display Mode</Label>
                                    <Select
                                        value={formData.pwaDisplayMode || 'standalone'}
                                        onValueChange={(v) => setFormData({ ...formData, pwaDisplayMode: v as 'standalone' | 'fullscreen' | 'minimal-ui' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standalone">Standalone (App-like)</SelectItem>
                                            <SelectItem value="fullscreen">Fullscreen</SelectItem>
                                            <SelectItem value="minimal-ui">Minimal UI (with back button)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        {/* App Metadata Section */}
                        <TabsContent value="metadata" className="m-0 mt-0">
                            <div className="space-y-4 border rounded-lg p-4">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <Icons.FileText className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-base font-medium">App Metadata</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>App Name</Label>
                                        <Input
                                            placeholder={formData.name || 'Chat Assistant'}
                                            value={formData.pwaAppName || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaAppName: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">Name shown in app drawer</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Short Name</Label>
                                        <Input
                                            placeholder={formData.name?.split(' ')[0] || 'Chat'}
                                            value={formData.pwaShortName || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaShortName: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">Name on home screen</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>App Description</Label>
                                    <Input
                                        placeholder={formData.description || 'AI Chat Assistant'}
                                        value={formData.pwaDescription || ''}
                                        onChange={(e) => setFormData({ ...formData, pwaDescription: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Theme Color</Label>
                                        <ColorInput
                                            value={formData.pwaThemeColor || formData.primaryColor || '#3b82f6'}
                                            onChange={(color) => setFormData({ ...formData, pwaThemeColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#3b82f6"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                        <p className="text-xs text-muted-foreground">Status bar color</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Background Color</Label>
                                        <ColorInput
                                            value={formData.pwaBackgroundColor || '#ffffff'}
                                            onChange={(color) => setFormData({ ...formData, pwaBackgroundColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#ffffff"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                        <p className="text-xs text-muted-foreground">Splash screen background</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>App Icon</Label>
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (!file) return
                                                    const reader = new FileReader()
                                                    reader.onload = (ev) => {
                                                        setFormData({ ...formData, pwaIconUrl: ev.target?.result as string })
                                                    }
                                                    reader.readAsDataURL(file)
                                                }}
                                            />
                                            <Input
                                                type="text"
                                                placeholder="Or paste URL..."
                                                value={formData.pwaIconUrl || ''}
                                                onChange={(e) => setFormData({ ...formData, pwaIconUrl: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">512x512 PNG recommended</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Icon Size (px)</Label>
                                        <Input
                                            type="number"
                                            placeholder="512"
                                            value={formData.pwaIconSize || 512}
                                            onChange={(e) => setFormData({ ...formData, pwaIconSize: parseInt(e.target.value) || 512 })}
                                        />
                                        <p className="text-xs text-muted-foreground">Size in pixels (default: 512)</p>
                                    </div>
                                </div>

                                {formData.pwaIconUrl && (
                                    <div className="mt-2">
                                        <Label className="text-xs text-muted-foreground mb-1 block">Preview</Label>
                                        <div className="border rounded-lg p-2 inline-block bg-muted/50">
                                            <img
                                                src={formData.pwaIconUrl}
                                                alt="App Icon"
                                                className="object-contain"
                                                style={{
                                                    width: '128px',
                                                    height: '128px'
                                                }}
                                            />
                                            <p className="text-xs text-center mt-1 text-muted-foreground">
                                                Actual size: {formData.pwaIconSize || 512}px
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Banner Styling Section */}
                        <TabsContent value="banner-styling" className="m-0 mt-0">
                            <div className="space-y-4 border rounded-lg p-4">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <Icons.Palette className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-base font-medium">Banner Styling</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Banner Background</Label>
                                        <ColorInput
                                            value={formData.pwaBannerBgColor || formData.primaryColor || '#3b82f6'}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerBgColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder={formData.primaryColor || '#3b82f6'}
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Text Color</Label>
                                        <ColorInput
                                            value={formData.pwaBannerFontColor || '#ffffff'}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerFontColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#ffffff"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Font Family</Label>
                                        <Input
                                            placeholder="Inter, sans-serif"
                                            value={formData.pwaBannerFontFamily || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerFontFamily: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Font Size</Label>
                                        <Input
                                            placeholder="13px"
                                            value={formData.pwaBannerFontSize || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerFontSize: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Border Radius</Label>
                                        <Input
                                            placeholder="8px"
                                            value={formData.pwaBannerBorderRadius || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerBorderRadius: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Padding</Label>
                                        <Input
                                            placeholder="10px 12px"
                                            value={formData.pwaBannerPadding || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerPadding: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Shadow</Label>
                                    <Input
                                        placeholder="0 -2px 10px rgba(0,0,0,0.1)"
                                        value={formData.pwaBannerShadow || ''}
                                        onChange={(e) => setFormData({ ...formData, pwaBannerShadow: e.target.value })}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Button Styling Section */}
                        <TabsContent value="button-styling" className="m-0 mt-0">
                            <div className="space-y-4 border rounded-lg p-4">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <Icons.MousePointer className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-base font-medium">Install Button Styling</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Button Background</Label>
                                        <ColorInput
                                            value={formData.pwaBannerButtonBgColor || '#ffffff'}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerButtonBgColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder="#ffffff"
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Button Text Color</Label>
                                        <ColorInput
                                            value={formData.pwaBannerButtonTextColor || formData.primaryColor || '#3b82f6'}
                                            onChange={(color) => setFormData({ ...formData, pwaBannerButtonTextColor: color })}
                                            allowImageVideo={false}
                                            className="relative"
                                            placeholder={formData.primaryColor || '#3b82f6'}
                                            inputClassName="h-10 text-xs pl-9 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Button Border Radius</Label>
                                        <Input
                                            placeholder="4px"
                                            value={formData.pwaBannerButtonBorderRadius || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerButtonBorderRadius: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Button Font Size</Label>
                                        <Input
                                            placeholder="12px"
                                            value={formData.pwaBannerButtonFontSize || ''}
                                            onChange={(e) => setFormData({ ...formData, pwaBannerButtonFontSize: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            )}
        </div>
    )
}
