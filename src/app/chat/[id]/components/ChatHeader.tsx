'use client'

import { Bot, RotateCcw, X } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ChatbotConfig } from '../types'
import { Button } from '@/components/ui/button'

interface ChatHeaderProps {
  chatbot: ChatbotConfig
  onClearSession?: () => void
  onClose?: () => void
}

export function ChatHeader({ chatbot, onClearSession, onClose }: ChatHeaderProps) {
  const showClearSession = (chatbot as any).headerShowClearSession !== false // Default to true
  const showCloseButton = (chatbot as any).headerShowCloseButton !== false // Default to true
  const useChatKitInRegularStyle = (chatbot as any).useChatKitInRegularStyle === true
  
  // Get ChatKit header config if useChatKitInRegularStyle is enabled
  const chatkitHeader = useChatKitInRegularStyle && chatbot.chatkitOptions?.header
  const chatkitCustomButtons = chatkitHeader?.customButtonLeft || []
  
  const handleClearSession = () => {
    if (onClearSession) {
      if (confirm('Are you sure you want to clear this conversation?')) {
        onClearSession()
      }
    }
  }

  // Shared button styles for header action buttons
  const headerButtonClassName = "h-8 w-8 p-0 hover:opacity-80 flex items-center justify-center"
  const headerButtonStyle = { 
    color: chatbot.headerFontColor || 'white'
  }

  // Get individual padding values or fallback to X/Y values
  const headerPaddingTop = (chatbot as any).headerPaddingTop || (chatbot as any).headerPaddingY || '16px'
  const headerPaddingRight = (chatbot as any).headerPaddingRight || (chatbot as any).headerPaddingX || '16px'
  const headerPaddingBottom = (chatbot as any).headerPaddingBottom || (chatbot as any).headerPaddingY || '16px'
  const headerPaddingLeft = (chatbot as any).headerPaddingLeft || (chatbot as any).headerPaddingX || '16px'
  
  // Get border width
  const headerBorderWidth = (chatbot as any).headerBorderWidth || chatbot.borderWidth || '1px'
  const headerBorderEnabled = (chatbot as any).headerBorderEnabled !== false

  return (
    <div 
      className="flex items-center gap-3"
      style={{ 
        // Individual padding sides (with fallback to X/Y)
        paddingTop: headerPaddingTop,
        paddingRight: headerPaddingRight,
        paddingBottom: headerPaddingBottom,
        paddingLeft: headerPaddingLeft,
        // Border styling
        borderColor: (chatbot as any).headerBorderColor || chatbot.borderColor,
        borderBottomWidth: headerBorderEnabled ? (parseInt(headerBorderWidth.toString()) || 1) : 0,
        borderBottomStyle: headerBorderEnabled ? 'solid' : 'none',
        // Background and text colors
        backgroundColor: chatbot.headerBgColor || chatbot.primaryColor,
        color: chatbot.headerFontColor || 'white',
        // Font styling
        fontFamily: chatbot.headerFontFamily || chatbot.fontFamily,
        // Border radius (top corners only for header)
        borderTopLeftRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius,
        borderTopRightRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }}
    >
      {/* Header Logo (separate from avatar) - if logo is set and showLogo is enabled, don't show avatar */}
      {((chatbot as any).headerShowLogo !== false && chatbot.headerLogo) ? (
        <img 
          src={chatbot.headerLogo} 
          alt={chatbot.name}
          className="w-8 h-8 object-contain flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : ((chatbot as any).headerShowAvatar !== false) && (() => {
        // Use header avatar config, fallback to message avatar config for backward compatibility
        const headerAvatarType = chatbot.headerAvatarType || chatbot.avatarType || 'icon'
        if (headerAvatarType === 'image' && (chatbot.headerLogo || chatbot.headerAvatarImageUrl)) {
          return (
            <img 
              src={chatbot.headerLogo || chatbot.headerAvatarImageUrl || ''} 
              alt={chatbot.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )
        } else if (headerAvatarType === 'icon') {
          const IconName = chatbot.headerAvatarIcon || chatbot.avatarIcon || 'Bot'
          const IconComponent = (Icons as any)[IconName] || Bot
          const iconColor = chatbot.headerAvatarIconColor || chatbot.avatarIconColor || '#ffffff'
          const bgColor = chatbot.headerAvatarBackgroundColor || chatbot.avatarBackgroundColor || chatbot.primaryColor || '#3b82f6'
          return (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: bgColor }}
            >
              <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
            </div>
          )
        }
        return null
      })()}
      <div className="flex-1">
        <h3 className="font-semibold">{chatbot.headerTitle || chatbot.name}</h3>
        {chatbot.headerDescription && (
          <p className="text-xs opacity-90">{chatbot.headerDescription}</p>
        )}
      </div>
      
      {/* Button Container - Ensures both buttons are aligned */}
      <div className="flex items-center gap-3">
        {/* ChatKit Custom Buttons (when useChatKitInRegularStyle is enabled) */}
        {useChatKitInRegularStyle && chatkitCustomButtons.map((button: any, index: number) => {
          const IconName = button.icon || 'Bot'
          const IconComponent = (Icons as any)[IconName] || Bot
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.onClick || (() => {})}
              className={headerButtonClassName}
              style={headerButtonStyle}
              title={button.label || ''}
            >
              {button.icon ? (
                <IconComponent className="h-4 w-4" />
              ) : button.label ? (
                <span className="text-xs">{button.label}</span>
              ) : null}
            </Button>
          )
        })}
        
        {/* Clear Session Button - Left of Close Icon */}
        {showClearSession && onClearSession && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSession}
            className={headerButtonClassName}
            style={headerButtonStyle}
            title="Clear conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        
        {/* Close Button */}
        {showCloseButton && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={headerButtonClassName}
            style={headerButtonStyle}
            title="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

