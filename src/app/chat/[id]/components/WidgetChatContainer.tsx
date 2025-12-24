import React from 'react'
import { Z_INDEX } from '@/lib/z-index'
import { ChatbotConfig } from '../types'
import { ChatHeader } from './ChatHeader'

interface WidgetChatContainerProps {
    chatbot: ChatbotConfig
    containerStyle: React.CSSProperties
    chatStyle: React.CSSProperties
    emulatorConfig: any
    isMobile: boolean
    isEmbed: boolean
    useChatKitInRegularStyle: boolean
    shouldRenderChatKit: boolean
    effectiveDeploymentType: 'popover' | 'fullpage' | 'popup-center'
    handleClose: () => void
    onClearSession: () => void
    children: React.ReactNode
}

export function WidgetChatContainer({
    chatbot,
    containerStyle,
    chatStyle,
    emulatorConfig,
    isMobile,
    isEmbed,
    useChatKitInRegularStyle,
    shouldRenderChatKit,
    effectiveDeploymentType,
    handleClose,
    onClearSession,
    children
}: WidgetChatContainerProps) {
    const showEmulatorOverlay = emulatorConfig.text || emulatorConfig.description

    const showDesktopHeader = ((chatbot as any).headerEnabled !== false) &&
        ((!shouldRenderChatKit || useChatKitInRegularStyle) && !isMobile && effectiveDeploymentType !== 'fullpage')

    const showMobileHeader = isMobile && ((chatbot as any).headerEnabled !== false)

    // On mobile, always show close button if embedded (since popover is converted to fullpage)
    // Also show close for popover/popup-center modes
    const mobileHeaderCloseCallback = (effectiveDeploymentType === 'popover' || effectiveDeploymentType === 'popup-center' || (isEmbed && isMobile) || (isEmbed && effectiveDeploymentType === 'fullpage'))
        ? handleClose
        : undefined

    // Extract padding to apply selectively (Header should not have top padding)
    const { paddingTop, paddingBottom, paddingLeft, paddingRight, ...stylesWithoutPadding } = containerStyle as any
    // Reconstruct container style without padding
    const adaptedContainerStyle = {
        ...stylesWithoutPadding,
        paddingLeft,
        paddingRight,
        paddingBottom,
        paddingTop: (showDesktopHeader || showMobileHeader) ? 0 : paddingTop
    }

    return (
        <div className="flex flex-col relative h-full" style={adaptedContainerStyle}>
            {/* Emulator text and description overlay - positioned below header */}
            {showEmulatorOverlay && (
                <div className="absolute top-0 left-0 right-0 p-4 bg-black/50 text-white backdrop-blur-sm" style={{ zIndex: Z_INDEX.chatWidgetOverlayText }}>
                    {emulatorConfig.text && <h2 className="text-lg font-semibold mb-2">{emulatorConfig.text}</h2>}
                    {emulatorConfig.description && <p className="text-sm opacity-90">{emulatorConfig.description}</p>}
                </div>
            )}

            {/* Main Chat Header (Desktop/Regular Style) - Fallback/Safety check */}
            {showDesktopHeader && (
                <ChatHeader
                    chatbot={chatbot}
                    onClearSession={onClearSession}
                    onClose={handleClose}
                />
            )}

            {/* Mobile header (back button layout) - Always show on mobile regardless of deployment type if enabled */}
            {showMobileHeader && (
                <ChatHeader
                    chatbot={chatbot}
                    onClearSession={onClearSession}
                    onClose={mobileHeaderCloseCallback}
                    isMobile={true}
                />
            )}

            <div className="flex-1 min-h-0 flex flex-col" style={{ ...chatStyle, paddingTop: (showDesktopHeader || showMobileHeader) ? paddingTop : 0 }}>
                {children}
            </div>
        </div>
    )
}
