'use client'

import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import * as Icons from 'lucide-react'
import type { Chatbot } from '../types'
import { ChatWindowSection } from './sections/ChatWindowSection'
import { WidgetButtonSection } from './sections/WidgetButtonSection'
import { MessagesSection } from './sections/MessagesSection'
import { RegularHeaderSection } from './sections/RegularHeaderSection'
import { RegularFooterSection } from './sections/RegularFooterSection'
import { StartScreenPromptsSection } from './sections/StartScreenPromptsSection'
import { GetStartedSection } from './sections/GetStartedSection'
import { ChatKitIntegrationSection } from './sections/ChatKitIntegrationSection'

interface RegularStyleConfigProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function RegularStyleConfig({ formData, setFormData }: RegularStyleConfigProps) {
  const engineType = (formData as any).engineType || 'custom'
  const isOpenAIAgentSDK = engineType === 'openai-agent-sdk'
  const chatkitOptions = (formData as any).chatkitOptions || {}
  
  // Ensure all borders use light theme color
  useEffect(() => {
    const styleId = 'chatbot-style-border-fix'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        /* Ensure all borders in style config use light theme color */
        [class*="border-b"]:not([class*="border-black"]):not([class*="border-blue"]):not([class*="border-green"]):not([class*="border-red"]):not([class*="border-yellow"]):not([class*="border-purple"]):not([class*="border-pink"]):not([class*="border-orange"]):not([class*="border-amber"]) {
          border-color: hsl(var(--border)) !important;
        }
        [class*="border"]:not([class*="border-black"]):not([class*="border-blue"]):not([class*="border-green"]):not([class*="border-red"]):not([class*="border-yellow"]):not([class*="border-purple"]):not([class*="border-pink"]):not([class*="border-orange"]):not([class*="border-amber"]):not([class*="border-current"]) {
          border-color: hsl(var(--border)) !important;
        }
        [class*="divide"] {
          border-color: hsl(var(--border)) !important;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return (
    <div className="w-full">
      <Tabs defaultValue="chat-window" className="flex w-full gap-6">
        <TabsList orientation="vertical" className="bg-muted/30 p-1 min-h-[400px] h-fit flex-col justify-start items-stretch gap-1 w-[220px] rounded-lg">
          <TabsTrigger value="getstarted" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.Rocket className="h-4 w-4" />
            Get Started
          </TabsTrigger>
          <TabsTrigger value="chat-window" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.Layout className="h-4 w-4" />
            Chat Window
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 w-full max-w-[800px]">
          <TabsContent value="chat-window" className="m-0 mt-0">
            <ChatWindowSection formData={formData} setFormData={setFormData} />
          </TabsContent>
          <TabsContent value="widget" className="m-0 mt-0">
            <WidgetButtonSection formData={formData} setFormData={setFormData} />
          </TabsContent>
          {!isOpenAIAgentSDK && (
            <TabsContent value="chatkit-integration" className="m-0 mt-0">
              <ChatKitIntegrationSection formData={formData} setFormData={setFormData} />
            </TabsContent>
          )}
          <TabsContent value="header" className="m-0 mt-0">
            <RegularHeaderSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
          </TabsContent>
          <TabsContent value="messages" className="m-0 mt-0">
            <MessagesSection formData={formData} setFormData={setFormData} />
          </TabsContent>
          <TabsContent value="footer" className="m-0 mt-0">
            <RegularFooterSection formData={formData} setFormData={setFormData} />
          </TabsContent>
          <TabsContent value="startScreenPrompts" className="m-0 mt-0">
            <StartScreenPromptsSection formData={formData} setFormData={setFormData} />
          </TabsContent>
          <TabsContent value="getstarted" className="m-0 mt-0">
            <GetStartedSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
