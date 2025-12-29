'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { PwaIconInput } from './PwaIconInput'
import { ScreenshotsInput } from './ScreenshotsInput'
import { PwaBannerEditor } from './PwaBannerEditor'
import { Loader2, Save, Rocket, Globe, Smartphone, Palette, FileText, LayoutTemplate } from 'lucide-react'

interface PwaEditorProps {
  pwaId: string
  onDataChange?: (data: any) => void
}

export function PwaEditor({ pwaId, onDataChange }: PwaEditorProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    url: '',
    shortName: '',
    themeColor: '#ffffff',
    bgColor: '#ffffff',
    displayMode: 'standalone',
    orientation: 'any',
    startUrl: '/',
    scope: '/',
    iconUrl: '',
    installMode: 'browser',
    promptDelay: 0
  })

  // Notify parent of changes
  useEffect(() => {
    if (onDataChange) {
        onDataChange(formData)
    }
  }, [formData, onDataChange])

  // Load PWA data
  useEffect(() => {
    const fetchPwa = async () => {
      try {
        const res = await fetch(`/api/pwa/${pwaId}`)
        if (!res.ok) throw new Error('Failed to load PWA')
        const data = await res.json()
        setFormData(data.pwa)
      } catch (error) {
        toast.error('Error loading PWA configuration')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPwa()
  }, [pwaId])

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/pwa/${pwaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Configuration saved')
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeploy = async () => {
    if (!confirm('Are you sure you want to publish this version? This will generate a new version number.')) return
    
    setIsDeploying(true)
    try {
      const res = await fetch(`/api/pwa/${pwaId}/deploy`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to deploy')
      toast.success('PWA Published Successfully')
      // Optionally reload to update version info
    } catch (error) {
      toast.error('Failed to publish PWA')
    } finally {
      setIsDeploying(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-card">
        <div>
          <h2 className="text-lg font-semibold">{formData.name}</h2>
          <p className="text-sm text-muted-foreground">{formData.url}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={handleDeploy} disabled={isDeploying}>
             {isDeploying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
             Publish
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center gap-2"><Globe className="h-4 w-4" /> General</TabsTrigger>
            <TabsTrigger value="styles" className="flex items-center gap-2"><Palette className="h-4 w-4" /> Branding & Styles</TabsTrigger>
            <TabsTrigger value="metadata" className="flex items-center gap-2"><FileText className="h-4 w-4" /> Metadata</TabsTrigger>
            <TabsTrigger value="install-ui" className="flex items-center gap-2"><LayoutTemplate className="h-4 w-4" /> Install UI</TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Behavior</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details for your Progressive Web App.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>App Name</Label>
                  <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Short Name (for Home Screen)</Label>
                  <Input value={formData.shortName || ''} onChange={(e) => handleChange('shortName', e.target.value)} placeholder="e.g. MyShop" />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Website URL</Label>
                  <Input value={formData.url} onChange={(e) => handleChange('url', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="styles" className="space-y-4">
             <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Customize the look and feel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Theme Color (Toolbar)</Label>
                      <ColorInput 
                         value={formData.themeColor || '#ffffff'} 
                         onChange={(color) => handleChange('themeColor', color)}
                         allowImageVideo={false}
                         placeholder="#ffffff"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Background Color (Splash)</Label>
                      <ColorInput 
                         value={formData.bgColor || '#ffffff'} 
                         onChange={(color) => handleChange('bgColor', color)}
                         allowImageVideo={false}
                         placeholder="#ffffff"
                      />
                    </div>
                 </div>
                 <div className="grid gap-2 pt-4">
                    <Label>App Icon</Label>
                    <PwaIconInput 
                       value={formData.iconUrl || ''} 
                       onChange={(val) => handleChange('iconUrl', val)} 
                    />
                    <p className="text-xs text-muted-foreground">Recommended: 512x512px PNG, JPG, or GIF.</p>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <Card>
               <CardHeader>
                  <CardTitle>Store & Metadata</CardTitle>
                  <CardDescription>Rich metadata for PWA install prompts and store listings.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="space-y-4">
                     <div>
                        <Label className="mb-2 block">Mobile Screenshots</Label>
                        <ScreenshotsInput 
                           values={formData.screenshots || []}
                           onChange={(vals) => handleChange('screenshots', vals)}
                        />
                        <p className="text-xs text-muted-foreground mt-2">Upload screenshots to showcase your app in the install prompt.</p>
                     </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                     <div className="grid gap-2">
                        <Label>Categories</Label>
                        <Input 
                           value={formData.categories?.join(', ') || ''} 
                           onChange={(e) => handleChange('categories', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                           placeholder="productivity, business, utilities" 
                        />
                        <p className="text-xs text-muted-foreground">Comma-separated list of categories.</p>
                     </div>
                     <div className="grid gap-2">
                        <Label>Language</Label>
                        <Input 
                           value={formData.manifestParams?.lang || 'en'} 
                           onChange={(e) => handleChange('manifestParams', { ...formData.manifestParams, lang: e.target.value })}
                           placeholder="en-US" 
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="install-ui" className="space-y-4">
             <Card>
               <CardHeader>
                  <CardTitle>Install Banner Design</CardTitle>
                  <CardDescription>Customize the "Add to Home Screen" prompt style.</CardDescription>
               </CardHeader>
               <CardContent>
                  <PwaBannerEditor 
                     config={formData.installBannerConfig || {}} 
                     onChange={(conf) => handleChange('installBannerConfig', conf)}
                  />
               </CardContent>
             </Card>
             
             <Card>
                <CardHeader>
                   <CardTitle>Embed Code</CardTitle>
                   <CardDescription>Copy this code to your website to enable the PWA install prompt.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="relative rounded-md bg-muted p-4 font-mono text-sm">
                      <code className="break-all">
                        {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/pwa-embed.js" data-pwa-id="${pwaId}"></script>`}
                      </code>
                      <Button 
                         variant="secondary" 
                         size="sm" 
                         className="absolute top-2 right-2 h-7"
                         onClick={() => {
                            navigator.clipboard.writeText(`<script src="${window.location.origin}/pwa-embed.js" data-pwa-id="${pwaId}"></script>`)
                            toast.success('Copied to clipboard')
                         }}
                      >
                         Copy
                      </Button>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
             <Card>
              <CardHeader>
                <CardTitle>Display & Behavior</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                       <Label>Display Mode</Label>
                       <Select value={formData.displayMode} onValueChange={(val) => handleChange('displayMode', val)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="standalone">Standalone (App-like)</SelectItem>
                             <SelectItem value="minimal-ui">Minimal UI</SelectItem>
                             <SelectItem value="fullscreen">Fullscreen</SelectItem>
                             <SelectItem value="browser">Browser</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="grid gap-2">
                       <Label>Orientation</Label>
                       <Select value={formData.orientation} onValueChange={(val) => handleChange('orientation', val)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="any">Any</SelectItem>
                             <SelectItem value="portrait">Portrait</SelectItem>
                             <SelectItem value="landscape">Landscape</SelectItem>
                             <SelectItem value="natural">Natural</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                       <Label>Start URL</Label>
                       <Input value={formData.startUrl} onChange={(e) => handleChange('startUrl', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                       <Label>Scope</Label>
                       <Input value={formData.scope} onChange={(e) => handleChange('scope', e.target.value)} />
                    </div>
                 </div>

                 <div className="grid gap-2 pt-4 border-t">
                    <Label className="mb-2">Install Prompt Strategy</Label>
                    <div className="flex items-center justify-between border p-3 rounded-md">
                       <div className="space-y-0.5">
                          <Label className="text-base">Automatic Browser Prompt</Label>
                          <p className="text-sm text-muted-foreground">Let the browser decide when to show the install prompt.</p>
                       </div>
                       <Switch 
                          checked={formData.installMode === 'browser'}
                          onCheckedChange={(checked) => handleChange('installMode', checked ? 'browser' : 'manual')}
                       />
                    </div>
                    {formData.installMode === 'manual' && (
                        <div className="bg-muted/50 p-4 rounded-md text-sm">
                           You selected <strong>Manual</strong> mode. You will need to trigger the install prompt programmatically using our SDK.
                        </div>
                    )}
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
