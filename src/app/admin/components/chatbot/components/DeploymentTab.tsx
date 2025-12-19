'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Copy, Globe, Info, Smartphone } from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Chatbot } from '../types'
import toast from 'react-hot-toast'

interface DeploymentTabProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  selectedChatbot: Chatbot | null
  onGenerateEmbedCode: (chatbot: Chatbot) => string
}

export function DeploymentTab({
  formData,
  setFormData,
  selectedChatbot,
  onGenerateEmbedCode,
}: DeploymentTabProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Deployment Type</Label>
        <Select
          value={formData.deploymentType}
          onValueChange={(v: any) => setFormData({ ...formData, deploymentType: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popover">Popover Chat (Facebook Messenger style)</SelectItem>
            <SelectItem value="popup-center">Popup Center Dialog Modal</SelectItem>
            <SelectItem value="fullpage">Full Page (New Link)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Label>Custom Embed Domain (Optional)</Label>
        </div>
        <Input
          type="url"
          placeholder="https://chat.yourdomain.com"
          value={formData.customEmbedDomain || ''}
          onChange={(e) => setFormData({ ...formData, customEmbedDomain: e.target.value })}
        />
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            Leave empty to use the current domain. Set a custom domain if you want to embed the chat from a different URL 
            (e.g., when using a CDN, reverse proxy, or dedicated chat subdomain).
          </p>
        </div>
      </div>

      {/* PWA Configuration */}
      <div className="space-y-4 border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base font-medium">PWA Install Banner</Label>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="pwa-enabled">Enable PWA Install Banner</Label>
            <p className="text-xs text-muted-foreground">
              Show an install prompt inside the chat widget for users to install the chat as a standalone app
            </p>
          </div>
          <Switch
            id="pwa-enabled"
            checked={formData.pwaEnabled || false}
            onCheckedChange={(checked) => setFormData({ ...formData, pwaEnabled: checked })}
          />
        </div>

        {formData.pwaEnabled && (
          <>
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

            {/* PWA Metadata Section */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium text-muted-foreground">App Metadata (for installed PWA)</Label>
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
                <p className="text-xs text-muted-foreground">512x512 PNG recommended. Uses chatbot logo if empty.</p>
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
                      width: '128px', // Fixed preview size
                      height: '128px'
                    }} 
                  />
                  <p className="text-xs text-center mt-1 text-muted-foreground">
                    Actual size: {formData.pwaIconSize || 512}px
                  </p>
                </div>
              </div>
            )}

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

            {/* PWA Banner Styling Section */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium text-muted-foreground">Banner Styling</Label>
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

            {/* Install Button Styling */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium text-muted-foreground">Install Button Styling</Label>
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
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label>Embed Code</Label>
        <div className="flex gap-2">
          <Textarea
            readOnly
            rows={8}
            className="bg-muted border-0 resize-none font-mono text-xs"
            value={(() => {
              const chatbotId = selectedChatbot?.id || 'new-chatbot-id'
              const chatbot = { 
                ...formData, 
                id: chatbotId, 
                deploymentType: formData.deploymentType || 'popover',
                customEmbedDomain: formData.customEmbedDomain
              } as Chatbot
              return onGenerateEmbedCode(chatbot)
            })()}
          />
          <Button
            variant="outline"
            onClick={() => {
              const chatbotId = selectedChatbot?.id || 'new-chatbot-id'
              const chatbot = { 
                ...formData, 
                id: chatbotId, 
                deploymentType: formData.deploymentType || 'popover',
                customEmbedDomain: formData.customEmbedDomain
              } as Chatbot
              const code = onGenerateEmbedCode(chatbot)
              navigator.clipboard.writeText(code)
              toast.success('Embed code copied to clipboard')
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Copy this code and paste it into your website HTML to embed the chatbot.
        </p>
      </div>
    </div>
  )
}

