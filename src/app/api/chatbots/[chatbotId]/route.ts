import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'

// Helper function to merge version config into chatbot object
// Filters out undefined/null values from version config to prevent overwriting
// valid chatbot base values with undefined
function mergeVersionConfig(chatbot: any): any {
  if (!chatbot) return chatbot
  
  // Get the latest version config (first in the array since it's ordered by createdAt desc)
  const latestVersion = chatbot.versions && chatbot.versions.length > 0 ? chatbot.versions[0] : null
  const rawVersionConfig = latestVersion?.config || {}
  
  // Filter out undefined/null values from version config
  // This ensures we don't overwrite valid chatbot base values with undefined
  const versionConfig: Record<string, any> = {}
  for (const [key, value] of Object.entries(rawVersionConfig)) {
    if (value !== undefined && value !== null) {
      versionConfig[key] = value
    }
  }
  
  // Merge version config into chatbot object (version config takes precedence for config fields)
  return {
    ...chatbot,
    ...versionConfig,
    // Preserve essential chatbot fields
    id: chatbot.id,
    createdAt: chatbot.createdAt,
    updatedAt: chatbot.updatedAt,
    createdBy: chatbot.createdBy,
    spaceId: chatbot.spaceId,
    versions: chatbot.versions,
    creator: chatbot.creator,
    space: chatbot.space,
  }
}

// GET - Fetch a specific chatbot by ID
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { chatbotId } = await params

  const chatbot = await db.chatbot.findFirst({
    where: {
      id: chatbotId,
      deletedAt: null,
      OR: [
        { createdBy: session.user.id },
        { space: { members: { some: { userId: session.user.id } } } }
      ]
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  if (!chatbot) {
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
  }

  // Merge version config into chatbot object
  const mergedChatbot = mergeVersionConfig(chatbot)

  return NextResponse.json({ chatbot: mergedChatbot })
}

// PUT - Update a specific chatbot
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { chatbotId } = await params
  const body = await request.json()

  // Check if chatbot exists and user has access
  const existingChatbot = await db.chatbot.findFirst({
    where: {
      id: chatbotId,
      deletedAt: null,
      OR: [
        { createdBy: session.user.id },
        { space: { members: { some: { userId: session.user.id } } } }
      ]
    }
  })

  if (!existingChatbot) {
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
  }

  // Extract updatable fields from body
  const {
    name,
    website,
    description,
    apiEndpoint,
    apiAuthType,
    apiAuthValue,
    logo,
    primaryColor,
    fontFamily,
    fontSize,
    fontColor,
    borderColor,
    borderWidth,
    borderRadius,
    messageBoxColor,
    shadowColor,
    shadowBlur,
    conversationOpener,
    followUpQuestions,
    enableFileUpload,
    showCitations,
    deploymentType,
    isPublished,
    currentVersion,
    spaceId,
    customEmbedDomain,
    ...versionConfig
  } = body

  // Update the chatbot
  const updatedChatbot = await db.chatbot.update({
    where: { id: chatbotId },
    data: {
      ...(name !== undefined && { name }),
      ...(website !== undefined && { website }),
      ...(description !== undefined && { description }),
      ...(apiEndpoint !== undefined && { apiEndpoint }),
      ...(apiAuthType !== undefined && { apiAuthType }),
      ...(apiAuthValue !== undefined && { apiAuthValue }),
      ...(logo !== undefined && { logo }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(fontFamily !== undefined && { fontFamily }),
      ...(fontSize !== undefined && { fontSize }),
      ...(fontColor !== undefined && { fontColor }),
      ...(borderColor !== undefined && { borderColor }),
      ...(borderWidth !== undefined && { borderWidth }),
      ...(borderRadius !== undefined && { borderRadius }),
      ...(messageBoxColor !== undefined && { messageBoxColor }),
      ...(shadowColor !== undefined && { shadowColor }),
      ...(shadowBlur !== undefined && { shadowBlur }),
      ...(conversationOpener !== undefined && { conversationOpener }),
      ...(followUpQuestions !== undefined && { followUpQuestions }),
      ...(enableFileUpload !== undefined && { enableFileUpload }),
      ...(showCitations !== undefined && { showCitations }),
      ...(deploymentType !== undefined && { deploymentType }),
      ...(isPublished !== undefined && { isPublished }),
      ...(currentVersion !== undefined && { currentVersion }),
      ...(spaceId !== undefined && { spaceId }),
      ...(customEmbedDomain !== undefined && { customEmbedDomain }),
      updatedAt: new Date()
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  })

  // If there are version-specific config updates, create a new version
  const hasVersionConfig = Object.keys(versionConfig).length > 0
  if (hasVersionConfig) {
    // Get latest version config to merge with
    const latestVersion = updatedChatbot.versions[0]
    const existingConfig = latestVersion?.config || {}

    await db.chatbotVersion.create({
      data: {
        chatbotId,
        version: currentVersion || latestVersion?.version || '1.0.0',
        config: {
          ...existingConfig,
          ...versionConfig,
          name: name || existingConfig.name,
          website: website || existingConfig.website,
          description: description || existingConfig.description,
        },
        isPublished: isPublished || false,
        createdBy: session.user.id
      }
    })
  }

  // Refetch with updated versions
  const finalChatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  })

  // Merge version config into chatbot object
  const mergedChatbot = mergeVersionConfig(finalChatbot)

  return NextResponse.json({ chatbot: mergedChatbot })
}

// DELETE - Soft delete a chatbot
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { chatbotId } = await params

  // Check if chatbot exists and user has access (only owner can delete)
  const existingChatbot = await db.chatbot.findFirst({
    where: {
      id: chatbotId,
      deletedAt: null,
      createdBy: session.user.id // Only owner can delete
    }
  })

  if (!existingChatbot) {
    return NextResponse.json({ error: 'Chatbot not found or you do not have permission to delete it' }, { status: 404 })
  }

  // Soft delete - set deletedAt timestamp
  await db.chatbot.update({
    where: { id: chatbotId },
    data: {
      deletedAt: new Date()
    }
  })

  return NextResponse.json({ message: 'Chatbot deleted successfully' })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/chatbots/[chatbotId]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/chatbots/[chatbotId]')
