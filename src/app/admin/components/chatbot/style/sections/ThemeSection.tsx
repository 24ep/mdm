'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { SectionProps } from './types'

export function ThemeSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="theme" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Theme
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <Accordion type="multiple">
          {/* Basic Theme Settings */}
          <AccordionItem value="basic-settings" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
              Basic Settings
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color Scheme</Label>
                    <Select
                      value={chatkitOptions?.theme?.colorScheme || 'light'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...chatkitOptions,
                          theme: {
                            ...chatkitOptions?.theme,
                            colorScheme: v as 'light' | 'dark' | 'system'
                          }
                        }
                      } as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System (Auto)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      "System" auto-detects user's browser/device preference
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Corner Radius</Label>
                    <Select
                      value={chatkitOptions?.theme?.radius || 'round'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...chatkitOptions,
                          theme: {
                            ...chatkitOptions?.theme,
                            radius: v as 'pill' | 'round' | 'soft' | 'sharp'
                          }
                        }
                      } as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pill">Pill</SelectItem>
                        <SelectItem value="round">Round</SelectItem>
                        <SelectItem value="soft">Soft</SelectItem>
                        <SelectItem value="sharp">Sharp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Density</Label>
                    <Select
                      value={chatkitOptions?.theme?.density || 'normal'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...chatkitOptions,
                          theme: {
                            ...chatkitOptions?.theme,
                            density: v as 'compact' | 'normal' | 'spacious'
                          }
                        }
                      } as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Colors Section */}
          <AccordionItem value="colors" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
              Colors
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                {/* Accent Color */}
                <div className="space-y-2">
                  <Label>Accent Color (Primary)</Label>
                  <ColorInput
                    value={chatkitOptions?.theme?.color?.accent?.primary || chatkitOptions?.theme?.primaryColor || '#3b82f6'}
                    onChange={(color) => {
                      const theme = chatkitOptions?.theme || {}
                      setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...chatkitOptions,
                          theme: {
                            ...theme,
                            color: {
                              ...theme.color,
                              accent: {
                                ...theme.color?.accent,
                                primary: color
                              }
                            },
                            // Legacy support
                            primaryColor: color
                          }
                        }
                      } as any)
                    }}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#3b82f6"
                    inputClassName="h-8 text-xs pl-7"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Accent Color Intensity (0-4)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="4"
                    value={chatkitOptions?.theme?.color?.accent?.level ?? 2}
                    onChange={(e) => {
                      const theme = chatkitOptions?.theme || {}
                      setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...chatkitOptions,
                          theme: {
                            ...theme,
                            color: {
                              ...theme.color,
                              accent: {
                                ...theme.color?.accent,
                                level: parseInt(e.target.value) || 2
                              }
                            }
                          }
                        }
                      } as any)
                    }}
                    placeholder="2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls the intensity of the accent color (0 = subtle, 4 = vibrant)
                  </p>
                </div>

                {/* Icon Color */}
                <div className="space-y-2">
                  <Label>Icon Color</Label>
                  <p className="text-xs text-muted-foreground">
                    Color for icons (if different from accent color)
                  </p>
                  <ColorInput
                    value={chatkitOptions?.theme?.color?.accent?.icon || chatkitOptions?.theme?.color?.accent?.primary || chatkitOptions?.theme?.primaryColor || '#3b82f6'}
                    onChange={(color) => {
                      const theme = chatkitOptions?.theme || {}
                      setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...chatkitOptions,
                          theme: {
                            ...theme,
                            color: {
                              ...theme.color,
                              accent: {
                                ...theme.color?.accent,
                                icon: color
                              }
                            }
                          }
                        }
                      } as any)
                    }}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#3b82f6"
                    inputClassName="h-8 text-xs pl-7"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use accent color for icons
                  </p>
                </div>

                {/* Additional Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Background Color (optional)</Label>
                    <ColorInput
                      value={chatkitOptions?.theme?.color?.background || chatkitOptions?.theme?.backgroundColor || '#ffffff'}
                      onChange={(color) => {
                        const theme = chatkitOptions?.theme || {}
                        setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            theme: {
                              ...theme,
                              color: {
                                ...theme.color,
                                background: color
                              },
                              backgroundColor: color
                            }
                          }
                        } as any)
                      }}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#ffffff"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Text Color (optional)</Label>
                    <ColorInput
                      value={chatkitOptions?.theme?.color?.text || chatkitOptions?.theme?.textColor || '#000000'}
                      onChange={(color) => {
                        const theme = chatkitOptions?.theme || {}
                        setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            theme: {
                              ...theme,
                              color: {
                                ...theme.color,
                                text: color
                              },
                              textColor: color
                            }
                          }
                        } as any)
                      }}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#000000"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Secondary Color (optional)</Label>
                    <ColorInput
                      value={chatkitOptions?.theme?.color?.secondary || chatkitOptions?.theme?.secondaryColor || '#6b7280'}
                      onChange={(color) => {
                        const theme = chatkitOptions?.theme || {}
                        setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            theme: {
                              ...theme,
                              color: {
                                ...theme.color,
                                secondary: color
                              },
                              secondaryColor: color
                            }
                          }
                        } as any)
                      }}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#6b7280"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Border Color (optional)</Label>
                    <ColorInput
                      value={chatkitOptions?.theme?.color?.border || '#e5e7eb'}
                      onChange={(color) => {
                        const theme = chatkitOptions?.theme || {}
                        setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            theme: {
                              ...theme,
                              color: {
                                ...theme.color,
                                border: color
                              }
                            }
                          }
                        } as any)
                      }}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Surface Background (optional)</Label>
                    <ColorInput
                      value={chatkitOptions?.theme?.color?.surface?.background || (typeof chatkitOptions?.theme?.color?.surface === 'string' ? chatkitOptions.theme.color.surface : '#f9fafb')}
                      onChange={(color) => {
                        const theme = chatkitOptions?.theme || {}
                        const currentSurface = theme.color?.surface || {}
                        setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            theme: {
                              ...theme,
                              color: {
                                ...theme.color,
                                surface: {
                                  ...(typeof currentSurface === 'object' ? currentSurface : {}),
                                  background: color
                                }
                              }
                            }
                          }
                        } as any)
                      }}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#f9fafb"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Surface Foreground (optional)</Label>
                    <ColorInput
                      value={chatkitOptions?.theme?.color?.surface?.foreground || '#000000'}
                      onChange={(color) => {
                        const theme = chatkitOptions?.theme || {}
                        const currentSurface = theme.color?.surface || {}
                        setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            theme: {
                              ...theme,
                              color: {
                                ...theme.color,
                                surface: {
                                  ...(typeof currentSurface === 'object' ? currentSurface : {}),
                                  foreground: color
                                }
                              }
                            }
                          }
                        } as any)
                      }}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#000000"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Typography Section */}
          <AccordionItem value="typography" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
              Typography
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select
                      value={chatkitOptions?.theme?.typography?.fontFamily || 'Inter, sans-serif'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...chatkitOptions,
                          theme: {
                            ...chatkitOptions?.theme,
                            typography: {
                              ...chatkitOptions?.theme?.typography,
                              fontFamily: v
                            }
                          }
                        }
                      } as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font family" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                        <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                        <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                        <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                        <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                        <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                        <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                        <SelectItem value="Source Sans Pro, sans-serif">Source Sans Pro</SelectItem>
                        <SelectItem value="Nunito, sans-serif">Nunito</SelectItem>
                        <SelectItem value="Raleway, sans-serif">Raleway</SelectItem>
                        <SelectItem value="Ubuntu, sans-serif">Ubuntu</SelectItem>
                        <SelectItem value="Outfit, sans-serif">Outfit</SelectItem>
                        <SelectItem value="Work Sans, sans-serif">Work Sans</SelectItem>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                        <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                        <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select a font family for the chat interface
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size (optional)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={chatkitOptions?.theme?.typography?.fontSize || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            theme: {
                              ...chatkitOptions?.theme,
                              typography: {
                                ...chatkitOptions?.theme?.typography,
                                fontSize: e.target.value ? parseFloat(e.target.value) : undefined
                              }
                            }
                          }
                        } as any)}
                        placeholder="16"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Weight (optional)</Label>
                    <Select
                      value={chatkitOptions?.theme?.typography?.fontWeight
                        ? String(chatkitOptions.theme.typography.fontWeight)
                        : 'default'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        chatkitOptions: {
                          ...chatkitOptions,
                          theme: {
                            ...chatkitOptions?.theme,
                            typography: {
                              ...chatkitOptions?.theme?.typography,
                              fontWeight: v === 'default' ? undefined : (isNaN(Number(v)) ? v : Number(v))
                            }
                          }
                        }
                      } as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="100">100 (Thin)</SelectItem>
                        <SelectItem value="200">200 (Extra Light)</SelectItem>
                        <SelectItem value="300">300 (Light)</SelectItem>
                        <SelectItem value="400">400 (Normal)</SelectItem>
                        <SelectItem value="500">500 (Medium)</SelectItem>
                        <SelectItem value="600">600 (Semi Bold)</SelectItem>
                        <SelectItem value="700">700 (Bold)</SelectItem>
                        <SelectItem value="800">800 (Extra Bold)</SelectItem>
                        <SelectItem value="900">900 (Black)</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Line Height (optional)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        value={chatkitOptions?.theme?.typography?.lineHeight || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            theme: {
                              ...chatkitOptions?.theme,
                              typography: {
                                ...chatkitOptions?.theme?.typography,
                                lineHeight: e.target.value ? parseFloat(e.target.value) : undefined
                              }
                            }
                          }
                        } as any)}
                        placeholder="1.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Letter Spacing (optional)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        value={chatkitOptions?.theme?.typography?.letterSpacing || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          chatkitOptions: {
                            ...chatkitOptions,
                            theme: {
                              ...chatkitOptions?.theme,
                              typography: {
                                ...chatkitOptions?.theme?.typography,
                                letterSpacing: e.target.value ? parseFloat(e.target.value) : undefined
                              }
                            }
                          }
                        } as any)}
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">em</span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  )
}

