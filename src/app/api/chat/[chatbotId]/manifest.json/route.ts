import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/chat/[chatbotId]/manifest.json
 * 
 * Returns a dynamic PWA manifest for the chatbot.
 * Used when users install the chat as a standalone PWA.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params

    // Fetch chatbot configuration
    const origin = request.headers.get('origin') || request.nextUrl.origin
    const chatbotResponse = await fetch(`${origin}/api/chatbots/${chatbotId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    let chatbot: any = null
    if (chatbotResponse.ok) {
      const data = await chatbotResponse.json()
      chatbot = data.chatbot
    }

    // Default values
    const defaultName = 'Chat Assistant'
    const defaultShortName = 'Chat'
    const defaultDescription = 'AI Chat Assistant'
    const defaultThemeColor = '#3b82f6'
    const defaultBackgroundColor = '#ffffff'
    const defaultDisplayMode = 'standalone'

    // Build manifest with chatbot-specific values or defaults
    const manifest = {
      name: chatbot?.pwaAppName || chatbot?.name || defaultName,
      short_name: chatbot?.pwaShortName || chatbot?.name?.split(' ')[0] || defaultShortName,
      description: chatbot?.pwaDescription || chatbot?.description || defaultDescription,
      start_url: `/chat/${chatbotId}?pwa=1&source=pwa`,
      scope: `/chat/${chatbotId}`,
      display: chatbot?.pwaDisplayMode || defaultDisplayMode,
      orientation: 'portrait-primary',
      theme_color: chatbot?.pwaThemeColor || chatbot?.primaryColor || defaultThemeColor,
      background_color: chatbot?.pwaBackgroundColor || defaultBackgroundColor,
      icons: generateIcons(chatbot?.pwaIconUrl || chatbot?.logo),
      categories: ['utilities', 'productivity'],
      lang: 'en',
      dir: 'ltr',
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error generating PWA manifest:', error)
    
    // Return a basic manifest on error
    const { chatbotId } = await params
    return NextResponse.json({
      name: 'Chat Assistant',
      short_name: 'Chat',
      start_url: `/chat/${chatbotId}`,
      display: 'standalone',
      theme_color: '#3b82f6',
      background_color: '#ffffff',
      icons: [],
    }, {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    })
  }
}

/**
 * Generate PWA icons array from a source icon URL
 * Returns multiple sizes for different device requirements
 */
function generateIcons(iconUrl: string | null | undefined) {
  if (!iconUrl) {
    // Return default placeholder icons
    return [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ]
  }

  // Use the provided icon URL for all sizes
  // The browser will scale as needed
  return [
    {
      src: iconUrl,
      sizes: '48x48',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: iconUrl,
      sizes: '72x72',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: iconUrl,
      sizes: '96x96',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: iconUrl,
      sizes: '128x128',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: iconUrl,
      sizes: '144x144',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: iconUrl,
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable',
    },
    {
      src: iconUrl,
      sizes: '256x256',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: iconUrl,
      sizes: '384x384',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: iconUrl,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable',
    },
  ]
}
