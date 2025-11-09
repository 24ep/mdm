'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Cpu } from 'lucide-react'
import type { SectionProps } from './types'

export function ModelPickerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="modelPicker" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Model Picker
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Enable the model picker to allow users to select different AI models during the conversation. This gives users control over which model powers their chat experience.
          </p>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <Label>Enable Model Picker</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Show a model selection interface that allows users to switch between available AI models
              </p>
            </div>
            <Switch
              checked={chatkitOptions?.modelPicker?.enabled ?? false}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                chatkitOptions: {
                  ...chatkitOptions,
                  modelPicker: {
                    ...chatkitOptions?.modelPicker,
                    enabled: checked
                  }
                }
              } as any)}
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> The available models will be determined by your ChatKit agent configuration. Users will only see models that are available for your agent.
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

