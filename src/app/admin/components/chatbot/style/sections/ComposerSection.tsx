'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { X, Paperclip, Image, Video, FileText, Star, Wrench } from 'lucide-react'
import type { SectionProps } from './types'

export function ComposerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="composer" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Composer (Input Area)
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Placeholder Text</Label>
            <Input
              value={chatkitOptions?.composer?.placeholder || ''}
              onChange={(e) => setFormData({
                ...formData,
                chatkitOptions: {
                  ...chatkitOptions,
                  composer: {
                    ...chatkitOptions?.composer,
                    placeholder: e.target.value
                  }
                }
              } as any)}
              placeholder="Type your message..."
            />
            <p className="text-xs text-muted-foreground">
              Custom placeholder text for the message input field
            </p>
          </div>
          <div className="space-y-2">
            <Label>Composer Tools</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Add tools/actions to the composer. Select a preset tool type or create a custom button.
            </p>
            <div className="space-y-2">
              {(chatkitOptions?.composer?.tools || []).map((tool: { id?: string; label?: string; icon?: string; pinned?: boolean; type?: string;[key: string]: any }, index: number) => {
                // Determine tool type from existing tool
                const getToolType = () => {
                  if (tool.type === 'file_upload') {
                    if (tool.accept === 'image/*') return 'file_upload_image'
                    if (tool.accept === 'video/*') return 'file_upload_video'
                    if (tool.accept === '.pdf,.doc,.docx') return 'file_upload_document'
                    return 'file_upload_all'
                  }
                  if (tool.type === 'rate' || tool.id === 'rate') return 'rate'
                  if (tool.id === 'file_upload') return 'file_upload_all'
                  return 'custom'
                }
                const toolType = getToolType()

                return (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Tool Type</Label>
                          <Select
                            value={toolType}
                            onValueChange={(v) => {
                              const tools = [...(chatkitOptions?.composer?.tools || [])]
                              let newTool: any = { ...tools[index] }

                              // Auto-fill based on preset
                              if (v === 'file_upload_all') {
                                newTool = {
                                  id: 'file_upload',
                                  label: 'Upload File',
                                  icon: 'paperclip',
                                  type: 'file_upload',
                                  accept: '*/*',
                                  pinned: newTool.pinned || false
                                }
                              } else if (v === 'file_upload_image') {
                                newTool = {
                                  id: 'file_upload_image',
                                  label: 'Upload Image',
                                  icon: 'image',
                                  type: 'file_upload',
                                  accept: 'image/*',
                                  pinned: newTool.pinned || false
                                }
                              } else if (v === 'file_upload_video') {
                                newTool = {
                                  id: 'file_upload_video',
                                  label: 'Upload Video',
                                  icon: 'video',
                                  type: 'file_upload',
                                  accept: 'video/*',
                                  pinned: newTool.pinned || false
                                }
                              } else if (v === 'file_upload_document') {
                                newTool = {
                                  id: 'file_upload_document',
                                  label: 'Upload Document',
                                  icon: 'file-text',
                                  type: 'file_upload',
                                  accept: '.pdf,.doc,.docx,.txt',
                                  pinned: newTool.pinned || false
                                }
                              } else if (v === 'rate') {
                                newTool = {
                                  id: 'rate',
                                  label: 'Rate',
                                  icon: 'star',
                                  type: 'rate',
                                  pinned: newTool.pinned || true
                                }
                              } else if (v === 'custom') {
                                newTool = {
                                  id: newTool.id || '',
                                  label: newTool.label || '',
                                  icon: newTool.icon || '',
                                  type: '',
                                  pinned: newTool.pinned || false
                                }
                              }

                              tools[index] = newTool
                              setFormData({
                                ...formData,
                                chatkitOptions: {
                                  ...chatkitOptions,
                                  composer: {
                                    ...chatkitOptions?.composer,
                                    tools
                                  }
                                }
                              } as any)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="file_upload_all">
                                <div className="flex items-center gap-2">
                                  <Paperclip className="h-4 w-4" />
                                  <span>File Upload (All Files)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="file_upload_image">
                                <div className="flex items-center gap-2">
                                  <Image className="h-4 w-4" />
                                  <span>File Upload (Images Only)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="file_upload_video">
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4" />
                                  <span>File Upload (Videos Only)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="file_upload_document">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span>File Upload (Documents Only)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="rate">
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4" />
                                  <span>Rate/Star</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="custom">
                                <div className="flex items-center gap-2">
                                  <Wrench className="h-4 w-4" />
                                  <span>Custom Button</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {toolType === 'custom' && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Button Label</Label>
                                <Input
                                  value={tool.label || ''}
                                  onChange={(e) => {
                                    const tools = [...(chatkitOptions?.composer?.tools || [])]
                                    tools[index] = { ...tools[index], label: e.target.value, id: tools[index].id || e.target.value.toLowerCase().replace(/\s+/g, '_') }
                                    setFormData({
                                      ...formData,
                                      chatkitOptions: {
                                        ...chatkitOptions,
                                        composer: {
                                          ...chatkitOptions?.composer,
                                          tools
                                        }
                                      }
                                    } as any)
                                  }}
                                  placeholder="e.g., Send Feedback"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Short Label (optional)</Label>
                                <Input
                                  value={tool.shortLabel || ''}
                                  onChange={(e) => {
                                    const tools = [...(chatkitOptions?.composer?.tools || [])]
                                    tools[index] = { ...tools[index], shortLabel: e.target.value }
                                    setFormData({
                                      ...formData,
                                      chatkitOptions: {
                                        ...chatkitOptions,
                                        composer: {
                                          ...chatkitOptions?.composer,
                                          tools
                                        }
                                      }
                                    } as any)
                                  }}
                                  placeholder="e.g., Send"
                                />
                                <p className="text-xs text-muted-foreground">Shorter label for compact display</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Icon Name</Label>
                                <Input
                                  value={tool.icon || ''}
                                  onChange={(e) => {
                                    const tools = [...(chatkitOptions?.composer?.tools || [])]
                                    tools[index] = { ...tools[index], icon: e.target.value }
                                    setFormData({
                                      ...formData,
                                      chatkitOptions: {
                                        ...chatkitOptions,
                                        composer: {
                                          ...chatkitOptions?.composer,
                                          tools
                                        }
                                      }
                                    } as any)
                                  }}
                                  placeholder="e.g., send, heart, thumbs-up"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Placeholder Override (optional)</Label>
                                <Input
                                  value={tool.placeholderOverride || ''}
                                  onChange={(e) => {
                                    const tools = [...(chatkitOptions?.composer?.tools || [])]
                                    tools[index] = { ...tools[index], placeholderOverride: e.target.value }
                                    setFormData({
                                      ...formData,
                                      chatkitOptions: {
                                        ...chatkitOptions,
                                        composer: {
                                          ...chatkitOptions?.composer,
                                          tools
                                        }
                                      }
                                    } as any)
                                  }}
                                  placeholder="Override placeholder for this tool"
                                />
                                <p className="text-xs text-muted-foreground">Custom placeholder when this tool is active</p>
                              </div>
                            </div>
                          </>
                        )}

                        {(toolType === 'file_upload_all' || toolType === 'file_upload_image' || toolType === 'file_upload_video' || toolType === 'file_upload_document') && (
                          <div className="space-y-3">
                            <div className="p-2 bg-muted rounded text-xs text-muted-foreground space-y-2">
                              <p>File upload tool configured. Users can attach files to their messages.</p>
                              {toolType === 'file_upload_image' && <p className="text-xs">Accepts: Images only (image/*)</p>}
                              {toolType === 'file_upload_video' && <p className="text-xs">Accepts: Videos only (video/*)</p>}
                              {toolType === 'file_upload_document' && <p className="text-xs">Accepts: Documents (.pdf, .doc, .docx, .txt)</p>}
                              {toolType === 'file_upload_all' && <p className="text-xs">Accepts: All file types</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Custom Accept Types (optional)</Label>
                                <Input
                                  value={tool.accept || ''}
                                  onChange={(e) => {
                                    const tools = [...(chatkitOptions?.composer?.tools || [])]
                                    tools[index] = { ...tools[index], accept: e.target.value }
                                    setFormData({
                                      ...formData,
                                      chatkitOptions: {
                                        ...chatkitOptions,
                                        composer: {
                                          ...chatkitOptions?.composer,
                                          tools
                                        }
                                      }
                                    } as any)
                                  }}
                                  placeholder="e.g., image/*, video/*, .pdf"
                                />
                                <p className="text-xs text-muted-foreground">Override default accept types</p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Placeholder Override (optional)</Label>
                                <Input
                                  value={tool.placeholderOverride || ''}
                                  onChange={(e) => {
                                    const tools = [...(chatkitOptions?.composer?.tools || [])]
                                    tools[index] = { ...tools[index], placeholderOverride: e.target.value }
                                    setFormData({
                                      ...formData,
                                      chatkitOptions: {
                                        ...chatkitOptions,
                                        composer: {
                                          ...chatkitOptions?.composer,
                                          tools
                                        }
                                      }
                                    } as any)
                                  }}
                                  placeholder="e.g., Drop an image here..."
                                />
                                <p className="text-xs text-muted-foreground">Custom placeholder when tool is active</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Short Label (optional)</Label>
                              <Input
                                value={tool.shortLabel || ''}
                                onChange={(e) => {
                                  const tools = [...(chatkitOptions?.composer?.tools || [])]
                                  tools[index] = { ...tools[index], shortLabel: e.target.value }
                                  setFormData({
                                    ...formData,
                                    chatkitOptions: {
                                      ...chatkitOptions,
                                      composer: {
                                        ...chatkitOptions?.composer,
                                        tools
                                      }
                                    }
                                  } as any)
                                }}
                                placeholder="e.g., Upload"
                              />
                              <p className="text-xs text-muted-foreground">Shorter label for compact display</p>
                            </div>
                          </div>
                        )}

                        {toolType === 'rate' && (
                          <div className="space-y-3">
                            <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
                              <p>Rating tool configured. Users can rate conversations with a star button.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Short Label (optional)</Label>
                                <Input
                                  value={tool.shortLabel || ''}
                                  onChange={(e) => {
                                    const tools = [...(chatkitOptions?.composer?.tools || [])]
                                    tools[index] = { ...tools[index], shortLabel: e.target.value }
                                    setFormData({
                                      ...formData,
                                      chatkitOptions: {
                                        ...chatkitOptions,
                                        composer: {
                                          ...chatkitOptions?.composer,
                                          tools
                                        }
                                      }
                                    } as any)
                                  }}
                                  placeholder="e.g., Rate"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Placeholder Override (optional)</Label>
                                <Input
                                  value={tool.placeholderOverride || ''}
                                  onChange={(e) => {
                                    const tools = [...(chatkitOptions?.composer?.tools || [])]
                                    tools[index] = { ...tools[index], placeholderOverride: e.target.value }
                                    setFormData({
                                      ...formData,
                                      chatkitOptions: {
                                        ...chatkitOptions,
                                        composer: {
                                          ...chatkitOptions?.composer,
                                          tools
                                        }
                                      }
                                    } as any)
                                  }}
                                  placeholder="Override placeholder for this tool"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const tools = [...(chatkitOptions?.composer?.tools || [])]
                          tools.splice(index, 1)
                          setFormData({
                            ...formData,
                            chatkitOptions: {
                              ...chatkitOptions,
                              composer: {
                                ...chatkitOptions?.composer,
                                tools
                              }
                            }
                          } as any)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Label className="text-xs">Pin to Composer</Label>
                      <Switch
                        checked={tool.pinned || false}
                        onCheckedChange={(checked) => {
                          const tools = [...(chatkitOptions?.composer?.tools || [])]
                          tools[index] = { ...tools[index], pinned: checked }
                          setFormData({
                            ...formData,
                            chatkitOptions: {
                              ...chatkitOptions,
                              composer: {
                                ...chatkitOptions?.composer,
                                tools
                              }
                            }
                          } as any)
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const tools = [...(chatkitOptions?.composer?.tools || []), { type: 'custom', id: '', label: '', icon: '', pinned: false }]
                  setFormData({
                    ...formData,
                    chatkitOptions: {
                      ...chatkitOptions,
                      composer: {
                        ...chatkitOptions?.composer,
                        tools
                      }
                    }
                  } as any)
                }}
              >
                + Add Tool
              </Button>
            </div>
          </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

