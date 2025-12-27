'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion } from '@/components/ui/accordion'
import { Palette, LayoutTemplate, Layers, Languages, UserCircle, Bot, Sparkles, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import type { Chatbot } from '../types'
import type { ChatbotConfig } from '@/app/chat/[id]/types'
import {
  ThemeSection,
  LocaleSection,
  PopoverSection,
  WidgetSection,
  PersonaPickerSection
} from './sections'
import { ChatKitIntegrationSection } from './sections/ChatKitIntegrationSection'
import { AnimationSection } from './sections/AnimationSection'

interface ChatKitStyleConfigProps {
  formData: Partial<Chatbot>
  setFormData: (data: Partial<Chatbot> | ((prev: Partial<Chatbot>) => Partial<Chatbot>)) => void
  chatkitOptions: any
}

// Wrapper for section content to ensure consistent styling
const SectionWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full bg-white dark:bg-card rounded-lg border shadow-sm p-0 overflow-hidden">
      {children}
    </div>
  )
}

export function ChatKitStyleConfig({ formData, setFormData, chatkitOptions }: ChatKitStyleConfigProps) {
  const [activeTab, setActiveTab] = useState('theme')

  const handleChange = (field: keyof ChatbotConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const config = formData as ChatbotConfig

  return (
    <div className="space-y-6">
      <Tabs defaultValue="theme" value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row w-full gap-6">
        <TabsList className="flex flex-col h-auto gap-2 bg-transparent p-0 w-full md:w-48 lg:w-64 shrink-0 justify-start">
          <TabsTrigger value="theme" className="justify-start gap-3 px-3 py-2.5 rounded-md w-full aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all text-sm">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="locale" className="justify-start gap-3 px-3 py-2.5 rounded-md w-full aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all text-sm">
            <Languages className="h-4 w-4" />
            Locale
          </TabsTrigger>
          {/* Header removed from here */}
          <TabsTrigger value="persona" className="justify-start gap-3 px-3 py-2.5 rounded-md w-full aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all text-sm">
            <UserCircle className="h-4 w-4" />
            Persona
          </TabsTrigger>
          <TabsTrigger value="popover" className="justify-start gap-3 px-3 py-2.5 rounded-md w-full aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all text-sm">
            <MessageSquare className="h-4 w-4" />
            Popover
          </TabsTrigger>
          <TabsTrigger value="widget" className="justify-start gap-3 px-3 py-2.5 rounded-md w-full aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all text-sm">
            <LayoutTemplate className="h-4 w-4" />
            Widget
          </TabsTrigger>
          <TabsTrigger value="integration" className="justify-start gap-3 px-3 py-2.5 rounded-md w-full aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all text-sm">
            <Layers className="h-4 w-4" />
            Header
          </TabsTrigger>
          <TabsTrigger value="animation" className="justify-start gap-3 px-3 py-2.5 rounded-md w-full aria-selected:bg-background aria-selected:shadow-sm aria-selected:font-semibold hover:bg-muted/50 transition-all text-sm">
            <Sparkles className="h-4 w-4" />
            Animation
          </TabsTrigger>
        </TabsList>

        {/* Content Area - Each section wrapped in container for consistent styling */}
        <div className="flex-1 min-w-0 space-y-6">
          <TabsContent value="theme" className="m-0 mt-0">
            <SectionWrapper>
              <ThemeSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="locale" className="m-0 mt-0">
            <SectionWrapper>
              <LocaleSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          {/* Old Header tab removed */}

          <TabsContent value="persona" className="m-0 mt-0">
            <SectionWrapper>
              {/* Persona Picker Section */}
              <PersonaPickerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="popover" className="m-0 mt-0">
            <SectionWrapper>
              <PopoverSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="widget" className="m-0 mt-0">
            <SectionWrapper>
              <WidgetSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="integration" className="m-0 mt-0">
            {/* Renamed to Header in UI, but keeping value 'integration' to match trigger */}
            <SectionWrapper>
              <ChatKitIntegrationSection formData={formData} setFormData={setFormData} />
            </SectionWrapper>
          </TabsContent>

          <TabsContent value="animation" className="m-0 mt-0">
            {/* AnimationSection renders directly without accordion wrapper */}
            <div className="w-full bg-white dark:bg-card rounded-lg border shadow-sm p-6">
              <AnimationSection config={config} handleChange={handleChange} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
