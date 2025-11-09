'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { SectionProps } from './types'

export function ThemeSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="theme" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Theme
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-6">
          {/* Basic Theme Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold">Basic Settings</h4>
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
                        colorScheme: v as 'light' | 'dark'
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
                  </SelectContent>
                </Select>
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

          {/* Colors Section */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-md font-semibold">Colors</h4>
            
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

          {/* Typography Section */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-md font-semibold">Typography</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Input
                  value={chatkitOptions?.theme?.typography?.fontFamily || 'Inter, sans-serif'}
                  onChange={(e) => setFormData({
                    ...formData,
                    chatkitOptions: {
                      ...chatkitOptions,
                      theme: {
                        ...chatkitOptions?.theme,
                        typography: {
                          ...chatkitOptions?.theme?.typography,
                          fontFamily: e.target.value
                        }
                      }
                    }
                  } as any)}
                  placeholder="Inter, sans-serif"
                />
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
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
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
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

