'use client'

import { Input } from '@/components/ui/input'
import * as LucideIcons from 'lucide-react'
import { Chatbot } from './types'

interface ChatbotHeaderProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatbotHeader({ formData, setFormData }: ChatbotHeaderProps) {
  const avatarType = (formData.avatarType || 'icon') as 'icon' | 'image'
  
  return (
    <div className="flex items-start gap-4">
      {/* Avatar/Icon preview */}
      {avatarType === 'image' && formData.avatarImageUrl ? (
        <img
          src={formData.avatarImageUrl}
          alt={formData.name || 'Avatar'}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: (formData.avatarBackgroundColor || formData.primaryColor || '#3b82f6') as string }}
        >
          {(() => {
            const IconName = (formData.avatarIcon || 'Bot') as string
            const IconComponent = (LucideIcons as any)[IconName] || LucideIcons.Bot
            const iconColor = formData.avatarIconColor || '#ffffff'
            return <IconComponent className="h-6 w-6" style={{ color: iconColor as string }} />
          })()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <Input
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Agent name"
          className="text-2xl font-bold h-auto py-0 border-none shadow-none focus-visible:ring-0 px-0"
        />
        {formData.description ? (
          <p className="text-sm text-muted-foreground mt-1 truncate">{formData.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1 italic">No description</p>
        )}
      </div>
    </div>
  )
}

