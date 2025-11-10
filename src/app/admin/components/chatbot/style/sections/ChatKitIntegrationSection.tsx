'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { SectionGroup } from '../components/SectionGroup'

interface ChatKitIntegrationSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatKitIntegrationSection({ formData, setFormData }: ChatKitIntegrationSectionProps) {
  const engineType = (formData as any).engineType || 'custom'
  const isChatKitEngine = engineType === 'chatkit'
  const isOpenAIAgentSDK = engineType === 'openai-agent-sdk'
  const isEnabled = formData.useChatKitInRegularStyle === true
  const chatbotEnabled = (formData as any).chatbotEnabled !== false // Default to true
  
  return (
    <AccordionItem value="chatkit-integration" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        {isOpenAIAgentSDK ? 'Chatbot Settings' : 'ChatKit Integration'}
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        {isOpenAIAgentSDK && (
          <SectionGroup title="Enable Chatbot" isFirst>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Chatbot Widget</Label>
                  <p className="text-xs text-muted-foreground">
                    Turn the chatbot widget on or off. When disabled, the chatbot will not be displayed.
                  </p>
                </div>
                <Switch 
                  checked={chatbotEnabled} 
                  onCheckedChange={(checked) => setFormData({ ...formData, chatbotEnabled: checked } as any)} 
                />
              </div>
            </div>
          </SectionGroup>
        )}
        
        <SectionGroup title={isChatKitEngine ? "Use Regular Style UI" : "Enable ChatKit in Regular Style"} isFirst={!isOpenAIAgentSDK}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>{isChatKitEngine ? "Use Regular Style Instead of ChatKit UI" : "Use ChatKit in Regular Style"}</Label>
                <p className="text-xs text-muted-foreground">
                  {isChatKitEngine 
                    ? "When enabled, use regular style UI instead of ChatKit UI (only header config from ChatKit will be used)"
                    : "Enable ChatKit for regular style engines (only header config from ChatKit will be used)"
                  }
                </p>
              </div>
              <Switch 
                checked={isEnabled} 
                onCheckedChange={(checked) => setFormData({ ...formData, useChatKitInRegularStyle: checked })} 
              />
            </div>
            {isEnabled && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> {isChatKitEngine 
                    ? "Regular style UI will be used, but only the header configuration from ChatKit options will be applied. All other ChatKit configurations (theme, composer, start screen, etc.) will be ignored."
                    : "ChatKit will be used but only the header configuration from ChatKit options will be applied. All other ChatKit configurations (theme, composer, start screen, etc.) will be ignored."
                  }
                </p>
              </div>
            )}
          </div>
        </SectionGroup>

        {/* Header Configuration (only shown when enabled) */}
        {isEnabled && (
          <>
            <SectionGroup title="Header Content">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Header Description</Label>
                  <Input
                    value={formData.headerDescription || ''}
                    onChange={(e) => setFormData({ ...formData, headerDescription: e.target.value })}
                    placeholder="Short tagline or description"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Show Header Logo</Label>
                    <Switch
                      checked={(formData as any).headerShowLogo !== false}
                      onCheckedChange={(checked) => setFormData({ ...formData, headerShowLogo: checked } as any)}
                    />
                  </div>
                  {(formData as any).headerShowLogo !== false && (
                    <div className="space-y-2">
                      <Label>Upload Header Logo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = (ev) => {
                            const url = ev.target?.result as string
                            setFormData({ ...formData, headerLogo: url })
                          }
                          reader.readAsDataURL(file)
                        }}
                      />
                      {formData.headerLogo && (
                        <div className="mt-2">
                          <img 
                            src={formData.headerLogo} 
                            alt="Header logo" 
                            className="h-12 w-12 object-contain border rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SectionGroup>

            <SectionGroup title="Header Styling">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Background Color</Label>
                  <ColorInput
                    value={formData.headerBgColor || '#3b82f6'}
                    onChange={(color) => setFormData({ ...formData, headerBgColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#3b82f6"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Header Text Color</Label>
                  <ColorInput
                    value={formData.headerFontColor || '#ffffff'}
                    onChange={(color) => setFormData({ ...formData, headerFontColor: color })}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#ffffff"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </div>
              </div>
            </SectionGroup>

            <SectionGroup title="Header Border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Show Header Border</Label>
                  <Switch
                    checked={(formData as any).headerBorderEnabled !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, headerBorderEnabled: checked } as any)}
                  />
                </div>
                {(formData as any).headerBorderEnabled !== false && (
                  <div className="space-y-2">
                    <Label>Header Border Color</Label>
                    <ColorInput
                      value={(formData as any).headerBorderColor || '#e5e7eb'}
                      onChange={(color) => setFormData({ ...formData, headerBorderColor: color } as any)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                )}
              </div>
            </SectionGroup>
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

