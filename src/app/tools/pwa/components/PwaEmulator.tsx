'use client'

import { useState } from 'react'
import { Phone, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { PWAInstallBanner } from '@/app/chat/[id]/components/PWAInstallBanner'

interface PwaEmulatorProps {
  config: any
}

export function PwaEmulator({ config }: PwaEmulatorProps) {
  const themeColor = config.themeColor || '#ffffff'
  const bgColor = config.bgColor || '#ffffff'
  const iconUrl = config.iconUrl
  const name = config.shortName || config.name || 'My App'

  const [previewMode, setPreviewMode] = useState<'banner' | 'splash'>('banner')
  
  // Merge the new install banner config into the mock chatbot
  // We prioritize the new `installBannerConfig` object but also map basic fields for backward compat
  const mockChatbot: any = {
    pwaEnabled: true,
    pwaBannerText: `Install ${name}`,
    pwaIconUrl: iconUrl,
    pwaThemeColor: themeColor,
    pwaBackgroundColor: bgColor,
    // Inject the structured config directly
    installBannerConfig: config.installBannerConfig,
    // Fallbacks if structured config is missing
    pwaBannerPosition: 'floating-bottom', 
    pwaInstallScope: 'website',
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-muted/10">
      <div className="mb-6 flex flex-col items-center gap-3 w-[300px]">
         <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Phone className="h-4 w-4" /> Device Preview
         </div>
         <div className="flex bg-muted p-1 rounded-lg w-full">
            <button 
                onClick={() => setPreviewMode('banner')}
                className={cn(
                    "flex-1 text-xs py-1.5 px-3 rounded-md font-medium transition-all",
                    previewMode === 'banner' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
            >
                Install Banner
            </button>
            <button 
                onClick={() => setPreviewMode('splash')}
                className={cn(
                    "flex-1 text-xs py-1.5 px-3 rounded-md font-medium transition-all",
                    previewMode === 'splash' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
            >
                Loading Screen
            </button>
         </div>
      </div>

      <div className="relative w-[300px] h-[600px] bg-black rounded-[40px] shadow-2xl border-[8px] border-gray-800 overflow-hidden flex flex-col" style={{ transform: 'translateZ(0)' }}>
          {/* Status Bar */}
          <div className="h-8 w-full flex items-center justify-between px-6 text-white text-[10px] font-bold z-10 transition-colors duration-300" style={{ backgroundColor: previewMode === 'splash' ? bgColor : themeColor }}>
              <span style={{ color: previewMode === 'splash' && bgColor === '#ffffff' ? '#000' : '#fff' }}>9:41</span>
              <div className="flex gap-1" style={{ color: previewMode === 'splash' && bgColor === '#ffffff' ? '#000' : '#fff' }}>
                 <span>Signal</span>
                 <span>Wifi</span>
                 <span>Bat</span>
              </div>
          </div>

          {/* App Content Simulation */}
          <div className="flex-1 w-full relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
             
             {/* MODE: LOADING SCREEN (SPLASH) */}
             {previewMode === 'splash' && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in duration-300 z-20" style={{ backgroundColor: bgColor }}>
                    <div className="w-24 h-24 rounded-2xl mb-8 shadow-xl flex items-center justify-center bg-white overflow-hidden scale-110">
                       {iconUrl ? (
                          <img src={iconUrl} alt="icon" className="w-full h-full object-cover" />
                       ) : (
                          <div className="text-4xl">🚀</div>
                       )}
                    </div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: bgColor === '#ffffff' ? '#000000' : (themeColor === '#ffffff' ? '#000' : themeColor) }}>{name}</h1>
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin opacity-50" style={{ color: bgColor === '#ffffff' ? '#000' : '#fff' }} />
                    </div>
                 </div>
             )}

             {/* MODE: BANNER (BROWSER CONTEXT) */}
             {previewMode === 'banner' && (
                 <div className="absolute inset-0 flex flex-col animate-in fade-in duration-300">
                     {/* Fake browser bar */}
                     <div className="h-14 bg-gray-100 border-b flex items-center px-4 space-x-2 shrink-0">
                        <div className="flex-1 bg-white rounded-md h-8 flex items-center px-3 text-xs text-gray-500 shadow-sm">
                           <span className="truncate">{config.url || 'https://your-pwa.com'}</span>
                        </div>
                        <RefreshCw className="h-4 w-4 text-gray-500" />
                     </div>
                     
                     {/* Web Content Placeholder */}
                     <div className="flex-1 bg-white p-4 space-y-4 overflow-y-auto">
                        <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                            <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                        </div>
                        <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
                     </div>

                     {/* Install Banner Component */}
                     <div className="absolute inset-x-0 bottom-0 z-50">
                        <PWAInstallBanner 
                           chatbot={mockChatbot} 
                           isMobile={true} 
                           onDismiss={() => {}} // Don't actually hide it in preview mode on click
                        />
                     </div>
                 </div>
             )}
          </div>
          
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full z-[60]"></div>
      </div>
      
      <p className="mt-8 text-xs text-muted-foreground text-center max-w-xs">
         {previewMode === 'splash' 
            ? "Splash screen appears while your PWA is launching."
            : "Install banner appears when a user visits your site."}
      </p>
    </div>
  )
}

function Loader2(props: any) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    )
  }
