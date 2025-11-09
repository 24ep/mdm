'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Message, ChatbotConfig } from '../types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import * as LucideIcons from 'lucide-react'

interface MessagesListProps {
  messages: Message[]
  chatbot: ChatbotConfig
  isLoading: boolean
  messageFeedback: Record<string, 'liked' | 'disliked' | null>
  setMessageFeedback: React.Dispatch<React.SetStateAction<Record<string, 'liked' | 'disliked' | null>>>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  sendMessage: (content: string, attachments?: Array<{ type: 'image' | 'video', url: string, name?: string }>) => Promise<void>
  scrollAreaRef: React.RefObject<HTMLDivElement>
  messagesEndRef: React.RefObject<HTMLDivElement>
  chatbotId?: string
  threadId?: string | null
}

export function MessagesList({
  messages,
  chatbot,
  isLoading,
  messageFeedback,
  setMessageFeedback,
  setMessages,
  sendMessage,
  scrollAreaRef,
  messagesEndRef,
  chatbotId,
  threadId,
}: MessagesListProps) {
  return (
    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
      <div className="space-y-4">
        {messages.length === 0 && !isLoading && (chatbot as any).showStartConversation !== false && (() => {
          const openerText = chatbot.openaiAgentSdkGreeting || chatbot.conversationOpener || 'Start a conversation'
          const position = (chatbot as any).conversationOpenerPosition || 'center'
          const alignment = (chatbot as any).conversationOpenerAlignment || 'center'
          const fontSize = (chatbot as any).conversationOpenerFontSize || '16px'
          const fontColor = (chatbot as any).conversationOpenerFontColor || '#6b7280'
          const fontFamily = (chatbot as any).conversationOpenerFontFamily || chatbot.fontFamily || 'Inter'
          const fontWeight = (chatbot as any).conversationOpenerFontWeight || '400'
          const lineHeight = (chatbot as any).conversationOpenerLineHeight || '1.5'
          const backgroundColor = (chatbot as any).conversationOpenerBackgroundColor
          const padding = (chatbot as any).conversationOpenerPadding || '16px'
          const borderRadius = (chatbot as any).conversationOpenerBorderRadius || '8px'
          
          // Position classes
          const positionClasses = {
            center: 'items-center justify-center',
            left: 'items-start justify-start',
            right: 'items-end justify-end',
            top: 'items-start justify-center',
            bottom: 'items-end justify-center',
          }
          
          const containerClass = `flex flex-col py-12 ${positionClasses[position as keyof typeof positionClasses] || positionClasses.center}`
          
          const openerStyle: React.CSSProperties = {
            fontSize,
            color: fontColor,
            fontFamily,
            fontWeight,
            lineHeight,
            textAlign: alignment as any,
            backgroundColor: backgroundColor || 'transparent',
            padding: backgroundColor ? padding : undefined,
            borderRadius: backgroundColor ? borderRadius : undefined,
            maxWidth: '80%',
            margin: '0 auto',
          }
          
          // Get start screen prompts (for Agent SDK and other engines)
          const startScreenPrompts = (chatbot as any).startScreenPrompts || []
          const promptsPosition = (chatbot as any).startScreenPromptsPosition || 'center'
          const iconDisplay = (chatbot as any).startScreenPromptsIconDisplay || 'suffix'
          const promptsBgColor = (chatbot as any).startScreenPromptsBackgroundColor || chatbot.botMessageBackgroundColor || '#f3f4f6'
          const promptsFontColor = (chatbot as any).startScreenPromptsFontColor || chatbot.botMessageFontColor || chatbot.fontColor || '#000000'
          const promptsBorderColor = (chatbot as any).startScreenPromptsBorderColor || chatbot.bubbleBorderColor || chatbot.borderColor || '#e5e7eb'
          const promptsBorderWidth = (chatbot as any).startScreenPromptsBorderWidth || '1px'
          const promptsBorderRadius = (chatbot as any).startScreenPromptsBorderRadius || '8px'
          
          // Helper function to get icon component
          const getIconComponent = (iconName?: string) => {
            if (!iconName || iconDisplay === 'none') return null
            // Try exact match first, then try with common variations
            let IconComponent = (LucideIcons as any)[iconName]
            if (!IconComponent) {
              // Try PascalCase if it's not already
              const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1)
              IconComponent = (LucideIcons as any)[pascalCase]
            }
            if (!IconComponent) {
              // Try common icon name variations
              const variations: Record<string, string> = {
                'Bolt': 'Zap',
                'Sparkle': 'Sparkles',
                'CheckCircle': 'CheckCircle2',
              }
              const mappedName = variations[iconName] || iconName
              IconComponent = (LucideIcons as any)[mappedName]
            }
            if (!IconComponent) return null
            return <IconComponent className="h-4 w-4" />
          }
          
          // Determine container class based on position
          const getPromptsContainerClass = () => {
            switch (promptsPosition) {
              case 'bottom':
                return 'flex flex-wrap gap-2 justify-center mt-auto pt-4'
              case 'list':
                return 'flex flex-col gap-2 mt-4 w-full max-w-md mx-auto'
              case 'center':
              default:
                return 'flex flex-wrap gap-2 justify-center mt-4'
            }
          }
          
          return (
            <div className={containerClass}>
              <p className="mb-2" style={openerStyle}>
                {openerText}
              </p>
              
              {/* Start Screen Prompts */}
              {startScreenPrompts.length > 0 && (
                <div className={getPromptsContainerClass()}>
                  {startScreenPrompts.map((prompt: { label?: string; prompt: string; icon?: string }, index: number) => {
                    const iconComponent = getIconComponent(prompt.icon)
                    const showIcon = iconDisplay !== 'none' && iconComponent
                    const showIconAsSuffix = iconDisplay === 'suffix' && showIcon
                    const showIconOnly = iconDisplay === 'show-all' && showIcon
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (prompt.prompt) {
                            sendMessage(prompt.prompt)
                          }
                        }}
                        className={`px-4 py-2 transition-colors hover:opacity-80 flex items-center gap-2 ${
                          promptsPosition === 'list' ? 'w-full justify-start' : ''
                        }`}
                        style={{
                          backgroundColor: promptsBgColor,
                          color: promptsFontColor,
                          borderColor: promptsBorderColor,
                          borderWidth: promptsBorderWidth,
                          borderRadius: promptsBorderRadius,
                          borderStyle: 'solid',
                          fontFamily: chatbot.fontFamily || 'Inter',
                          fontSize: chatbot.fontSize || '14px',
                        }}
                      >
                        {showIconOnly && iconComponent}
                        <span>{prompt.label || prompt.prompt}</span>
                        {showIconAsSuffix && iconComponent}
                      </button>
                    )
                  })}
                </div>
              )}
              
              {chatbot.followUpQuestions && chatbot.followUpQuestions.length > 0 && (
                <p className="text-xs text-muted-foreground mt-4" style={{ color: chatbot.fontColor }}>
                  Try asking one of the suggested questions below
                </p>
              )}
            </div>
          )
        })()}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            chatbot={chatbot}
            messages={messages}
            messageFeedback={messageFeedback}
            setMessageFeedback={setMessageFeedback}
            setMessages={setMessages}
            sendMessage={sendMessage}
            isLoading={isLoading}
            chatbotId={chatbotId}
            threadId={threadId}
          />
        ))}
        {isLoading && <TypingIndicator chatbot={chatbot} />}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}

