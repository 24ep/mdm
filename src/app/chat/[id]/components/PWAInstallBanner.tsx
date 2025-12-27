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

    // Debug logging
    useEffect(() => {
        if (pwaEnabled && !dismissed) {
            console.log('📱 PWA Banner attempting to render. Config:', {
                pwaEnabled,
                dismissed,
                bannerText: (chatbot as any).pwaBannerText,
                isMobile
            })
        }
    }, [pwaEnabled, dismissed, chatbot, isMobile])

    // Don't show if not enabled, already dismissed, or already installed
    // AND Only show on mobile
    if (!pwaEnabled || dismissed || !isMobile) {
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

    return (
        <div
            className={
                isOverlay
                    ? "absolute top-0 left-0 right-0 z-[100] flex items-center justify-between"
                    : "w-full flex items-center justify-between border-b"
            }
            style={{
                backgroundColor: (chatbot as any).pwaBannerBgColor || '#ffffff',
                color: (chatbot as any).pwaBannerFontColor || '#000000',
                fontFamily: (chatbot as any).pwaBannerFontFamily || undefined,
                fontSize: (chatbot as any).pwaBannerFontSize || undefined,
                borderRadius: (chatbot as any).pwaBannerBorderRadius || undefined,
                boxShadow: (chatbot as any).pwaBannerShadow || (isOverlay ? '0 2px 10px rgba(0,0,0,0.15)' : undefined),
                padding: (chatbot as any).pwaBannerPadding || '12px',
                margin: (chatbot as any).pwaBannerMargin || undefined,
                pointerEvents: 'auto', // Important: Ensure banner is clickable
                zIndex: isOverlay ? 100 : 50
            }}
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
