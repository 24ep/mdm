'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

import { Button } from '@/components/ui/button'
import { X, Settings, Layout, Palette, Square, History, MousePointerClick, LayoutTemplate } from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'

interface ChatKitIntegrationSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatKitIntegrationSection({ formData, setFormData }: ChatKitIntegrationSectionProps) {
  const [openItems, setOpenItems] = useState<string[]>(['general-settings', 'header-content', 'header-actions', 'header-styling', 'header-border', 'history-panel'])

  const handleChange = (field: keyof Chatbot, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }
  const engineType = (formData as any).engineType || 'custom'
  const isChatKitEngine = engineType === 'chatkit'
  const isOpenAIAgentSDK = engineType === 'openai-agent-sdk'
  const isEnabled = formData.useChatKitInRegularStyle === true
  const chatbotEnabled = (formData as any).chatbotEnabled !== false // Default to true

  return (
    <div className="space-y-2">
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={(val) => setOpenItems(val as string[])}
      >
        {/* General Settings */}
        <AccordionItem value="general-settings" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">General Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              {isOpenAIAgentSDK && (
                <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
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
              )}
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                <div className="space-y-1">
                  <Label>Enable on Desktop</Label>
                  <p className="text-xs text-muted-foreground">
                    {isChatKitEngine
                      ? "Use regular style UI instead of ChatKit UI on desktop. Mobile always uses ChatKit native UI."
                      : "Enable ChatKit for regular style engines on desktop. Mobile always uses ChatKit native UI."
                    }
                  </p>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, useChatKitInRegularStyle: checked })}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Header Content */}
        <AccordionItem value="header-content" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Header Content</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              {/* Title & Description */}
              <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                <h4 className="text-sm font-medium mb-2">Title & Description</h4>

                <div className="flex items-center justify-between">
                  <Label htmlFor="headerShowTitle">Show Title</Label>
                  <Switch
                    id="headerShowTitle"
                    checked={(formData as any).headerShowTitle !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, headerShowTitle: checked } as any)}
                  />
                </div>

                {(formData as any).headerShowTitle !== false && (
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.headerTitle || ''}
                      onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value } as any)}
                      placeholder="Chatbot Name"
                    />
                    <p className="text-xs text-muted-foreground">Title displayed in the header</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Header Description</Label>
                  <Input
                    value={formData.headerDescription || ''}
                    onChange={(e) => setFormData({ ...formData, headerDescription: e.target.value })}
                    placeholder="Short tagline or description"
                  />
                </div>
              </div>

              {/* Header Logo */}
              <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                <h4 className="text-sm font-medium mb-2">Header Logo</h4>
                <div className="flex items-center justify-between">
                  <Label>Show Header Logo</Label>
                  <Switch
                    checked={(formData as any).headerShowLogo !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, headerShowLogo: checked } as any)}
                  />
                </div>
                {(formData as any).headerShowLogo !== false && (
                  <div className="space-y-2 mt-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Image URL</Label>
                        <Input
                          value={formData.headerLogo || ''}
                          onChange={(e) => setFormData({ ...formData, headerLogo: e.target.value })}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Or Upload File</Label>
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
                      </div>
                    </div>
                    {formData.headerLogo && (
                      <div className="mt-2">
                        <img
                          src={formData.headerLogo}
                          alt="Header logo"
                          className="h-12 w-12 object-contain border rounded bg-white"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Header Custom Buttons */}
              <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                <h4 className="text-sm font-medium mb-4">Header Custom Buttons</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Add custom buttons to the header. These buttons will appear in the header area.
                </p>
                <div className="space-y-2">
                  {((formData as any).chatkitOptions?.header?.customButtonLeft || []).map((button: { icon?: string; label?: string }, index: number) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2 bg-background">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Button Label</Label>
                            <Input
                              value={button.label || ''}
                              onChange={(e) => {
                                const buttons = [...((formData as any).chatkitOptions?.header?.customButtonLeft || [])]
                                buttons[index] = { ...buttons[index], label: e.target.value }
                                const currentOptions = (formData as any).chatkitOptions || {}
                                setFormData({
                                  ...formData,
                                  chatkitOptions: {
                                    ...currentOptions,
                                    header: {
                                      ...currentOptions.header,
                                      customButtonLeft: buttons
                                    }
                                  }
                                } as any)
                              }}
                              placeholder="Button Label"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Icon Name</Label>
                            <Input
                              value={button.icon || ''}
                              onChange={(e) => {
                                const buttons = [...((formData as any).chatkitOptions?.header?.customButtonLeft || [])]
                                buttons[index] = { ...buttons[index], icon: e.target.value }
                                const currentOptions = (formData as any).chatkitOptions || {}
                                setFormData({
                                  ...formData,
                                  chatkitOptions: {
                                    ...currentOptions,
                                    header: {
                                      ...currentOptions.header,
                                      customButtonLeft: buttons
                                    }
                                  }
                                } as any)
                              }}
                              placeholder="e.g., Settings, Menu"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const buttons = [...((formData as any).chatkitOptions?.header?.customButtonLeft || [])]
                            buttons.splice(index, 1)
                            const currentOptions = (formData as any).chatkitOptions || {}
                            setFormData({
                              ...formData,
                              chatkitOptions: {
                                ...currentOptions,
                                header: {
                                  ...currentOptions.header,
                                  customButtonLeft: buttons
                                }
                              }
                            } as any)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentButtons = (formData as any).chatkitOptions?.header?.customButtonLeft || []
                      const buttons = [...currentButtons, { icon: '', label: '' }]
                      const currentOptions = (formData as any).chatkitOptions || {}
                      setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...currentOptions,
                          header: {
                            ...currentOptions.header,
                            customButtonLeft: buttons
                          }
                        }
                      } as any)
                    }}
                  >
                    + Add Header Button
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Header Action Buttons */}
        <AccordionItem value="header-actions" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Header Action Buttons</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Show Clear Button</Label>
                  <p className="text-xs text-muted-foreground">Display the clear conversation button in header</p>
                </div>
                <Switch
                  checked={(formData as any).headerShowClearSession !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, headerShowClearSession: checked } as any)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Show Start Conversation</Label>
                  <p className="text-xs text-muted-foreground">Show entry message to start chat</p>
                </div>
                <Switch
                  checked={formData.showStartConversation !== false}
                  onCheckedChange={(checked) => handleChange('showStartConversation', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Enable Renaming</Label>
                  <p className="text-xs text-muted-foreground">Allow users to rename conversations</p>
                </div>
                <Switch
                  checked={(formData as any).enableConversationRenaming !== false}
                  onCheckedChange={(checked) => handleChange('enableConversationRenaming', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Show New Chat Button</Label>
                  <p className="text-xs text-muted-foreground">Display the "New Chat" button in the sidebar</p>
                </div>
                <Switch
                  checked={(formData as any).showNewChatButton !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, showNewChatButton: checked } as any)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Header Styling */}
        <AccordionItem value="header-styling" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Header Styling</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Header Background Color</Label>
                <ColorInput
                  value={formData.headerBgColor || '#3b82f6'}
                  onChange={(color) => setFormData({ ...formData, headerBgColor: color })}
                  allowImageVideo={true}
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
          </AccordionContent>
        </AccordionItem>

        {/* Header Border */}
        <AccordionItem value="header-border" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Header Border</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* History Panel Settings */}
        <AccordionItem value="history-panel" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">History Panel Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Show History Panel</Label>
                  <p className="text-xs text-muted-foreground">Enable the chat history panel/sidebar in ChatKit</p>
                </div>
                <Switch
                  checked={(formData as any).chatkitOptions?.history?.enabled !== false}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    chatkitOptions: {
                      ...(formData as any).chatkitOptions,
                      history: {
                        ...(formData as any).chatkitOptions?.history,
                        enabled: checked
                      }
                    }
                  } as any)}
                />
              </div>
              {(formData as any).chatkitOptions?.history?.enabled !== false && (
                <>
                  <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label>Allow Thread Deletion</Label>
                      <p className="text-xs text-muted-foreground">Show delete action for conversation threads</p>
                    </div>
                    <Switch
                      checked={(formData as any).chatkitOptions?.history?.showDelete !== false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...(formData as any).chatkitOptions,
                          history: {
                            ...(formData as any).chatkitOptions?.history,
                            showDelete: checked
                          }
                        }
                      } as any)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label>Allow Thread Renaming</Label>
                      <p className="text-xs text-muted-foreground">Show rename action for conversation threads</p>
                    </div>
                    <Switch
                      checked={(formData as any).chatkitOptions?.history?.showRename !== false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...(formData as any).chatkitOptions,
                          history: {
                            ...(formData as any).chatkitOptions?.history,
                            showRename: checked
                          }
                        }
                      } as any)}
                    />
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
