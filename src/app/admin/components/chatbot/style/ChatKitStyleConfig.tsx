'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion } from '@/components/ui/accordion'
import * as Icons from 'lucide-react'
import { useState } from 'react'
import type { Chatbot } from '../types'
import {
  ThemeSection,
  ComposerSection,
  LocaleSection,
  StartScreenSection,
  HeaderSection,
  PopoverSection,
  WidgetSection,
  PersonaPickerSection
} from './sections'
import { ChatKitIntegrationSection } from './sections/ChatKitIntegrationSection'

interface ChatKitStyleConfigProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

// Wrapper to render a section's accordion within a tab
// This maintains the accordion content styling while being usable in tabs
function SectionWrapper({ 
  children, 
  defaultValue,
  className = ''
}: { 
  children: React.ReactNode
  defaultValue: string
  className?: string
}) {
  const [accordionValue, setAccordionValue] = useState<string>(defaultValue)
  
  return (
    <div className={className}>
      <Accordion 
        type="single" 
        collapsible 
        value={accordionValue} 
        onValueChange={(value) => setAccordionValue(typeof value === 'string' ? value : value[0] || '')}
      >
        {children}
      </Accordion>
    </div>
  )
}

export function ChatKitStyleConfig({ formData, setFormData }: ChatKitStyleConfigProps) {
  const chatkitOptions = (formData as any).chatkitOptions || {}

  return (
    <div className="w-full">
      <Tabs defaultValue="integration" className="flex w-full gap-6">
        {/* Vertical Sidebar Menu */}
        <TabsList orientation="vertical" className="bg-muted/30 p-1 min-h-[400px] h-fit flex-col justify-start items-stretch gap-1 w-[220px] rounded-lg shrink-0">
          <TabsTrigger value="integration" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.Plug className="h-4 w-4" />
            Integration
          </TabsTrigger>
          <TabsTrigger value="theme" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="composer" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.PenTool className="h-4 w-4" />
            Composer
          </TabsTrigger>
          <TabsTrigger value="startScreen" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.Zap className="h-4 w-4" />
            Start Screen
          </TabsTrigger>
          <TabsTrigger value="locale" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.Globe className="h-4 w-4" />
            Locale
          </TabsTrigger>
          <TabsTrigger value="header" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.PanelTop className="h-4 w-4" />
            Header
          </TabsTrigger>
          <TabsTrigger value="persona" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.Users className="h-4 w-4" />
            Persona Picker
          </TabsTrigger>
          <TabsTrigger value="popover" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.Layout className="h-4 w-4" />
            Popover
          </TabsTrigger>
          <TabsTrigger value="widget" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Icons.MessageSquare className="h-4 w-4" />
            Widget
          </TabsTrigger>
        </TabsList>

        {/* Content Area - Each section wrapped in accordion for expandable subsections */}
        <div className="flex-1 w-full max-w-[800px]">
          <TabsContent value="integration" className="m-0 mt-0">
            <ChatKitIntegrationSection formData={formData} setFormData={setFormData} />
          </TabsContent>
          
          <TabsContent value="theme" className="m-0 mt-0">
            <SectionWrapper defaultValue="theme">
              <ThemeSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>
          
          <TabsContent value="composer" className="m-0 mt-0">
            <SectionWrapper defaultValue="composer">
              <ComposerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>
          
          <TabsContent value="startScreen" className="m-0 mt-0">
            <SectionWrapper defaultValue="startScreen">
              <StartScreenSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>
          
          <TabsContent value="locale" className="m-0 mt-0">
            <SectionWrapper defaultValue="locale">
              <LocaleSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>
          
          <TabsContent value="header" className="m-0 mt-0">
            <SectionWrapper defaultValue="header">
              <HeaderSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>
          
          <TabsContent value="persona" className="m-0 mt-0">
            <SectionWrapper defaultValue="personaPicker">
              <PersonaPickerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>
          
          <TabsContent value="popover" className="m-0 mt-0">
            <SectionWrapper defaultValue="popover">
              <PopoverSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>
          
          <TabsContent value="widget" className="m-0 mt-0">
            <SectionWrapper defaultValue="widget">
              <WidgetSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
