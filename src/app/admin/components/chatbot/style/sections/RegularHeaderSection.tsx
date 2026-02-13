'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { X } from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { SectionGroup } from '../components/SectionGroup'
import { FormRow, FormSection } from '../components/FormRow'

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
        <SectionGroup title="Header Styling" isFirst>
          <FormSection>
            <FormRow label="Show Header" description="Show header in chat widget and full page">
              <Switch
                checked={formData.headerEnabled !== false}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    headerEnabled: checked
                  })
                }}
              />
            </FormRow>
          </FormSection>
        </SectionGroup>

        <SectionGroup title="Header Action Buttons">
          <FormSection>
            <FormRow label="Clear Button" description="Show clear session button">
              <Switch
                checked={formData.headerShowClearSession !== false}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    headerShowClearSession: checked
                  })
                }}
              />
            </FormRow>
            <FormRow label="Close Button" description="Show close chat button">
              <Switch
                checked={formData.headerShowCloseButton !== false}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    headerShowCloseButton: checked
                  })
                }}
              />
            </FormRow>
          </FormSection>
        </SectionGroup>

        {/* Close Button Styling */}
        {formData.headerShowCloseButton !== false && (
          <SectionGroup title="Close Button Styling">
            <FormSection>
              <FormRow label="Background Color" description="Background color for the close button (leave empty for transparent)">
                <ColorInput
                  value={formData.headerCloseButtonBackgroundColor || ''}
                  onChange={(color) => {
                    setFormData({
                      ...formData,
                      headerCloseButtonBackgroundColor: color
                    })
                  }}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="transparent"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
              <FormRow label="Icon Color" description="Color of the X icon (defaults to header font color)">
                <ColorInput
                  value={formData.headerCloseButtonIconColor || ''}
                  onChange={(color) => {
                    setFormData({
                      ...formData,
                      headerCloseButtonIconColor: color
                    })
                  }}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="white"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
              <FormRow label="Hover Background" description="Background color on hover">
                <ColorInput
                  value={formData.headerCloseButtonHoverBackgroundColor || ''}
                  onChange={(color) => {
                    setFormData({
                      ...formData,
                      headerCloseButtonHoverBackgroundColor: color
                    })
                  }}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="rgba(255, 255, 255, 0.1)"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
            </FormSection>
          </SectionGroup>
        )}

        <SectionGroup title="Header Title & Description">
          <FormSection>
            <FormRow label="Header Title" description="Title displayed in the header">
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
            </FormRow>
            <FormRow label="Header Description" description="Description/subtitle displayed in the header">
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
            </FormRow>
          </FormSection>
        </SectionGroup>

        <SectionGroup title="Header Logo">
          <FormSection>
            <FormRow label="Logo URL" description="URL to the header logo image">
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
            </FormRow>
            <FormRow label="Upload Logo" description="Or upload a logo file">
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
            </FormRow>
            {(formData.headerLogo || chatkitOptions?.header?.logo) && (
              <FormRow label="Preview" description="Current logo preview">
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
              </FormRow>
            )}
          </FormSection>
        </SectionGroup>

        <SectionGroup title="Header Custom Buttons">
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
        </SectionGroup>
      </div>
    </div>
  )
}
