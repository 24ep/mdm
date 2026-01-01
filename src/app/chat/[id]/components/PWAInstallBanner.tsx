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
