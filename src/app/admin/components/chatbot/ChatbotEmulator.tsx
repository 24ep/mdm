'use client'

import { useRef, useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ExternalLink, Settings, Monitor, Tablet, Smartphone, Code, Copy } from 'lucide-react'
import { Chatbot } from './types'
import { EmulatorConfigDrawer } from './EmulatorConfigDrawer'
import { Z_INDEX } from '@/lib/z-index'
import { generateEmbedCode } from './utils'
import toast from 'react-hot-toast'

interface ChatbotEmulatorProps {
  selectedChatbot: Chatbot | null
  previewMode: 'popover' | 'fullpage' | 'popup-center'
  onPreviewModeChange: (mode: 'popover' | 'fullpage' | 'popup-center') => void
  formData: Partial<Chatbot>
  onFormDataChange?: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatbotEmulator({
  selectedChatbot,
  previewMode,
  onPreviewModeChange,
  formData,
  onFormDataChange
}: ChatbotEmulatorProps) {
  const emulatorRef = useRef<HTMLIFrameElement | null>(null)
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false)
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Map formData fields to emulator config
  const emulatorConfig = {
    backgroundColor: (formData as any).pageBackgroundColor || '#ffffff',
    backgroundImage: (formData as any).pageBackgroundImage || '',
    text: (formData as any).pageTitle || '',
    description: (formData as any).pageDescription || ''
  }

  // Handle emulator config changes by updating formData
  const handleEmulatorConfigChange = (newConfig: any) => {
    if (!onFormDataChange) return

    onFormDataChange(prev => ({
      ...prev,
      pageBackgroundColor: newConfig.backgroundColor,
      pageBackgroundImage: newConfig.backgroundImage,
      pageTitle: newConfig.text,
      pageDescription: newConfig.description
    }))
  }

