import React, { useMemo } from 'react'
import { X, Bot } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ChatbotConfig } from '../types'
import { getWidgetConfig } from '../utils/widgetConfigHelper'
import { buildChatKitTheme } from './chatkit/configBuilder'

interface ChatWidgetButtonProps {
    chatbot: ChatbotConfig
    isOpen: boolean
    onClick: () => void
    widgetButtonStyle: React.CSSProperties
    popoverPositionStyle: React.CSSProperties
}

export function ChatWidgetButton({
    chatbot,
    isOpen,
    onClick,
    widgetButtonStyle,
    popoverPositionStyle
}: ChatWidgetButtonProps) {
    // Re-use logic from shared helper to ensure 100% parity with embed script
    const config = useMemo(() => {
        // Theme is needed for accent color fallback
        const theme = buildChatKitTheme(chatbot)
        return getWidgetConfig(chatbot, theme)
    }, [chatbot])

    const containerStyle = useMemo(() => {
        // Helper to get background styles
        const getBackgroundStyles = (): React.CSSProperties => {
            const bgValue = config.backgroundColor
            // Check if it's an image URL
            if (bgValue && (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/'))) {
                const imageUrl = bgValue.startsWith('url(') ? bgValue : `url(${bgValue})`
                return {
                    backgroundImage: imageUrl,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }
            }
            // Check if it's a gradient
            if (bgValue && bgValue.includes('gradient')) {
                return { background: bgValue }
            }
            // It's a solid color
            return { backgroundColor: bgValue }
        }

        if (!isOpen && config.avatarStyle === 'circle-with-label') {
            // Pill style - keep background, border, and shadow from config
            // but adjust dimensions for pill shape
            return {
                ...popoverPositionStyle,
                ...getBackgroundStyles(),
                // Dimensions for pill shape
                width: 'auto',
                height: config.size,
                borderRadius: config.labelBorderRadius,
                paddingLeft: '16px',
                paddingRight: '16px',
                // Flex layout
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexDirection: 'row',
                justifyContent: 'center',
                minWidth: config.size,
                // Apply configured border and shadow
                border: `${config.borderWidth} solid ${config.borderColor}`,
                boxShadow: config.boxShadow !== 'none' ? config.boxShadow : undefined,
                zIndex: config.zIndex,
                cursor: 'pointer',
            } as React.CSSProperties
        }
        
        // For circle and square styles, use widgetButtonStyle (which has all the styling)
        // Ensure border radius and background are explicitly set from widgetButtonStyle
        return {
            ...popoverPositionStyle,
            ...widgetButtonStyle,
            // Force border radius and background to be applied (in case of CSS overrides)
            borderRadius: widgetButtonStyle.borderRadius || '50%',
            backgroundColor: widgetButtonStyle.backgroundColor || widgetButtonStyle.background || config.backgroundColor || '#3b82f6',
            background: widgetButtonStyle.background || undefined,
            backgroundImage: widgetButtonStyle.backgroundImage || undefined,
        }
    }, [isOpen, config, popoverPositionStyle, widgetButtonStyle])

    return (
        <button
            type="button"
            aria-label={isOpen ? 'Close chat' : 'Open chat'}
            onClick={onClick}
            style={containerStyle}
            className="transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center relative"
            data-widget-button="true"
        >
            {isOpen ? (
                <X className="h-6 w-6" style={{ color: config.avatarIconColor }} />
            ) : (
                (() => {
                    const renderIcon = () => {
                        if (config.avatarType === 'image' && config.avatarImageUrl) {
                            return (
                                <img
                                    src={config.avatarImageUrl}
                                    alt="Chat"
                                    style={{
                                        width: config.avatarStyle === 'circle-with-label' ? '24px' : '60%',
                                        height: config.avatarStyle === 'circle-with-label' ? '24px' : '60%',
                                        borderRadius: '50%', // Icons always circular inside button
                                        objectFit: 'cover'
                                    }}
                                />
                            )
                        }
                        const IconName = config.avatarIcon as string
                        const IconComponent = (Icons as any)[IconName] || Bot
                        return <IconComponent
                            className={config.avatarStyle === 'circle-with-label' ? "h-5 w-5" : "h-6 w-6"}
                            style={{ color: config.avatarIconColor }}
                        />
                    }

                    if (config.avatarStyle === 'circle-with-label') {
                        return (
                            <>
                                {(config.labelShowIcon && config.labelIconPosition === 'left') && renderIcon()}
                                <span style={{ color: config.labelColor, fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {config.labelText}
                                </span>
                                {(config.labelShowIcon && config.labelIconPosition === 'right') && renderIcon()}
                            </>
                        )
                    }

                    return renderIcon()
                })()
            )}

            {/* Badge Render Logic */}
            {config.showBadge && !isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    backgroundColor: config.badgeColor,
                    color: 'white',
                    borderRadius: '50%',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: '2px solid white',
                    boxSizing: 'border-box',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    1
                </div>
            )}
        </button>
    )
}

