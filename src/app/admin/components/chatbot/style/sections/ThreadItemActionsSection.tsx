'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react'
import type { SectionProps } from './types'

export function ThreadItemActionsSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="threadItemActions" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Message Actions (Like, Dislike, Retry)
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Configure which action buttons appear on chat messages. These buttons allow users to provide feedback and retry messages.
          </p>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                <Label>Feedback (Like/Dislike)</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Show like and dislike buttons on messages to collect user feedback
              </p>
            </div>
            <Switch
              checked={chatkitOptions?.threadItemActions?.feedback ?? false}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                chatkitOptions: {
                  ...chatkitOptions,
                  threadItemActions: {
                    ...chatkitOptions?.threadItemActions,
                    feedback: checked
                  }
                }
              } as any)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                <Label>Retry</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Show retry button on messages to allow users to regenerate responses
              </p>
            </div>
            <Switch
              checked={chatkitOptions?.threadItemActions?.retry ?? false}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                chatkitOptions: {
                  ...chatkitOptions,
                  threadItemActions: {
                    ...chatkitOptions?.threadItemActions,
                    retry: checked
                  }
                }
              } as any)}
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> These settings only apply when using the ChatKit widget. For custom chat UI, these features would need to be implemented separately.
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

