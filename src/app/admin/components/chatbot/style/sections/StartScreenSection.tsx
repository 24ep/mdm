'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { SectionProps } from './types'

// ChatKit Icon Select Component - Only shows ChatKit-supported icons (no search)
function ChatKitIconSelect({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
  // Valid ChatKit icon names (from ChatKit documentation)
  const validChatKitIcons = [
    'agent', 'analytics', 'atom', 'bolt', 'book-open', 'calendar', 'chart', 'check', 'check-circle',
    'chevron-left', 'chevron-right', 'circle-question', 'compass', 'confetti', 'cube', 'document',
    'dots-horizontal', 'empty-circle', 'globe', 'keys', 'lab', 'images', 'info', 'lifesaver',
    'lightbulb', 'mail', 'map-pin', 'maps', 'name', 'notebook', 'notebook-pencil', 'page-blank',
    'phone', 'plus', 'profile', 'profile-card', 'star', 'star-filled', 'search', 'sparkle',
    'sparkle-double', 'square-code', 'square-image', 'square-text', 'suitcase', 'settings-slider',
    'user', 'wreath', 'write', 'write-alt', 'write-alt2', 'bug'
  ]

  const getIconLabel = (iconName: string) => {
    if (iconName === 'none') return 'None'
    return iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onValueChange(val === 'none' ? '' : val)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select icon" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {validChatKitIcons.map((iconName) => (
          <SelectItem key={iconName} value={iconName}>
            {getIconLabel(iconName)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function StartScreenSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-4 px-4 space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Greeting Message</Label>
          <Textarea
            value={chatkitOptions?.startScreen?.greeting || ''}
            onChange={(e) => setFormData({
              ...formData,
              chatkitOptions: {
                ...chatkitOptions,
                startScreen: {
                  ...chatkitOptions?.startScreen,
                  greeting: e.target.value
                }
              }
            } as any)}
            placeholder="Hello! How can I help you today?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Start Screen Prompts</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Add quick prompt buttons that appear when the chat starts. ChatKit supports <strong>label</strong> and <strong>prompt</strong> properties only.
          </p>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-200 mb-2">
            <strong>Note:</strong> "Icon" is supported but must be a valid ChatKitIcon value (e.g., "lightbulb", "star", "search", "bolt", etc.).
          </div>
          <div className="space-y-2">
            {(chatkitOptions?.startScreen?.prompts || []).map((prompt: { name?: string; label?: string; prompt: string; icon?: string }, index: number) => (
              <div key={index} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Label (optional)</Label>
                    <Input
                      value={prompt.label || ''}
                      onChange={(e) => {
                        const prompts = [...(chatkitOptions?.startScreen?.prompts || [])]
                        prompts[index] = { ...prompts[index], label: e.target.value }
                        setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            startScreen: {
                              ...chatkitOptions?.startScreen,
                              prompts
                            }
                          }
                        } as any)
                      }}
                      placeholder="Button Label"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const prompts = [...(chatkitOptions?.startScreen?.prompts || [])]
                      prompts.splice(index, 1)
                      setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...chatkitOptions,
                          startScreen: {
                            ...chatkitOptions?.startScreen,
                            prompts
                          }
                        }
                      } as any)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Prompt Text (required)</Label>
                    <Input
                      value={prompt.prompt || ''}
                      onChange={(e) => {
                        const prompts = [...(chatkitOptions?.startScreen?.prompts || [])]
                        prompts[index] = { ...prompts[index], prompt: e.target.value }
                        setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            startScreen: {
                              ...chatkitOptions?.startScreen,
                              prompts
                            }
                          }
                        } as any)
                      }}
                      placeholder="Prompt Text"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Icon (optional)</Label>
                    <ChatKitIconSelect
                      value={prompt.icon || 'none'}
                      onValueChange={(value) => {
                        const prompts = [...(chatkitOptions?.startScreen?.prompts || [])]
                        prompts[index] = { ...prompts[index], icon: value === 'none' ? undefined : value }
                        setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            startScreen: {
                              ...chatkitOptions?.startScreen,
                              prompts
                            }
                          }
                        } as any)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prompts = [...(chatkitOptions?.startScreen?.prompts || []), { prompt: '' }]
                setFormData({
                  ...formData,
                  chatkitOptions: {
                    ...chatkitOptions,
                    startScreen: {
                      ...chatkitOptions?.startScreen,
                      prompts
                    }
                  }
                } as any)
              }}
            >
              + Add Prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
