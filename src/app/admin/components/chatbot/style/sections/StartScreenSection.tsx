'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { X } from 'lucide-react'
import type { SectionProps } from './types'

export function StartScreenSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="startScreen" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Start Screen
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
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
              Add quick prompt buttons that appear when the chat starts. Supports name, label, prompt, and icon.
            </p>
            <div className="space-y-2">
              {(chatkitOptions?.startScreen?.prompts || []).map((prompt: { name?: string; label?: string; prompt: string; icon?: string }, index: number) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Name (optional)</Label>
                        <Input
                          value={prompt.name || ''}
                          onChange={(e) => {
                            const prompts = [...(chatkitOptions?.startScreen?.prompts || [])]
                            prompts[index] = { ...prompts[index], name: e.target.value }
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
                          placeholder="Name"
                        />
                      </div>
                      <div className="space-y-1">
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
                      <Select
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
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Bot">Bot</SelectItem>
                          <SelectItem value="MessageCircle">Message Circle</SelectItem>
                          <SelectItem value="Zap">Zap / Bolt</SelectItem>
                          <SelectItem value="Star">Star</SelectItem>
                          <SelectItem value="Heart">Heart</SelectItem>
                          <SelectItem value="ThumbsUp">Thumbs Up</SelectItem>
                          <SelectItem value="HelpCircle">Help Circle</SelectItem>
                          <SelectItem value="Info">Info</SelectItem>
                          <SelectItem value="Lightbulb">Lightbulb</SelectItem>
                          <SelectItem value="Rocket">Rocket</SelectItem>
                          <SelectItem value="Sparkles">Sparkles</SelectItem>
                          <SelectItem value="Wand2">Wand</SelectItem>
                          <SelectItem value="Search">Search</SelectItem>
                          <SelectItem value="Settings">Settings</SelectItem>
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Users">Users</SelectItem>
                          <SelectItem value="ShoppingCart">Shopping Cart</SelectItem>
                          <SelectItem value="Calendar">Calendar</SelectItem>
                          <SelectItem value="Mail">Mail</SelectItem>
                          <SelectItem value="Phone">Phone</SelectItem>
                          <SelectItem value="MapPin">Map Pin</SelectItem>
                          <SelectItem value="FileText">File Text</SelectItem>
                          <SelectItem value="Image">Image</SelectItem>
                          <SelectItem value="Video">Video</SelectItem>
                          <SelectItem value="Music">Music</SelectItem>
                          <SelectItem value="Download">Download</SelectItem>
                          <SelectItem value="Upload">Upload</SelectItem>
                          <SelectItem value="Share">Share</SelectItem>
                          <SelectItem value="Bookmark">Bookmark</SelectItem>
                          <SelectItem value="Flag">Flag</SelectItem>
                          <SelectItem value="Bell">Bell</SelectItem>
                          <SelectItem value="Home">Home</SelectItem>
                          <SelectItem value="Menu">Menu</SelectItem>
                          <SelectItem value="MoreHorizontal">More</SelectItem>
                        </SelectContent>
                      </Select>
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
      </AccordionContent>
    </AccordionItem>
  )
}

