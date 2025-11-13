'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Palette, Layout, Rocket, TrendingUp } from 'lucide-react'
import { StyleTab } from '../StyleTab'
import { Chatbot } from './types'
import { EngineConfig } from './components/EngineConfig'
import { ConfigTab } from './components/ConfigTab'
import { DeploymentTab } from './components/DeploymentTab'
import { PerformanceTab } from './components/PerformanceTab'

interface ChatbotEditorProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  selectedChatbot: Chatbot | null
  activeTab: 'engine' | 'style' | 'config' | 'deployment' | 'performance'
  onTabChange: (tab: 'engine' | 'style' | 'config' | 'deployment' | 'performance') => void
  onGenerateEmbedCode: (chatbot: Chatbot) => string
  hideTabsList?: boolean
}

export function ChatbotEditor({
  formData,
  setFormData,
  selectedChatbot,
  activeTab,
  onTabChange,
  onGenerateEmbedCode,
  hideTabsList = false,
}: ChatbotEditorProps) {
  // Render tab content based on activeTab when hideTabsList is true
  const renderTabContent = () => {
    if (activeTab === 'engine') {
      return <EngineConfig formData={formData} setFormData={setFormData} />
    }
    
    if (activeTab === 'style') {
      return (
        <div className="space-y-6 pt-4">
          <StyleTab formData={formData} setFormData={setFormData} />
        </div>
      )
    }
    
    if (activeTab === 'config') {
      return <ConfigTab formData={formData} setFormData={setFormData} />
    }
    
    if (activeTab === 'deployment') {
      return (
        <DeploymentTab
          formData={formData}
          setFormData={setFormData}
          selectedChatbot={selectedChatbot}
          onGenerateEmbedCode={onGenerateEmbedCode}
        />
      )
    }
    
    if (activeTab === 'performance') {
      return <PerformanceTab chatbot={selectedChatbot} />
    }
    
    return null
  }

  // When hideTabsList is true, render content directly without Tabs wrapper
  if (hideTabsList) {
    return <div className="w-full">{renderTabContent()}</div>
  }

  // Otherwise, use the Tabs component with TabsList
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)}>
        <TabsList className="w-full flex justify-start gap-2">
        <TabsTrigger value="engine">
          <Settings className="h-4 w-4 mr-2" />
          Engine
        </TabsTrigger>
        <TabsTrigger value="style">
          <Palette className="h-4 w-4 mr-2" />
          Style
        </TabsTrigger>
        <TabsTrigger value="config">
          <Layout className="h-4 w-4 mr-2" />
          Config
        </TabsTrigger>
        <TabsTrigger value="deployment">
          <Rocket className="h-4 w-4 mr-2" />
          Deployment
        </TabsTrigger>
        <TabsTrigger value="performance">
          <TrendingUp className="h-4 w-4 mr-2" />
          Performance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="engine" className="space-y-4 pt-4">
        <EngineConfig formData={formData} setFormData={setFormData} />
      </TabsContent>

      <TabsContent value="style" className="space-y-6 pt-4">
        <StyleTab formData={formData} setFormData={setFormData} />
      </TabsContent>

      <TabsContent value="config" className="space-y-4 pt-4">
        <ConfigTab formData={formData} setFormData={setFormData} />
      </TabsContent>

      <TabsContent value="deployment" className="space-y-4 pt-4">
        <DeploymentTab
          formData={formData}
          setFormData={setFormData}
          selectedChatbot={selectedChatbot}
          onGenerateEmbedCode={onGenerateEmbedCode}
        />
      </TabsContent>

      <TabsContent value="performance" className="space-y-4 pt-4">
        <PerformanceTab chatbot={selectedChatbot} />
      </TabsContent>
      </Tabs>
    </div>
  )
}
