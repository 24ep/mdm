'use client'

import { useRef, useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ExternalLink, Settings } from 'lucide-react'
import { Chatbot } from './types'
import { EmulatorConfigDrawer } from './EmulatorConfigDrawer'

interface ChatbotEmulatorProps {
  selectedChatbot: Chatbot | null
  previewMode: 'popover' | 'fullpage' | 'popup-center'
  onPreviewModeChange: (mode: 'popover' | 'fullpage' | 'popup-center') => void
  formData: Partial<Chatbot>
}

export function ChatbotEmulator({ 
  selectedChatbot, 
  previewMode, 
  onPreviewModeChange,
  formData 
}: ChatbotEmulatorProps) {
  const emulatorRef = useRef<HTMLIFrameElement | null>(null)
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false)
  const [emulatorConfig, setEmulatorConfig] = useState({
    backgroundColor: '#ffffff',
    backgroundImage: '',
    text: '',
    description: ''
  })

  // Wrapper function to handle partial config updates
  const handleConfigChange = (config: { backgroundColor?: string; backgroundImage?: string; text?: string; description?: string }) => {
    setEmulatorConfig(prev => ({
      backgroundColor: config.backgroundColor ?? prev.backgroundColor,
      backgroundImage: config.backgroundImage ?? prev.backgroundImage,
      text: config.text ?? prev.text,
      description: config.description ?? prev.description
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
      } catch {}
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
        } catch {}
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

  return (
    <div className="min-h-[800px] border rounded-lg overflow-visible relative" style={{ borderColor: formData.borderColor }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: formData.borderColor }}>
        <div className="text-sm font-medium">Emulator</div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Preview as</Label>
          <Select value={previewMode} onValueChange={(v: any) => onPreviewModeChange(v)}>
            <SelectTrigger className="h-8 w-[180px]">
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
                Open in new page
              </Button>
            </>
          )}
        </div>
      </div>
      {selectedChatbot?.id ? (
        <div className="relative w-full h-[760px] overflow-hidden">
          <iframe
            ref={emulatorRef}
            src={`/chat/${selectedChatbot.id}`}
            className="w-full h-full border-0"
            title="Chat Emulator"
            style={{ position: 'relative', zIndex: 1 }}
          />
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
        onConfigChange={handleConfigChange}
      />
    </div>
  )
}

