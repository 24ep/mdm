'use client'

import { useRef, useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ExternalLink, Settings, Monitor, Tablet, Smartphone, Code, GripVertical, Square, Circle, Triangle, Signal, Wifi, Battery } from 'lucide-react'
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
  const [platform, setPlatform] = useState<'ios' | 'android'>('android')
  const [emulatorWidth, setEmulatorWidth] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)
  const [previewSource, setPreviewSource] = useState<'draft' | 'live'>('draft')

  // Handle resize drag
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = containerRef.current?.offsetWidth || 500
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startXRef.current - e.clientX
      const newWidth = Math.max(320, Math.min(1920, startWidthRef.current + delta))
      setEmulatorWidth(newWidth)
      setDeviceType('desktop') // Switch to desktop mode to allow custom width
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

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

  // Send preview mode to iframe ONLY when previewMode changes (not on every formData change)
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current) return

    const sendPreviewMode = () => {
      try {
        emulatorRef.current?.contentWindow?.postMessage({ type: 'chatbot-preview-mode', value: previewMode }, window.location.origin)
      } catch { }
    }

    // Small delay to ensure iframe is ready
    const timer = setTimeout(sendPreviewMode, 100)
    return () => clearTimeout(timer)
  }, [previewMode, selectedChatbot?.id])

  // Send initial messages when iframe loads
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current) return

    const iframe = emulatorRef.current
    const handleLoad = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.postMessage({ type: 'chatbot-preview-mode', value: previewMode }, window.location.origin)
          iframe.contentWindow?.postMessage(
            {
              type: 'emulator-config-update',
              id: selectedChatbot.id,
              emulatorConfig: emulatorConfig,
            },
            window.location.origin
          )
        } catch { }
      }, 200)
    }

    iframe.addEventListener('load', handleLoad)

    return () => {
      iframe.removeEventListener('load', handleLoad)
    }
  }, [selectedChatbot?.id]) // Only re-attach on chatbot change, not on every config change

  // Push realtime style updates to emulator via postMessage
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current || !formData) return
    const iframe = emulatorRef.current
    
    // If previewSource is 'live', we want to show the latest published version
    const activeConfig = previewSource === 'live' 
      ? (selectedChatbot.versions?.find(v => v.isPublished)?.config || selectedChatbot)
      : formData

    try {
      iframe.contentWindow?.postMessage(
        {
          type: 'chatbot-config-update',
          id: selectedChatbot.id,
          config: {
            ...activeConfig,
            id: selectedChatbot.id,
          },
        },
        window.location.origin
      )
    } catch (e) {
      // ignore
    }
  }, [selectedChatbot?.id, formData, previewSource, selectedChatbot?.versions])

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
        window.location.origin
      )
    } catch (e) {
      // ignore
    }
  }, [selectedChatbot?.id, emulatorConfig])



  return (
    <div ref={containerRef} className="min-h-[800px] overflow-visible relative bg-muted/10 h-full flex flex-col" style={{ borderColor: formData.borderColor }}>
      {/* Draggable resize handle on left border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize group flex items-center justify-center bg-border hover:bg-primary/20 transition-colors ${isResizing ? 'bg-primary/30' : ''}`}
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background z-10" style={{ borderColor: formData.borderColor }}>
        <div className="flex items-center gap-2">
          {/* Live/Draft Toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 mr-2">
            <Button
              variant={previewSource === 'draft' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs font-medium rounded-md transition-all ${previewSource === 'draft' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setPreviewSource('draft')}
            >
              Draft
            </Button>
            <Button
              variant={previewSource === 'live' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs font-medium rounded-md transition-all ${previewSource === 'live' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setPreviewSource('live')}
              disabled={!selectedChatbot?.isPublished}
              title={!selectedChatbot?.isPublished ? "Publish the chatbot to preview the live version" : ""}
            >
              Live
            </Button>
          </div>
          <div className="w-px h-4 bg-border mx-1" />
          <div className="text-sm font-medium">Emulator</div>
          <div className="w-px h-4 bg-border mx-1" />
          <div className="flex rounded-lg p-0.5 gap-0.5">
            <Button
              variant={deviceType === 'desktop' ? 'default' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-md transition-all ${deviceType === 'desktop' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
              onClick={() => setDeviceType('desktop')}
              title="Desktop View"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceType === 'tablet' ? 'default' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-md transition-all ${deviceType === 'tablet' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
              onClick={() => setDeviceType('tablet')}
              title="Tablet View"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceType === 'mobile' ? 'default' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-md transition-all ${deviceType === 'mobile' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
              onClick={() => setDeviceType('mobile')}
              title="Mobile View"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          {deviceType !== 'desktop' && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <div className="flex rounded-lg p-0.5 gap-0.5">
                <Button
                  variant={platform === 'ios' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 px-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${platform === 'ios' ? 'bg-secondary text-secondary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
                  onClick={() => setPlatform('ios')}
                >
                  iOS
                </Button>
                <Button
                  variant={platform === 'android' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 px-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${platform === 'android' ? 'bg-secondary text-secondary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
                  onClick={() => setPlatform('android')}
                >
                  Android
                </Button>
              </div>
            </>
          )}
          {emulatorWidth && deviceType === 'desktop' && (
            <span className="text-xs text-muted-foreground">{emulatorWidth}px</span>
          )}
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
                variant="ghost"
                size="sm"
                className="h-8 hover:bg-muted"
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
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={() => setConfigDrawerOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 hover:bg-muted"
                onClick={() => window.open(`/chat/${selectedChatbot.id}?preview=true&deploymentType=${previewMode}&previewDevice=${deviceType}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                New Tab
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedChatbot?.id ? (
        <div
          className="relative w-full flex-1 overflow-auto flex items-center justify-center p-8 bg-muted/10 transition-all duration-300"
          style={{
            backgroundColor: (formData as any).pageBackgroundColor,
            backgroundImage: (formData as any).pageBackgroundImage ? `url(${(formData as any).pageBackgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {deviceType === 'desktop' ? (
            // Desktop view - simple container (no shadow for clean look)
            <div
              className="relative bg-background transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0"
              style={{
                width: emulatorWidth ? `${emulatorWidth}px` : '100%',
                height: '100%',
                maxHeight: '100%'
              }}
            >
              <iframe
                ref={emulatorRef}
                src={`/chat/${selectedChatbot.id}?preview=true&deploymentType=${previewMode}&previewDevice=${deviceType}`}
                className="w-full h-full border-0 bg-background"
                title="Chat Emulator"
                style={{ position: 'relative', zIndex: Z_INDEX.content }}
              />
            </div>
          ) : (
            // Mobile/Tablet view - realistic device frame
            <div
              className="relative shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0"
              style={{ backgroundColor: '#f5f5f5' }} // Light theme background
              style={{
                width: deviceType === 'mobile' ? '300px' : '500px',
                height: deviceType === 'mobile' ? '600px' : '700px',
                borderRadius: deviceType === 'mobile' ? '40px' : '32px',
                border: `${deviceType === 'mobile' ? '8px' : '10px'} solid #e5e5e5`, // Light theme border
                transform: 'translateZ(0)'
              }}
            >
              {/* Status Bar */}
              <div
                className={`h-8 w-full flex items-center justify-between px-6 text-[10px] font-bold shrink-0 ${platform === 'android' ? 'flex-row' : 'flex-row'}`}
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff'
                }}
              >
                {platform === 'android' ? (
                  <>
                    <span>9:41</span>
                    <div className="flex gap-1.5 items-center">
                      <Signal className="h-3 w-3" />
                      <Wifi className="h-3 w-3" />
                      <Battery className="h-4 w-3" />
                    </div>
                  </>
                ) : (
                  <>
                    <span>9:41</span>
                    <div className="flex gap-1 items-center">
                      <Signal className="h-3 w-3" />
                      <Wifi className="h-3 w-3" />
                      <Battery className="h-4 w-3" />
                    </div>
                  </>
                )}
              </div>

              {/* Content Area */}
              <div className="flex-1 w-full relative overflow-hidden bg-white">
                <iframe
                  ref={emulatorRef}
                  src={`/chat/${selectedChatbot.id}?preview=true&deploymentType=${previewMode}&previewDevice=${deviceType}`}
                  className="w-full h-full border-0"
                  title="Chat Emulator"
                  style={{
                    position: 'relative',
                    zIndex: Z_INDEX.content,
                    backgroundColor: '#ffffff',
                    // Isolate emulator from global.css styles
                    isolation: 'isolate'
                  }}
                />
              </div>

              {/* Navigation Bar / Home Indicator */}
              {platform === 'android' ? (
                <div className="h-12 w-full bg-[#111] flex items-center justify-around px-8 shrink-0 relative z-[60]">
                  <Triangle className="h-4 w-4 text-white/70 rotate-[-90deg] cursor-pointer hover:text-white transition-colors" />
                  <Circle className="h-4 w-4 text-white/70 cursor-pointer hover:text-white transition-colors" />
                  <Square className="h-3.5 w-3.5 text-white/70 rounded-[1px] cursor-pointer hover:text-white transition-colors" />
                </div>
              ) : (
                <div className="h-6 w-full flex items-center justify-center shrink-0 relative z-[60]">
                  <div className="w-32 h-1 bg-white/50 rounded-full" />
                </div>
              )}
            </div>
          )}
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

