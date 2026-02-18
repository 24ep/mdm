'use client'

import React from 'react'
import * as Icons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatbotConfig } from '../types'

interface GetStartedScreenProps {
  chatbot: ChatbotConfig
  onStart: () => void
}

export function GetStartedScreen({ chatbot, onStart }: GetStartedScreenProps) {
  const IconComp = (Icons as any)[chatbot.getStartedIcon || 'Bot'] || Icons.Bot

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 overflow-y-auto min-h-full">
      <div 
        className="p-4 rounded-full" 
        style={{ 
          backgroundColor: chatbot.primaryColor + '20',
          color: chatbot.primaryColor
        }}
      >
        <IconComp className="h-12 w-12" />
      </div>

      <div className="space-y-2">
        <h1 
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: chatbot.fontFamily }}
        >
          {chatbot.getStartedTitle || 'Welcome to Chat'}
        </h1>
        {chatbot.getStartedSubtitle && (
          <p 
            className="text-lg font-medium opacity-80"
            style={{ fontFamily: chatbot.fontFamily }}
          >
            {chatbot.getStartedSubtitle}
          </p>
        )}
      </div>

      {chatbot.getStartedDescription && (
        <p 
          className="text-sm text-muted-foreground max-w-sm"
          style={{ fontFamily: chatbot.fontFamily }}
        >
          {chatbot.getStartedDescription}
        </p>
      )}

      <Button
        size="lg"
        className="w-full max-w-xs mt-4"
        style={{
          backgroundColor: chatbot.primaryColor,
          color: chatbot.userMessageFontColor || '#ffffff',
          borderRadius: chatbot.borderRadius,
          fontFamily: chatbot.fontFamily
        }}
        onClick={onStart}
      >
        {chatbot.getStartedButtonText || 'Get Started'}
      </Button>
    </div>
  )
}
