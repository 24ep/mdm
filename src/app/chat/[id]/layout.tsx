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
    // Use direct DB access to avoid network roundtrips and timeouts
    const { db } = await import('@/lib/db')
    const { mergeVersionConfig } = await import('@/lib/chatbot-helper')

    // Fetch chatbot with versions to get the config
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!chatbot) {
      return defaultMetadata
    }

    // Merge version config to get all PWA properties
    const cb = mergeVersionConfig(chatbot)
    const appName = cb.pwaAppName || cb.name || 'Chat Assistant'
    const description = cb.pwaDescription || cb.description || 'AI Chat Assistant'
    const themeColor = cb.pwaThemeColor || cb.primaryColor || '#3b82f6'
    const iconUrl = cb.pwaIconUrl || cb.logo

    return {
      title: appName,
      description: description,
      manifest: `/api/chat/${chatbotId}/manifest.json`,
      themeColor: themeColor,
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: (chatbot as any).pwaShortName || appName.split(' ')[0] || 'Chat',
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
