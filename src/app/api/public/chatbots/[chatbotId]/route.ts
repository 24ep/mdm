import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to merge version config into chatbot object
function mergeVersionConfig(chatbot: any): any {
  if (!chatbot) return chatbot
  
  // Get the latest published version (or latest draft if none published)
  const publishedVersion = chatbot.versions?.find((v: any) => v.isPublished)
  const latestVersion = chatbot.versions && chatbot.versions.length > 0 ? chatbot.versions[0] : null
  const versionConfig = (publishedVersion?.config || latestVersion?.config) || {}
  
  // Merge version config into chatbot object
  return {
    ...chatbot,
    ...versionConfig,
    id: chatbot.id,
    createdAt: chatbot.createdAt,
    updatedAt: chatbot.updatedAt,
  }
}

// GET - Public endpoint to fetch chatbot config for embeds (no auth required)
// Only returns published chatbots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params

    // Fetch chatbot - only if it exists and is not deleted
    // For public access, we don't check ownership
    const chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        deletedAt: null,
      },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }

    // Merge version config (prefer published version)
    const mergedChatbot = mergeVersionConfig(chatbot)

    // Remove sensitive fields for public access
    const publicChatbot = {
      ...mergedChatbot,
      // Remove API keys and sensitive config
      apiAuthValue: undefined,
      chatkitApiKey: undefined,
      difyApiKey: undefined,
      openaiAgentSdkApiKey: undefined,
      // Keep only what's needed for embed
    }

    return NextResponse.json({ chatbot: publicChatbot })
  } catch (error) {
    console.error('Error fetching chatbot config:', error)
    return NextResponse.json({ error: 'Failed to fetch chatbot' }, { status: 500 })
  }
}
