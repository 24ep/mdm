'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { ChatbotConfig } from '../types'

interface PWAInstallBannerProps {
    chatbot: ChatbotConfig
    onInstall?: () => void
    onDismiss?: () => void
    isMobile?: boolean
    /** If true, always shows banner without checking beforeinstallprompt (for emulator/preview) */
    isPreview?: boolean
}

// Storage key for tracking installed PWAs per chatbot
const getInstalledKey = (chatbotId: string) => `pwa-installed-${chatbotId}`
const getDismissedKey = (chatbotId: string) => `pwa-dismissed-${chatbotId}`

export function PWAInstallBanner({ chatbot, onInstall, onDismiss, isMobile, isPreview }: PWAInstallBannerProps) {
    const chatbotId = (chatbot as any).id || 'default'
    const [dismissed, setDismissed] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isInstallable, setIsInstallable] = useState(false)
    const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false)
    
    // In preview/emulator mode, always show banner when pwaEnabled (skip install checks)
    const forceShowInPreview = isPreview && (chatbot as any).pwaEnabled

    // Check if already installed (from localStorage or display-mode)
    const checkIfInstalled = useCallback(() => {
        // Check localStorage for this specific chatbot
        try {
            const installed = localStorage.getItem(getInstalledKey(chatbotId))
            if (installed === 'true') {
                return true
            }
        } catch (e) {
            // localStorage not available
        }

        // Check if running in standalone mode (PWA installed)
        if (typeof window !== 'undefined') {
            // iOS Safari check
            if ((window.navigator as any).standalone === true) {
                return true
            }
            // Standard PWA check
            if (window.matchMedia('(display-mode: standalone)').matches) {
                return true
            }
            // Windows/Chrome installed check
            if (window.matchMedia('(display-mode: window-controls-overlay)').matches) {
                return true
            }
        }

        return false
    }, [chatbotId])

    // Check if previously dismissed (session-based, not persistent)
    const checkIfDismissed = useCallback(() => {
        try {
            // Use sessionStorage for dismiss state (resets on new session)
            const dismissedTime = sessionStorage.getItem(getDismissedKey(chatbotId))
            if (dismissedTime) {
                // Dismiss lasts for the session
                return true
            }
        } catch (e) {
            // sessionStorage not available
        }
        return false
    }, [chatbotId])

    // Listen for the beforeinstallprompt event
    useEffect(() => {
        // Check if already installed or dismissed
        if (checkIfInstalled()) {
            setIsAlreadyInstalled(true)
            return
        }
        if (checkIfDismissed()) {
            setDismissed(true)
            return
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsInstallable(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Also listen for appinstalled event to track when user installs
        const handleAppInstalled = () => {
            try {
                localStorage.setItem(getInstalledKey(chatbotId), 'true')
            } catch (e) {
                // localStorage not available
            }
            setIsAlreadyInstalled(true)
            setIsInstallable(false)
        }

        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [chatbotId, checkIfInstalled, checkIfDismissed])

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

    // Don't show if not enabled, already dismissed, already installed, or not on mobile
    // If isMobile prop is provided, strictly follow it.
    // If not provided, fallback to internal check (max-width: 1024px).
    const showBanner = isMobile !== undefined ? isMobile : isMobileOrTablet

    // In preview mode, show banner if pwaEnabled (regardless of install state)
    // In production mode, also check that it's not already installed
    if (!pwaEnabled || dismissed) {
        return null
    }
    
    // Skip installed check in preview mode (for emulator testing)
    if (!isPreview && isAlreadyInstalled) {
        return null
    }
    
    if (!showBanner) {
        return null
    }

    const handleInstall = async () => {
        if (deferredPrompt) {
            // Trigger the install prompt
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                // Mark as installed in localStorage
                try {
                    localStorage.setItem(getInstalledKey(chatbotId), 'true')
                } catch (e) {
                    // localStorage not available
                }
                setDeferredPrompt(null)
                setIsInstallable(false)
                setIsAlreadyInstalled(true)
                onInstall?.()
            }
        } else {
            // Fallback: open in new window for manual install instructions
            onInstall?.()
        }
    }

    const handleDismiss = () => {
        // Store dismiss in sessionStorage (resets on new session)
        try {
            sessionStorage.setItem(getDismissedKey(chatbotId), Date.now().toString())
        } catch (e) {
            // sessionStorage not available
        }
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

    // --- Container Styles ---
    let containerClass = "flex items-center justify-between pointer-events-auto"
    const isFloating = position === 'floating-top' || position === 'floating-bottom'

    if (position === 'floating-top') {
        containerClass += " fixed top-0 left-0 right-0 z-[5000]"
    } else if (position === 'floating-bottom') {
        containerClass += " absolute bottom-[90px] left-0 right-0 z-[50]"
    } else {
        containerClass += " border-b"
    }

    // granular shadow calculation
    const shadowX = (chatbot as any).pwaBannerShadowX || '0px'
    const shadowY = (chatbot as any).pwaBannerShadowY || (isFloating ? '4px' : '0px')
    const shadowBlur = (chatbot as any).pwaBannerShadowBlur || (isFloating ? '12px' : '0px')
    const shadowSpread = (chatbot as any).pwaBannerShadowSpread || '0px'
    const shadowColor = (chatbot as any).pwaBannerShadowColor || 'rgba(0,0,0,0.15)'
    const computedShadow = (chatbot as any).pwaBannerShadow || `${shadowX} ${shadowY} ${shadowBlur} ${shadowSpread} ${shadowColor}`

    // Merge styles
    const containerStyle: React.CSSProperties = {
        background: (chatbot as any).pwaBannerBgColor || '#ffffff',
        color: (chatbot as any).pwaBannerFontColor || '#000000',
        padding: (chatbot as any).pwaBannerPadding || '12px',
        margin: (chatbot as any).pwaBannerMargin || (isFloating ? '16px' : '0px'),
        borderRadius: (chatbot as any).pwaBannerBorderRadius || (isFloating ? '12px' : '0px'),
        boxShadow: computedShadow !== '0px 0px 0px 0px rgba(0,0,0,0.15)' ? computedShadow : (isFloating ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'),
        borderWidth: (chatbot as any).pwaBannerBorderWidth,
        borderColor: (chatbot as any).pwaBannerBorderColor,
        borderStyle: (chatbot as any).pwaBannerBorderWidth ? 'solid' : undefined,
        fontFamily: (chatbot as any).pwaBannerFontFamily,
        fontSize: (chatbot as any).pwaBannerFontSize,
    }

    // --- Button Styles ---
    const buttonStyle: React.CSSProperties = {
        backgroundColor: (chatbot as any).pwaBannerButtonBgColor || '#000000',
        color: (chatbot as any).pwaBannerButtonTextColor || '#ffffff',
        borderRadius: (chatbot as any).pwaBannerButtonBorderRadius || '4px',
        borderWidth: '0px',
        borderColor: 'transparent',
        fontSize: (chatbot as any).pwaBannerButtonFontSize || '13px',
    }

    return (
        <div className={containerClass} style={containerStyle}>
            <div className="flex items-center gap-3 overflow-hidden">
                <style jsx>{`
                   .install-btn:hover {
                      background-color: ${(chatbot as any).pwaBannerButtonHoverBgColor || (chatbot as any).pwaBannerButtonBgColor || '#333'} !important;
                      color: ${(chatbot as any).pwaBannerButtonHoverTextColor || (chatbot as any).pwaBannerButtonTextColor || '#ffffff'} !important;
                   }
                `}</style>
                <div className="w-10 h-10 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                    {(chatbot as any).pwaIconUrl || (chatbot as any).pwaThemeColor ? (
                        <img
                            src={(chatbot as any).pwaIconUrl}
                            alt="App"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.style.backgroundColor = (chatbot as any).pwaThemeColor || '#ddd'
                            }}
                        />
                    ) : (
                        <span className="text-xs font-bold text-gray-400">App</span>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold leading-tight truncate">
                        {(chatbot as any).pwaBannerTitleText || (chatbot as any).pwaBannerText || 'Install Application'}
                    </span>
                    <span className="text-xs opacity-80 truncate">
                        {(chatbot as any).pwaBannerDescriptionText || 'Add to home screen'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Button
                    size="sm"
                    className="install-btn h-8 px-4 font-medium transition-colors"
                    onClick={handleInstall}
                    style={buttonStyle}
                >
                    {(chatbot as any).pwaBannerButtonText || 'Install'}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-50 hover:opacity-100 hover:bg-black/5 rounded-full"
                    onClick={handleDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
