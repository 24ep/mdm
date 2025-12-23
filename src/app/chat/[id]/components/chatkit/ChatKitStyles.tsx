import React from 'react'
import { ChatbotConfig } from '../../types'
import { Z_INDEX } from '@/lib/z-index'
import { hexToRgb, isLightColor } from './themeUtils'

interface ChatKitGlobalStylesProps {
  chatbot: ChatbotConfig
  chatkitOptions: any
}

export const ChatKitGlobalStyles = ({ chatbot, chatkitOptions }: ChatKitGlobalStylesProps) => {
  // Calculate default composer colors based on background contrast
  const defaultComposerBg = isLightColor((chatbot.messageBoxColor || '#ffffff'))
    ? '#f3f4f6' // Light theme: Gray-100 input
    : '#374151' // Dark theme: Gray-700 input

  const defaultComposerFg = isLightColor((chatbot.messageBoxColor || '#ffffff'))
    ? '#000000'
    : '#ffffff'

  // Determine if the composer background is light or dark
  const composerBg = (chatbot as any).composerBackgroundColor || (chatbot as any).footerInputBgColor || defaultComposerBg
  // Force the browser to render standard form controls in the matching scheme (prevents 'dark' user agent styles on light inputs)
  const forcedColorScheme = isLightColor(composerBg) ? 'light' : 'dark'

  return (
    <>
      <style>{`
        ${(() => {
          const radiusValue = chatkitOptions?.theme?.radius || 'round'
          let borderRadius = '12px'
          if (radiusValue === 'pill') borderRadius = '9999px'
          else if (radiusValue === 'round') borderRadius = '12px'
          else if (radiusValue === 'soft') borderRadius = '6px'
          else if (radiusValue === 'sharp') borderRadius = '0px'

          return `
            div[class*="message"],
            div[class*="Message"],
            div[class*="bubble"],
            div[class*="Bubble"],
            button[class*="chatkit"],
            button[class*="ChatKit"],
            div[class*="input"],
            div[class*="Input"],
            div[class*="composer"],
            div[class*="Composer"] {
              border-radius: ${borderRadius} !important;
            }
          `
        })()}
      `}</style>

      <style>{`
          div[class*="header"]:first-child,
          header:first-child,
          [role="banner"],
          div > div:first-child[class*="header"],
          .chatkit-header {
            background-color: ${(chatbot as any).headerBgColor || chatbot.primaryColor || '#ffffff'} !important;
            color: ${(chatbot as any).headerFontColor || chatbot.fontColor || '#000000'} !important;
            padding: ${(chatbot as any).headerPaddingY || '12px'} ${(chatbot as any).headerPaddingX || '16px'} !important;
            margin: 0 !important;
            ${(chatbot as any).headerBorderEnabled !== false ? `border-bottom: 1px solid ${(chatbot as any).headerBorderColor || chatbot.borderColor || '#e5e7eb'} !important;` : ''}
          }
          
          /* Remove gap between header and message body area */
          div[class*="header"] + div,
          header + div,
          [role="banner"] + div,
          .chatkit-header + div {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          
          /* Ensure message/thread list container has no top margin */
          div[class*="thread"],
          div[class*="Thread"],
          div[class*="messages"],
          div[class*="Messages"],
          div[class*="conversation"],
          div[class*="Conversation"] {
            margin-top: 0 !important;
          }
          
          button[aria-label*="Send" i],
          button[aria-label*="send" i],
          button[type="submit"],
          button[class*="send" i],
          button[class*="Send"],
          .chatkit-send-button,
          div[class*="composer"] button:last-child,
          div[class*="Composer"] button:last-child {
            background-color: ${(chatbot as any).sendButtonBgColor || chatbot.primaryColor || '#3b82f6'} !important;
          }

          :root {
            --ck-font-family: ${chatbot.fontFamily || 'inherit'};
            /* ChatKit composer CSS variable overrides */
            --ck-composer-background: ${(chatbot as any).composerBackgroundColor || (chatbot as any).footerInputBgColor || defaultComposerBg};
            --ck-composer-color: ${(chatbot as any).composerFontColor || (chatbot as any).footerInputFontColor || chatbot.fontColor || defaultComposerFg};
            --ck-input-background: ${(chatbot as any).composerBackgroundColor || (chatbot as any).footerInputBgColor || defaultComposerBg};
            --ck-input-color: ${(chatbot as any).composerFontColor || (chatbot as any).footerInputFontColor || chatbot.fontColor || defaultComposerFg};
            --chatkit-composer-bg: ${(chatbot as any).composerBackgroundColor || (chatbot as any).footerInputBgColor || defaultComposerBg};
            --chatkit-composer-text: ${(chatbot as any).composerFontColor || (chatbot as any).footerInputFontColor || chatbot.fontColor || defaultComposerFg};
            --chatkit-input-bg: ${(chatbot as any).composerBackgroundColor || (chatbot as any).footerInputBgColor || defaultComposerBg};
            --chatkit-input-text: ${(chatbot as any).composerFontColor || (chatbot as any).footerInputFontColor || chatbot.fontColor || defaultComposerFg};
          }

          /* ChatKit Override Styles */
          
          /* Button styling override */
          button[class*="button"],
          button[class*="Button"] {
            font-family: ${(chatbot as any).fontFamily || 'inherit'} !important;
          }

          /* Send Button styling */
          button[aria-label="Send message"],
          button[class*="send-button"],
          button[class*="SendButton"] {
            background-color: ${(chatbot as any).sendButtonBgColor || chatbot.primaryColor || '#3b82f6'} !important;
            color: ${(chatbot as any).sendButtonIconColor || '#ffffff'} !important;
            ${(chatbot as any).sendButtonBorderRadiusTopLeft || (chatbot as any).sendButtonBorderRadiusTopRight || (chatbot as any).sendButtonBorderRadiusBottomRight || (chatbot as any).sendButtonBorderRadiusBottomLeft
          ? `border-top-left-radius: ${(chatbot as any).sendButtonBorderRadiusTopLeft || (chatbot as any).sendButtonBorderRadius || '8px'} !important;
                   border-top-right-radius: ${(chatbot as any).sendButtonBorderRadiusTopRight || (chatbot as any).sendButtonBorderRadius || '8px'} !important;
                   border-bottom-right-radius: ${(chatbot as any).sendButtonBorderRadiusBottomRight || (chatbot as any).sendButtonBorderRadius || '8px'} !important;
                   border-bottom-left-radius: ${(chatbot as any).sendButtonBorderRadiusBottomLeft || (chatbot as any).sendButtonBorderRadius || '8px'} !important;`
          : (chatbot as any).sendButtonBorderRadius
            ? `border-radius: ${(chatbot as any).sendButtonBorderRadius} !important;`
            : (chatbot as any).sendButtonRounded
              ? 'border-radius: 50% !important;'
              : ''}
            ${(chatbot as any).sendButtonShadowBlur ? `box-shadow: 0 0 ${(chatbot as any).sendButtonShadowBlur} ${(chatbot as any).sendButtonShadowColor || '#000000'} !important;` : ''}
            ${(chatbot as any).sendButtonPaddingX || (chatbot as any).sendButtonPaddingY ? `padding: ${(chatbot as any).sendButtonPaddingY || '8px'} ${(chatbot as any).sendButtonPaddingX || '8px'} !important;` : ''}
          }

          /* Footer/Composer Container styling */
          div[class*="footer"],
          div[class*="Footer"],
          div[class*="composer"]:last-child,
          div[class*="Composer"]:last-child,
          div[class*="input-container"],
          div[class*="InputContainer"] {
            background-color: ${(chatbot as any).footerBgColor || chatbot.messageBoxColor || '#ffffff'} !important;
            ${(chatbot as any).footerBorderColor ? `border-top: ${(chatbot as any).footerBorderWidth || chatbot.borderWidth || '1px'} solid ${(chatbot as any).footerBorderColor} !important;` : ''}
            ${(chatbot as any).footerPaddingX || (chatbot as any).footerPaddingY ? `padding: ${(chatbot as any).footerPaddingY || '16px'} ${(chatbot as any).footerPaddingX || '16px'} !important;` : ''}
            ${(chatbot as any).footerBorderRadius ? `border-bottom-left-radius: ${(chatbot as any).footerBorderRadius} !important; border-bottom-right-radius: ${(chatbot as any).footerBorderRadius} !important;` : ''}
          }

            /* Input/Textarea Styling - High Specificity Selectors */
            input[class*="input"],
            input[class*="Input"],
            textarea[class*="input"],
            textarea[class*="Input"],
            [contenteditable="true"],
            [role="textbox"],
            div[class*="composer"] input,
            div[class*="Composer"] input,
            div[class*="composer"] textarea,
            div[class*="Composer"] textarea,
            div[class*="composer"] [contenteditable],
            div[class*="Composer"] [contenteditable],
            div[class*="composer"] [role="textbox"],
            div[class*="Composer"] [role="textbox"],
            /* ChatKit specific selectors */
            [data-chatkit] input,
            [data-chatkit] textarea,
            [data-chatkit] [contenteditable],
            [data-chatkit] [role="textbox"],
            div[class*="chatkit"] input,
            div[class*="chatkit"] textarea,
            div[class*="ChatKit"] input,
            div[class*="ChatKit"] textarea,
            div[class*="chatkit"] [contenteditable],
            div[class*="ChatKit"] [contenteditable],
            div[class*="chatkit"] [role="textbox"],
            div[class*="ChatKit"] [role="textbox"],
            /* Additional high-specificity selectors for inputs */
            div div input[type="text"],
            div div textarea,
            form input,
            form textarea,
            form [contenteditable],
            form [role="textbox"] {
              color-scheme: ${forcedColorScheme} !important;
              background: ${(chatbot as any).composerBackgroundColor || (chatbot as any).footerInputBgColor || defaultComposerBg} !important;
              background-color: ${(chatbot as any).composerBackgroundColor || (chatbot as any).footerInputBgColor || defaultComposerBg} !important;
              color: ${(chatbot as any).composerFontColor || (chatbot as any).footerInputFontColor || chatbot.fontColor || defaultComposerFg} !important;
              background-image: none !important;
              box-shadow: none !important;
              -webkit-text-fill-color: ${(chatbot as any).composerFontColor || (chatbot as any).footerInputFontColor || chatbot.fontColor || defaultComposerFg} !important;
              ${(chatbot as any).footerInputBorderColor ? `border: ${(chatbot as any).footerInputBorderWidth || chatbot.borderWidth || '1px'} solid ${(chatbot as any).footerInputBorderColor} !important;` : ''}
              ${(chatbot as any).footerInputBorderRadius ? `border-radius: ${(chatbot as any).footerInputBorderRadius} !important;` : ''}
            }
            
            /* Placeholder styling with high specificity */
            input::placeholder,
            textarea::placeholder,
            [contenteditable]:empty:before,
            div[class*="composer"] input::placeholder,
            div[class*="Composer"] input::placeholder,
            div[class*="composer"] textarea::placeholder,
            div[class*="Composer"] textarea::placeholder,
            [data-chatkit] input::placeholder,
            [data-chatkit] textarea::placeholder,
            form input::placeholder,
            form textarea::placeholder {
              color: ${(chatbot as any).composerFontColor || (chatbot as any).footerInputFontColor || chatbot.fontColor || defaultComposerFg} !important;
              -webkit-text-fill-color: ${(chatbot as any).composerFontColor || (chatbot as any).footerInputFontColor || chatbot.fontColor || defaultComposerFg} !important;
              opacity: 0.6 !important;
            }
        `}</style>
    </>
  )
}

