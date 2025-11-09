'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertCircle } from 'lucide-react'
import type { SectionProps } from './types'

export function DisclaimerSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="disclaimer" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Disclaimer
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Add a disclaimer text that will be displayed in the ChatKit interface. This is useful for legal notices, terms of service, or important information users should be aware of.
          </p>

          <div className="space-y-2">
            <Label>Disclaimer Text</Label>
            <Textarea
              value={chatkitOptions?.disclaimer?.text || ''}
              onChange={(e) => setFormData({
                ...formData,
                chatkitOptions: {
                  ...chatkitOptions,
                  disclaimer: {
                    ...chatkitOptions?.disclaimer,
                    text: e.target.value
                  }
                }
              } as any)}
              placeholder="Enter disclaimer text (e.g., 'This AI assistant is for informational purposes only...')"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to hide the disclaimer. The text will be displayed in the ChatKit interface.
            </p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> The disclaimer will be displayed by ChatKit according to its default styling and positioning. The exact appearance may vary based on the ChatKit version.
              </p>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

