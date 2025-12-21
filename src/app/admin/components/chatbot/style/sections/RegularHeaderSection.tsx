'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

import { X } from 'lucide-react'
import type { Chatbot } from '../../types'

interface RegularHeaderSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  chatkitOptions?: any
}

export function RegularHeaderSection({ formData, setFormData, chatkitOptions }: RegularHeaderSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Header</h3>
      </div>
      <div className="pt-2">
        <div className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-md font-semibold">Header Styling</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Configure the header appearance, title, description, logo, and custom buttons.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-semibold mb-2">Header Title & Description</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Configure the header title and description. These can be simple strings or objects for more advanced styling.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Header Title</Label>
                <Input
                  value={chatkitOptions?.header?.title
                    ? (typeof chatkitOptions.header.title === 'string'
                      ? chatkitOptions.header.title
                      : (chatkitOptions.header.title as any)?.text || formData.headerTitle || '')
                    : formData.headerTitle || ''}
                  onChange={(e) => {
                    const titleValue = e.target.value
                    setFormData({
                      ...formData,
                      headerTitle: titleValue,
                      chatkitOptions: {
                        ...chatkitOptions,
                        header: {
                          ...chatkitOptions?.header,
                          title: titleValue || undefined
                        }
                      }
                    } as any)
                  }}
                  placeholder="Chat Assistant"
                />
                <p className="text-xs text-muted-foreground">
                  Title displayed in the header
                </p>
              </div>
              <div className="space-y-2">
                <Label>Header Description</Label>
                <Input
                  value={chatkitOptions?.header?.description
                    ? (typeof chatkitOptions.header.description === 'string'
                      ? chatkitOptions.header.description
                      : (chatkitOptions.header.description as any)?.text || formData.headerDescription || '')
                    : formData.headerDescription || ''}
                  onChange={(e) => {
                    const descValue = e.target.value
                    setFormData({
                      ...formData,
                      headerDescription: descValue,
                      chatkitOptions: {
                        ...chatkitOptions,
                        header: {
                          ...chatkitOptions?.header,
                          description: descValue || undefined
                        }
                      }
                    } as any)
                  }}
                  placeholder="How can I help you?"
                />
                <p className="text-xs text-muted-foreground">
                  Description/subtitle displayed in the header
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-semibold mb-2">Header Logo</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Logo displayed in the header (separate from avatar)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Header Logo URL</Label>
                <Input
                  value={formData.headerLogo || chatkitOptions?.header?.logo || ''}
                  onChange={(e) => {
                    const logoValue = e.target.value
                    setFormData({
                      ...formData,
                      headerLogo: logoValue,
                      chatkitOptions: {
                        ...chatkitOptions,
                        header: {
                          ...chatkitOptions?.header,
                          logo: logoValue
                        }
                      }
                    } as any)
                  }}
                  placeholder="https://example.com/logo.png"
                />
              </div>
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
                      setFormData({
                        ...formData,
                        headerLogo: url,
                        chatkitOptions: {
                          ...chatkitOptions,
                          header: {
                            ...chatkitOptions?.header,
                            logo: url
                          }
                        }
                      } as any)
                    }
                    reader.readAsDataURL(file)
                  }}
                />
              </div>
            </div>
            {(formData.headerLogo || chatkitOptions?.header?.logo) && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 flex items-center justify-center bg-muted/50">
                  <img
                    src={formData.headerLogo || chatkitOptions?.header?.logo || undefined}
                    alt="Header logo preview"
                    className="max-w-full max-h-32 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h4 className="text-md font-semibold mb-4">Header Custom Buttons</h4>
            <p className="text-xs text-muted-foreground mb-2">
              Add custom buttons to the header. These buttons will appear in the header area.
            </p>
            <div className="space-y-2">
              {(chatkitOptions?.header?.customButtonLeft || []).map((button: { icon?: string; label?: string }, index: number) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Button Label</Label>
                        <Input
                          value={button.label || ''}
                          onChange={(e) => {
                            const buttons = [...(chatkitOptions?.header?.customButtonLeft || [])]
                            buttons[index] = { ...buttons[index], label: e.target.value }
                            setFormData({
                              ...formData,
                              chatkitOptions: {
                                ...chatkitOptions,
                                header: {
                                  ...chatkitOptions?.header,
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
                            const buttons = [...(chatkitOptions?.header?.customButtonLeft || [])]
                            buttons[index] = { ...buttons[index], icon: e.target.value }
                            setFormData({
                              ...formData,
                              chatkitOptions: {
                                ...chatkitOptions,
                                header: {
                                  ...chatkitOptions?.header,
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
                        const buttons = [...(chatkitOptions?.header?.customButtonLeft || [])]
                        buttons.splice(index, 1)
                        setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            header: {
                              ...chatkitOptions?.header,
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
                  const buttons = [...(chatkitOptions?.header?.customButtonLeft || []), { icon: '', label: '' }]
                  setFormData({
                    ...formData,
                    chatkitOptions: {
                      ...chatkitOptions,
                      header: {
                        ...chatkitOptions?.header,
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
      </div>
    </div>
  )
}
