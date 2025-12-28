'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { ChatbotConfig } from '../types'

interface PWAInstallBannerProps {
    chatbot: ChatbotConfig
    onInstall?: () => void
    onDismiss?: () => void
    isMobile?: boolean
}

export function PWAInstallBanner({ chatbot, onInstall, onDismiss, isMobile }: PWAInstallBannerProps) {
    const [dismissed, setDismissed] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isInstallable, setIsInstallable] = useState(false)

    // Listen for the beforeinstallprompt event
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsInstallable(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Check if already installed
        const checkInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsInstallable(false)
            }
        }
        checkInstalled()

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    // Check if PWA is enabled and banner should show
    const pwaEnabled = (chatbot as any).pwaEnabled

    // Check for mobile or tablet viewport (max-width: 1024px covers most tablets)
    // We handle this internally to be independent of the strict 'isMobile' prop (<768px)
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)

    useEffect(() => {
        const checkViewport = () => {
            setIsMobileOrTablet(window.matchMedia('(max-width: 1024px)').matches)
        }
        checkViewport()
        window.addEventListener('resize', checkViewport)
        return () => window.removeEventListener('resize', checkViewport)
    }, [])

    // Debug logging
    useEffect(() => {
        if (pwaEnabled && !dismissed) {
            console.log('📱 PWA Banner attempting to render. Config:', {
                pwaEnabled,
                dismissed,
                bannerText: (chatbot as any).pwaBannerText,
                isMobileOrTablet
            })
        }
    }, [pwaEnabled, dismissed, chatbot, isMobileOrTablet])

    // Don't show if not enabled, already dismissed, or already installed
    // AND Only show on mobile (hide on desktop view)
    // If isMobile prop is provided, strictly follow it.
    // If not provided, fallback to internal check (max-width: 1024px).
    const showBanner = isMobile !== undefined ? isMobile : isMobileOrTablet

    // CRITICAL: Ensure we are really on mobile if the user wants "no need to show on desktop view"
    // The previous logic allowed tablets (up to 1024px) which might be considered "desktop" by some users
    // or if the user simply wants strict mobile phone targeting.
    // However, the user said "desktop view". 
    // If `isMobile` comes from `page.tsx`, it uses 768px threshold.

    if (!pwaEnabled || dismissed || !showBanner) {
        return null
    }

    const handleInstall = async () => {
        if (deferredPrompt) {
            // Trigger the install prompt
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setDeferredPrompt(null)
                setIsInstallable(false)
                onInstall?.()
            }
        } else {
            // Fallback: open in new window for manual install instructions
            onInstall?.()
        }
    }

    const handleDismiss = () => {
        setDismissed(true)
        onDismiss?.()
    }

    const isOverlay = (chatbot as any).pwaInstallScope === 'website'
    const configuredPosition = (chatbot as any).pwaBannerPosition

    // Determine effective position
    // For 'website' scope (Overlay), we strictly default to 'floating-top'
    let position = 'under-header'
    if (isOverlay) {
        position = configuredPosition || 'floating-top'
    } else if (configuredPosition) {
        position = configuredPosition
    }

    // Debug logging for position
    useEffect(() => {
        if (pwaEnabled && !dismissed && isOverlay) {
            console.log('📍 PWA Banner Position:', position, 'Configured:', configuredPosition)
        }
    }, [pwaEnabled, dismissed, isOverlay, position, configuredPosition])

    // Base styles
    // Base styles
    let containerClass = "flex items-center justify-between"
    let containerStyle: React.CSSProperties = {
        background: (chatbot as any).pwaBannerBgColor || '#ffffff',
        color: (chatbot as any).pwaBannerFontColor || '#000000',
        fontFamily: (chatbot as any).pwaBannerFontFamily || undefined,
        fontSize: (chatbot as any).pwaBannerFontSize || undefined,
        borderRadius: (chatbot as any).pwaBannerBorderRadius || undefined,
        boxShadow: (chatbot as any).pwaBannerShadow || (position === 'floating-top' || position === 'floating-bottom' ? '0 2px 10px rgba(0,0,0,0.15)' : undefined),
        padding: (chatbot as any).pwaBannerPadding || '12px',
        pointerEvents: 'auto',
        zIndex: position === 'floating-top' ? 5000 : 50
    }

    // Position-specific logic
    if (position === 'floating-top') {
        containerClass += " fixed top-0 left-0 right-0"
        // Handle margins for floating elements
        if ((chatbot as any).pwaBannerMargin) {
            containerStyle.top = (chatbot as any).pwaBannerMargin
            containerStyle.left = (chatbot as any).pwaBannerMargin
            containerStyle.right = (chatbot as any).pwaBannerMargin
            containerStyle.width = 'auto' // Allow right/left to constrain width
        }
    } else if (position === 'floating-bottom') {
        // 80px approx to clear standard chat input, usually 0 if inside a flex container that ends above input
        // But the user requested "floating near composer", which implies absolute positioning over content
        // Adjust bottom value safely. Assuming standard chat input height is ~60-80px.
        // If it's pure floating, it might overlay content. 
        containerClass += " absolute bottom-[90px] left-0 right-0"
        if ((chatbot as any).pwaBannerMargin) {
            containerStyle.bottom = `calc(90px + ${(chatbot as any).pwaBannerMargin})`
            containerStyle.left = (chatbot as any).pwaBannerMargin
            containerStyle.right = (chatbot as any).pwaBannerMargin
            containerStyle.width = 'auto'
        }
    } else if (position === 'top-of-header') {
        containerClass += " border-b" // Removed w-full to allow margins to work correctly
        containerStyle.order = -1 // Move above header in flex column
        if ((chatbot as any).pwaBannerMargin) {
            containerStyle.margin = (chatbot as any).pwaBannerMargin
        }
    } else {
        // under-header (default)
        containerClass += " border-b" // Removed w-full
        if ((chatbot as any).pwaBannerMargin) {
            containerStyle.margin = (chatbot as any).pwaBannerMargin
        }
    }

    // Border configuration
    if ((chatbot as any).pwaBannerBorderWidth || (chatbot as any).pwaBannerBorderColor) {
        containerStyle.borderWidth = (chatbot as any).pwaBannerBorderWidth || '1px'
        containerStyle.borderColor = (chatbot as any).pwaBannerBorderColor || '#e2e8f0'
        containerStyle.borderStyle = 'solid'
        // Remove default border-b class if custom border is set to avoid conflict/double borders
        // Remove default border-b class if custom border is set to avoid conflict/double borders
        containerClass = containerClass.replace('border-b', '')
    }

    // Apply granular border widths if present (overrides general border width)
    if ((chatbot as any).pwaBannerBorderWidthTop) containerStyle.borderTopWidth = (chatbot as any).pwaBannerBorderWidthTop
    if ((chatbot as any).pwaBannerBorderWidthRight) containerStyle.borderRightWidth = (chatbot as any).pwaBannerBorderWidthRight
    if ((chatbot as any).pwaBannerBorderWidthBottom) containerStyle.borderBottomWidth = (chatbot as any).pwaBannerBorderWidthBottom
    if ((chatbot as any).pwaBannerBorderWidthLeft) containerStyle.borderLeftWidth = (chatbot as any).pwaBannerBorderWidthLeft

    // Shadow configuration
    const shadowX = (chatbot as any).pwaBannerShadowX || '0px'
    const shadowY = (chatbot as any).pwaBannerShadowY || '0px'
    const shadowBlur = (chatbot as any).pwaBannerShadowBlur || '0px'
    const shadowSpread = (chatbot as any).pwaBannerShadowSpread || '0px'
    const shadowColor = (chatbot as any).pwaBannerShadowColor || 'rgba(0,0,0,0)'

    // Only apply granular shadow if at least one property is set (checking valid value presence)
    if ((chatbot as any).pwaBannerShadowX || (chatbot as any).pwaBannerShadowY || (chatbot as any).pwaBannerShadowBlur || (chatbot as any).pwaBannerShadowSpread || (chatbot as any).pwaBannerShadowColor) {
        containerStyle.boxShadow = `${shadowX} ${shadowY} ${shadowBlur} ${shadowSpread} ${shadowColor}`
    } else if ((chatbot as any).pwaBannerShadow) {
        // Fallback to legacy shadow string
        containerStyle.boxShadow = (chatbot as any).pwaBannerShadow
    }

    return (
        <div
            className={containerClass}
            style={containerStyle}
        >
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    {(chatbot as any).pwaIconUrl ? (
                        <img
                            src={(chatbot as any).pwaIconUrl}
                            alt="App Icon"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-xs font-bold">App</span>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight">
                        {(chatbot as any).pwaBannerText || 'Install our App'}
                    </span>
                    <span className="text-xs opacity-80">Add to home screen</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    className="h-7 px-3"
                    onClick={handleInstall}
                    style={{
                        backgroundColor: (chatbot as any).pwaBannerButtonBgColor || '#000000',
                        color: (chatbot as any).pwaBannerButtonTextColor || '#ffffff',
                        borderRadius: (chatbot as any).pwaBannerButtonBorderRadius || undefined,
                        fontSize: (chatbot as any).pwaBannerButtonFontSize || '12px'
                    }}
                >
                    Install
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                    onClick={handleDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