  // Send preview mode and emulator config to iframe when it loads or when preview mode changes
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current) return

    const sendMessages = () => {
      try {
        setTimeout(() => {
          emulatorRef.current?.contentWindow?.postMessage({ type: 'chatbot-preview-mode', value: previewMode }, '*')
          emulatorRef.current?.contentWindow?.postMessage(
            {
              type: 'emulator-config-update',
              id: selectedChatbot.id,
              emulatorConfig: emulatorConfig,
            },
            '*'
          )
        }, 100)
      } catch { }
    }

    sendMessages()

    const iframe = emulatorRef.current
    const handleLoad = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.postMessage({ type: 'chatbot-preview-mode', value: previewMode }, '*')
          iframe.contentWindow?.postMessage(
            {
              type: 'emulator-config-update',
              id: selectedChatbot.id,
              emulatorConfig: emulatorConfig,
            },
            '*'
          )
        } catch { }
      }, 200)
    }

    iframe.addEventListener('load', handleLoad)

    return () => {
      iframe.removeEventListener('load', handleLoad)
    }
  }, [previewMode, selectedChatbot?.id, emulatorConfig])

  // Push realtime style updates to emulator via postMessage
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current || !formData) return
    const iframe = emulatorRef.current
    try {
      iframe.contentWindow?.postMessage(
        {
          type: 'chatbot-config-update',
          id: selectedChatbot.id,
          config: {
            ...formData,
            id: selectedChatbot.id,
          },
        },
        '*'
      )
    } catch (e) {
      // ignore
    }
  }, [selectedChatbot?.id, formData])

  // Send emulator config updates to iframe
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current) return
    const iframe = emulatorRef.current
    try {
      iframe.contentWindow?.postMessage(
        {
          type: 'emulator-config-update',
          id: selectedChatbot.id,
          emulatorConfig: emulatorConfig,
        },
        '*'
      )
    } catch (e) {
      // ignore
    }
  }, [selectedChatbot?.id, emulatorConfig])

  const getDeviceDimensions = () => {
    switch (deviceType) {
      case 'mobile':
        return { width: '375px', height: '667px', borderRadius: '40px', borderWidth: '12px' }
      case 'tablet':
        return { width: '768px', height: '1024px', borderRadius: '24px', borderWidth: '12px' }
      default:
        return { width: '100%', height: '100%', borderRadius: '0px', borderWidth: '0px' }
    }
  }

  const deviceStyle = getDeviceDimensions()

  return (
    <div className="min-h-[800px] border-l overflow-visible relative bg-muted/10 h-full flex flex-col" style={{ borderColor: formData.borderColor }}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background z-10" style={{ borderColor: formData.borderColor }}>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Emulator</div>
          <div className="w-px h-4 bg-border mx-1" />
          <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
            <Button
              variant={deviceType === 'desktop' ? 'default' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-md transition-all ${deviceType === 'desktop' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted-foreground/10'}`}
              onClick={() => setDeviceType('desktop')}
              title="Desktop View"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceType === 'tablet' ? 'default' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-md transition-all ${deviceType === 'tablet' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted-foreground/10'}`}
              onClick={() => setDeviceType('tablet')}
              title="Tablet View"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceType === 'mobile' ? 'default' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-md transition-all ${deviceType === 'mobile' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted-foreground/10'}`}
              onClick={() => setDeviceType('mobile')}
              title="Mobile View"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs">Preview as</Label>
          <Select value={previewMode} onValueChange={(v: any) => onPreviewModeChange(v)}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popover">Popover</SelectItem>
              <SelectItem value="popup-center">Popup Center</SelectItem>
              <SelectItem value="fullpage">Full Page</SelectItem>
            </SelectContent>
          </Select>
          {selectedChatbot?.id && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={async () => {
                  const chatbot = {
                    ...formData,
                    id: selectedChatbot.id,
                    deploymentType: formData.deploymentType || previewMode,
                    customEmbedDomain: formData.customEmbedDomain
                  } as Chatbot
                  const code = generateEmbedCode(chatbot)
                  const { copyToClipboard } = await import('@/lib/clipboard')
                  const success = await copyToClipboard(code)
                  if (success) {
                    toast.success('Embed code copied to clipboard!')
                  } else {
                    toast.error('Failed to copy to clipboard')
                  }
                }}
                title="Copy Embed Code"
              >
                <Code className="h-4 w-4 mr-2" />
                Embed
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setConfigDrawerOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => window.open(`/chat/${selectedChatbot.id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                New Tab
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedChatbot?.id ? (
        <div className="relative w-full flex-1 overflow-auto flex items-center justify-center p-8 bg-muted/10">
          <div
            className="relative bg-background shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0"
            style={{
              width: deviceStyle.width,
              height: deviceStyle.height,
              borderRadius: deviceStyle.borderRadius,
              border: deviceType !== 'desktop' ? `${deviceStyle.borderWidth} solid #1a1a1a` : 'none',
              maxHeight: '100%'
            }}
          >
            {formData.pwaEnabled && (
              <div
                className="absolute top-0 left-0 right-0 z-[50] p-3 flex items-center justify-between shadow-sm"
                style={{
                  backgroundColor: (formData as any).pwaBannerBgColor || '#ffffff',
                  color: (formData as any).pwaBannerFontColor || '#000000'
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    {(formData as any).pwaIconUrl ? (
                      <img src={(formData as any).pwaIconUrl} alt="App Icon" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">App</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight">{(formData as any).pwaBannerText || 'Install our App'}</span>
                    <span className="text-xs opacity-80">Add to home screen</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs px-3"
                  style={{
                    backgroundColor: (formData as any).pwaBannerButtonBgColor || '#000000',
                    color: (formData as any).pwaBannerButtonTextColor || '#ffffff'
                  }}
                >
                  Install
                </Button>
              </div>
            )}
            <iframe
              ref={emulatorRef}
              src={`/chat/${selectedChatbot.id}`}
              className="w-full h-full border-0 bg-background"
              title="Chat Emulator"
              style={{ position: 'relative', zIndex: Z_INDEX.content }}
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground p-6 text-sm">
          Save the chatbot first to enable the live emulator preview here.
        </div>
      )}

      <EmulatorConfigDrawer
        open={configDrawerOpen}
        onOpenChange={setConfigDrawerOpen}
        config={emulatorConfig}
        onConfigChange={handleEmulatorConfigChange}
      />
    </div>
  )
}

