'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { SectionProps } from './types'

export function EntitiesSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="entities" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Entities (Tags & Mentions)
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground mb-2">
            Configure entity search and preview functionality. These require code implementation for handlers.
          </p>
          <div className="space-y-2">
            <Label>Enable Entity Search</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable tag/mention search functionality</span>
              <Switch
                checked={!!chatkitOptions?.entities}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  chatkitOptions: {
                    ...chatkitOptions,
                    entities: checked ? {
                      onTagSearch: undefined,
                      onRequestPreview: undefined
                    } : undefined
                  }
                } as any)}
              />
            </div>
            {chatkitOptions?.entities && (
              <div className="p-3 bg-muted rounded text-sm text-muted-foreground space-y-2">
                <p>Entity handlers must be implemented in code:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><code className="text-xs">onTagSearch(query: string)</code> - Search for entities</li>
                  <li><code className="text-xs">onRequestPreview(entity: any)</code> - Generate entity preview</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

