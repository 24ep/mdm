'use client'

import * as LucideIcons from 'lucide-react'
import { Chatbot } from './types'

interface ChatbotAvatarProps {
  chatbot: Chatbot
  size?: 'sm' | 'md' | 'lg'
}

export function ChatbotAvatar({ chatbot, size = 'md' }: ChatbotAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }
  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }
  
  const avatarType = (chatbot.avatarType || 'icon') as 'icon' | 'image'
  if (avatarType === 'image' && chatbot.avatarImageUrl) {
    return (
      <img
        src={chatbot.avatarImageUrl}
        alt={chatbot.name || 'Avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  const IconName = (chatbot.avatarIcon || 'Bot') as string
  const IconComponent = (LucideIcons as any)[IconName] || LucideIcons.Bot
  const iconColor = chatbot.avatarIconColor || '#ffffff'
  const bgColor = chatbot.avatarBackgroundColor || chatbot.primaryColor || '#3b82f6'
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor: bgColor as string }}
    >
      <IconComponent className={iconSizeClasses[size]} style={{ color: iconColor as string }} />
    </div>
  )
}

