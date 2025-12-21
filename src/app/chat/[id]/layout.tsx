import { Metadata } from 'next'

interface ChatLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

/**
 * Generate dynamic metadata for the chat page based on chatbot configuration.
 * This enables PWA installation with chatbot-specific branding.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: chatbotId } = await params

  // Default metadata values
  const defaultMetadata: Metadata = {
    title: 'Chat Assistant',
    description: 'AI Chat Assistant',
    manifest: `/api/chat/${chatbotId}/manifest.json`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Chat',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }

  try {
    // Fetch chatbot configuration for PWA metadata
    // Use internal API since this runs on the server
    let baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Vercel URL doesn't include protocol
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    }

    // Ensure protocol
    if (!baseUrl.startsWith('http')) {
      baseUrl = `http://${baseUrl}`
    }
    const response = await fetch(`${baseUrl}/api/chatbots/${chatbotId}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      return defaultMetadata
    }

    const data = await response.json()
    const chatbot = data.chatbot

    if (!chatbot) {
      return defaultMetadata
    }

    // Build metadata from chatbot configuration
    const appName = chatbot.pwaAppName || chatbot.name || 'Chat Assistant'
    const description = chatbot.pwaDescription || chatbot.description || 'AI Chat Assistant'
    const themeColor = chatbot.pwaThemeColor || chatbot.primaryColor || '#3b82f6'
    const iconUrl = chatbot.pwaIconUrl || chatbot.logo

    return {
      title: appName,
      description: description,
      manifest: `/api/chat/${chatbotId}/manifest.json`,
      themeColor: themeColor,
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: chatbot.pwaShortName || appName.split(' ')[0] || 'Chat',
      },
      icons: iconUrl ? [
        { url: iconUrl, sizes: '192x192', type: 'image/png' },
        { url: iconUrl, sizes: '512x512', type: 'image/png' },
      ] : undefined,
      other: {
        'mobile-web-app-capable': 'yes',
      },
      openGraph: {
        title: appName,
        description: description,
        type: 'website',
        images: iconUrl ? [{ url: iconUrl }] : undefined,
      },
    }
  } catch (error) {
    console.error('Error generating chat page metadata:', error)
    return defaultMetadata
  }
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return children
}
