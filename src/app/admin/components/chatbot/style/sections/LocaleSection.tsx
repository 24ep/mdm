'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'

export function LocaleSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <div className="py-4 px-4 space-y-4">
      <FormSection>
        <FormRow label="Language" description="Interface language for the chat">
          <Select
            value={chatkitOptions?.locale || 'en'}
            onValueChange={(v) => setFormData({
              ...formData,
              chatkitOptions: {
                ...chatkitOptions,
                locale: v
              }
            } as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
              <SelectItem value="th">Thai</SelectItem>
            </SelectContent>
          </Select>
        </FormRow>
      </FormSection>
    </div>
  )
}