export const getContainerStyle = (deploymentType: string, chatbot: ChatbotConfig): React.CSSProperties => {
  if (deploymentType === 'popover' || deploymentType === 'popup-center') {
    const bgValue = chatbot.messageBoxColor || '#ffffff'
    const blurAmount = (chatbot as any).chatWindowBackgroundBlur || 0
    const opacity = (chatbot as any).chatWindowBackgroundOpacity !== undefined ? (chatbot as any).chatWindowBackgroundOpacity : 100

    const style: React.CSSProperties = {
      width: chatbot.chatWindowWidth || '380px',
      height: chatbot.chatWindowHeight || '600px',
      border: `${chatbot.chatWindowBorderWidth || chatbot.borderWidth} solid ${chatbot.chatWindowBorderColor || chatbot.borderColor}`,
      borderRadius: chatbot.chatWindowBorderRadius || chatbot.borderRadius,
      boxShadow: `0 0 ${chatbot.chatWindowShadowBlur || chatbot.shadowBlur} ${chatbot.chatWindowShadowColor || chatbot.shadowColor}`,
      overflow: 'hidden',
      paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
      paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
      paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
      paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
    }

    // Apply glassmorphism effect
    if (blurAmount > 0) {
      style.backdropFilter = `blur(${blurAmount}px)`
      style.WebkitBackdropFilter = `blur(${blurAmount}px)`
    }

    // Check if it's an image URL
    if (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/')) {
      const imageUrl = bgValue.startsWith('url(') ? bgValue : `url(${bgValue})`
      style.backgroundImage = imageUrl
      style.backgroundSize = 'cover'
      style.backgroundPosition = 'center'
      style.backgroundRepeat = 'no-repeat'
      style.backgroundColor = opacity < 100 ? `rgba(255, 255, 255, ${opacity / 100})` : '#ffffff' // Fallback color with opacity
    } else {
      // It's a color value - apply opacity
      if (opacity < 100) {
        if (bgValue.startsWith('rgba') || bgValue.startsWith('rgb')) {
          const rgbMatch = bgValue.match(/(\d+),\s*(\d+),\s*(\d+)/)
          if (rgbMatch) {
            style.backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity / 100})`
          } else {
            style.backgroundColor = bgValue
          }
        } else {
          style.backgroundColor = `rgba(${hexToRgb(bgValue)}, ${opacity / 100})`
        }
      } else {
        style.backgroundColor = bgValue
      }
    }

    return style
  }
  return {
    width: '100%',
    height: '100vh',
    border: 'none',
    borderRadius: '0',
    boxShadow: 'none',
    paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
    paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
    paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
    paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
  } as React.CSSProperties
}
