import React from 'react'
import { Z_INDEX } from '@/lib/z-index'
import { ChatbotConfig } from '../types'
import { ChatHeader } from './ChatHeader'
import { motion } from 'framer-motion'
import { PWAInstallBanner } from './PWAInstallBanner'


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
    isMobileFullpageFromWidget: boolean  // True when popover/popup-center was converted to fullpage on mobile
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
    isMobileFullpageFromWidget,
    handleClose,
    onClearSession,
    children
}: WidgetChatContainerProps) {
    const showEmulatorOverlay = emulatorConfig.text || emulatorConfig.description

    const showDesktopHeader = ((chatbot as any).headerEnabled !== false) &&
        ((!shouldRenderChatKit || useChatKitInRegularStyle) && !isMobile && effectiveDeploymentType !== 'fullpage')

    const showMobileHeader = isMobile && ((chatbot as any).headerEnabled !== false)

    // On mobile, show close button when:
    // - popover/popup-center modes (widget-based)
    // - OR when popover was converted to fullpage on mobile (so user can close and return to widget)
    // Do NOT show close for true fullpage deployment (user intentionally chose fullpage)
    const mobileHeaderCloseCallback = (
        effectiveDeploymentType === 'popover' ||
        effectiveDeploymentType === 'popup-center' ||
        isMobileFullpageFromWidget  // Only show close for converted fullpage, not true fullpage
    )
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
        paddingTop: (showDesktopHeader || showMobileHeader) ? 0 : paddingTop,
        // For mobile fullpage converted from widget, ensure we use full height
        height: isMobileFullpageFromWidget ? '100%' : (stylesWithoutPadding.height || '100%')
    }

    // Define animation variant based on deployment type
    const isFullPage = effectiveDeploymentType === 'fullpage' || isMobileFullpageFromWidget

    // Default config values
    const entryType = chatbot.widgetAnimationEntry || (isFullPage ? 'slide-up' : 'scale')
    const exitType = chatbot.widgetAnimationExit || (isFullPage ? 'slide-down' : 'scale')
    const duration = chatbot.widgetAnimationDuration || 0.3
    const animType = chatbot.widgetAnimationType || 'spring'

    // Helper to get variants
    const getVariant = (type: string, state: 'initial' | 'animate' | 'exit') => {
        switch (type) {
            case 'slide-up':
                return state === 'animate' ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }
            case 'slide-down':
                return state === 'animate' ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }
            case 'slide-side':
                return state === 'animate' ? { x: 0, opacity: 1 } : { x: '100%', opacity: 0 }
            case 'scale':
                return state === 'animate' ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.95, opacity: 0, y: 10 }
            case 'fade':
                return state === 'animate' ? { opacity: 1 } : { opacity: 0 }
            default:
                return state === 'animate' ? { opacity: 1 } : { opacity: 0 }
        }
    }

    const animationProps = {
        initial: getVariant(entryType, 'initial'),
        animate: getVariant(entryType, 'animate'),
        exit: getVariant(exitType, 'exit'),
        transition: {
            type: animType,
            duration: duration,
            damping: 25,
            stiffness: 200,
            ease: "easeOut" as const
        }
    }

    return (
        <motion.div
            className="flex flex-col relative h-full"
            style={adaptedContainerStyle}
            {...animationProps}
        >
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

            {/* PWA Install Banner */}
            <PWAInstallBanner chatbot={chatbot} isMobile={isMobile} />

            <div className="flex-1 min-h-0 flex flex-col" style={{ ...chatStyle, paddingTop: (showDesktopHeader || showMobileHeader) ? paddingTop : 0 }}>
                {children}
            </div>
        </motion.div>
    )
}
