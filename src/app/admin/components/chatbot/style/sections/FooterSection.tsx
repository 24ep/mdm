'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { SectionProps } from './types'

export function FooterSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="footer" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Footer
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-md font-semibold">Footer Styling</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Configure the footer area styling and appearance.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-md font-semibold mb-4">Input Field Styling</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Customize the input field appearance in the footer area.
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

