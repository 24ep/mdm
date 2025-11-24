import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { encryptApiKey } from '@/lib/encryption'
import { getSecretsManager } from '@/lib/secrets-manager'
import { createAuditContext } from '@/lib/audit-context-helper'

const prisma = db

// Helper function to sync OpenAI API key to global provider config
async function syncOpenAIApiKey(apiKey: string | null | undefined, request: NextRequest, user: any) {
  if (!apiKey) return

  try {
    // Check if OpenAI provider exists
    const existingProvider = await prisma.aIProviderConfig.findUnique({
      where: { provider: 'openai' }
    })

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    let encryptedApiKey: string | null = null

    if (apiKey) {
      if (useVault) {
        // Store in Vault with audit context
        const auditContext = createAuditContext(request, user, 'API key sync from chatbot')
        await secretsManager.storeSecret(
          `ai-providers/openai/api-key`,
          { apiKey },
          undefined,
          auditContext
        )
        encryptedApiKey = 'vault://openai'
      } else {
        // Use database encryption
        encryptedApiKey = encryptApiKey(apiKey)
      }
    }

    if (existingProvider) {
      // Update existing provider
      await prisma.aIProviderConfig.update({
        where: { provider: 'openai' },
        data: {
          apiKey: encryptedApiKey,
          isConfigured: !!apiKey,
          status: apiKey ? 'active' : 'inactive'
        }
      })
    } else {
      // Create new provider
      await prisma.aIProviderConfig.create({
        data: {
          provider: 'openai',
          name: 'OpenAI',
          description: 'Leading AI research company with GPT models',
          website: 'https://openai.com',
          icon: '🤖',
          apiKey: encryptedApiKey,
          isSupported: true,
          isConfigured: !!apiKey,
          status: apiKey ? 'active' : 'inactive'
        }
      })
    }
  } catch (error) {
    console.error('Error syncing OpenAI API key:', error)
    // Don't throw - this is a sync operation, shouldn't fail the main request
  }
}

// Helper function to merge version config into chatbot object
function mergeVersionConfig(chatbot: any): any {
  if (!chatbot) return chatbot
  
  // Get the latest version config (first in the array since it's ordered by createdAt desc)
  const latestVersion = chatbot.versions && chatbot.versions.length > 0 ? chatbot.versions[0] : null
  const versionConfig = latestVersion?.config || {}
  
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')
    const isPublished = searchParams.get('isPublished')

    const where: any = {
      deletedAt: null,
      OR: [
        { createdBy: session.user.id },
        { space: { members: { some: { userId: session.user.id } } } }
      ]
    }

    if (spaceId) {
      where.spaceId = spaceId
    }

    if (isPublished !== null) {
      where.isPublished = isPublished === 'true'
    }

    const chatbots = await db.chatbot.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Merge version config into each chatbot
    const mergedChatbots = chatbots.map(mergeVersionConfig)
    
    return NextResponse.json({ chatbots: mergedChatbots })
  } catch (error) {
    console.error('Error fetching chatbots:', error)
    return NextResponse.json({ error: 'Failed to fetch chatbots' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      website,
      description,
      engineType,
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
      enableVoiceAgent,
      voiceProvider,
      voiceUIStyle,
      deploymentType,
      currentVersion,
      spaceId,
      selectedModelId,
      selectedEngineId,
      chatkitAgentId,
      chatkitApiKey,
      chatkitOptions,
      openaiAgentSdkAgentId,
      openaiAgentSdkApiKey,
      openaiAgentSdkModel,
      openaiAgentSdkInstructions,
      openaiAgentSdkReasoningEffort,
      openaiAgentSdkStore,
      openaiAgentSdkVectorStoreId,
      openaiAgentSdkEnableWebSearch,
      openaiAgentSdkEnableCodeInterpreter,
      openaiAgentSdkEnableComputerUse,
      openaiAgentSdkEnableImageGeneration,
      openaiAgentSdkUseWorkflowConfig,
      openaiAgentSdkGreeting,
      openaiAgentSdkPlaceholder,
      openaiAgentSdkBackgroundColor,
      openaiAgentSdkWorkflowCode,
      openaiAgentSdkWorkflowFile,
      openaiAgentSdkRealtimePromptId,
      openaiAgentSdkRealtimePromptVersion,
      openaiAgentSdkGuardrails,
      openaiAgentSdkInputGuardrails,
      openaiAgentSdkOutputGuardrails,
      // Dify specific
      difyApiKey,
      difyOptions,
      // ChatKit specific
      useChatKitInRegularStyle,
      // Message display options
      showMessageFeedback,
      showMessageRetry,
      typingIndicatorStyle,
      fileUploadLayout,
      // Message font styling
      userMessageFontColor,
      userMessageFontFamily,
      userMessageFontSize,
      botMessageFontColor,
      botMessageFontFamily,
      botMessageFontSize,
      // Header configuration
      headerTitle,
      headerDescription,
      headerLogo,
      headerBgColor,
      headerFontColor,
      headerFontFamily,
      headerShowAvatar,
      headerAvatarType,
      headerAvatarIcon,
      headerAvatarIconColor,
      headerAvatarBackgroundColor,
      headerAvatarImageUrl,
      headerBorderEnabled,
      headerBorderColor,
      headerPaddingX,
      headerPaddingY,
      headerShowClearSession,
      headerShowCloseButton,
      // Close button position
      closeButtonOffsetX,
      closeButtonOffsetY,
      // Send button configuration
      sendButtonWidth,
      sendButtonHeight,
      sendButtonPosition
    } = body

    // Validate required fields based on engine type
    if (!name || !website) {
      return NextResponse.json({ error: 'Missing required fields: name and website are required' }, { status: 400 })
    }

    const engine = engineType || 'custom'
    
    if (engine === 'custom') {
      if (!apiEndpoint) {
        return NextResponse.json({ error: 'Missing required fields: API Endpoint is required for custom engine type' }, { status: 400 })
      }
    } else if (engine === 'openai') {
      if (!selectedModelId) {
        return NextResponse.json({ error: 'Missing required fields: OpenAI Model is required' }, { status: 400 })
      }
    } else if (engine === 'chatkit') {
      if (!chatkitAgentId) {
        return NextResponse.json({ error: 'Missing required fields: Agent Builder Agent ID is required for ChatKit' }, { status: 400 })
      }
    } else if (engine === 'openai-agent-sdk') {
      if (!openaiAgentSdkAgentId) {
        return NextResponse.json({ error: 'Missing required fields: Agent/Workflow ID is required for OpenAI Agent SDK' }, { status: 400 })
      }
      if (!openaiAgentSdkApiKey) {
        return NextResponse.json({ error: 'Missing required fields: OpenAI API Key is required for OpenAI Agent SDK' }, { status: 400 })
      }
    }
    
    // For non-custom engines, use a placeholder for apiEndpoint if not provided (database requires it)
    const finalApiEndpoint = apiEndpoint || (engine === 'custom' ? '' : 'https://api.openai.com/v1')

    // Create chatbot
    const chatbot = await db.chatbot.create({
      data: {
        name,
        website: website || null,
        description: description || null,
        apiEndpoint: finalApiEndpoint,
        apiAuthType: apiAuthType || 'none',
        apiAuthValue: apiAuthValue || null,
        logo: logo || null,
        primaryColor: primaryColor || null,
        fontFamily: fontFamily || null,
        fontSize: fontSize || null,
        fontColor: fontColor || null,
        borderColor: borderColor || null,
        borderWidth: borderWidth || null,
        borderRadius: borderRadius || null,
        messageBoxColor: messageBoxColor || null,
        shadowColor: shadowColor || null,
        shadowBlur: shadowBlur || null,
              conversationOpener: conversationOpener || null,
              followUpQuestions: followUpQuestions || [],
              enableFileUpload: enableFileUpload || false,
              showCitations: showCitations !== undefined ? showCitations : true,
              deploymentType: deploymentType || 'popover',
        isPublished: false,
        currentVersion: currentVersion || null,
        createdBy: session.user.id,
        spaceId: spaceId || null,
        versions: {
          create: {
            version: currentVersion || '1.0.0',
            config: {
              name,
              website,
              description,
              engineType: engine || 'custom',
              apiEndpoint,
              apiAuthType: apiAuthType || 'none',
              apiAuthValue: apiAuthValue || null,
              selectedModelId: selectedModelId || null,
              selectedEngineId: selectedEngineId || null,
              chatkitAgentId: chatkitAgentId || null,
              chatkitApiKey: chatkitApiKey || null,
              chatkitOptions: chatkitOptions || null,
              useChatKitInRegularStyle: useChatKitInRegularStyle !== undefined ? useChatKitInRegularStyle : null,
              difyApiKey: difyApiKey || null,
              difyOptions: difyOptions || null,
              openaiAgentSdkAgentId: openaiAgentSdkAgentId || null,
              openaiAgentSdkApiKey: openaiAgentSdkApiKey || null,
              openaiAgentSdkModel: openaiAgentSdkModel || null,
              openaiAgentSdkInstructions: openaiAgentSdkInstructions || null,
              openaiAgentSdkReasoningEffort: openaiAgentSdkReasoningEffort || null,
              openaiAgentSdkStore: openaiAgentSdkStore !== undefined ? openaiAgentSdkStore : null,
              openaiAgentSdkVectorStoreId: openaiAgentSdkVectorStoreId || null,
              openaiAgentSdkEnableWebSearch: openaiAgentSdkEnableWebSearch !== undefined ? openaiAgentSdkEnableWebSearch : null,
              openaiAgentSdkEnableCodeInterpreter: openaiAgentSdkEnableCodeInterpreter !== undefined ? openaiAgentSdkEnableCodeInterpreter : null,
              openaiAgentSdkEnableComputerUse: openaiAgentSdkEnableComputerUse !== undefined ? openaiAgentSdkEnableComputerUse : null,
              openaiAgentSdkEnableImageGeneration: openaiAgentSdkEnableImageGeneration !== undefined ? openaiAgentSdkEnableImageGeneration : null,
              openaiAgentSdkUseWorkflowConfig: openaiAgentSdkUseWorkflowConfig !== undefined ? openaiAgentSdkUseWorkflowConfig : null,
              openaiAgentSdkGreeting: openaiAgentSdkGreeting || null,
              openaiAgentSdkPlaceholder: openaiAgentSdkPlaceholder || null,
              openaiAgentSdkBackgroundColor: openaiAgentSdkBackgroundColor || null,
              openaiAgentSdkWorkflowCode: openaiAgentSdkWorkflowCode || null,
              openaiAgentSdkWorkflowFile: openaiAgentSdkWorkflowFile || null,
              openaiAgentSdkRealtimePromptId: openaiAgentSdkRealtimePromptId || null,
              openaiAgentSdkRealtimePromptVersion: openaiAgentSdkRealtimePromptVersion || null,
              openaiAgentSdkGuardrails: openaiAgentSdkGuardrails !== undefined ? openaiAgentSdkGuardrails : null,
              openaiAgentSdkInputGuardrails: openaiAgentSdkInputGuardrails !== undefined ? openaiAgentSdkInputGuardrails : null,
              openaiAgentSdkOutputGuardrails: openaiAgentSdkOutputGuardrails !== undefined ? openaiAgentSdkOutputGuardrails : null,
              logo: logo || null,
              primaryColor: primaryColor || null,
              fontFamily: fontFamily || null,
              fontSize: fontSize || null,
              fontColor: fontColor || null,
              borderColor: borderColor || null,
              borderWidth: borderWidth || null,
              borderRadius: borderRadius || null,
              messageBoxColor: messageBoxColor || null,
              shadowColor: shadowColor || null,
              shadowBlur: shadowBlur || null,
              conversationOpener: conversationOpener || null,
              showStartConversation: (body as any).showStartConversation !== undefined ? (body as any).showStartConversation : null,
              startScreenPrompts: (body as any).startScreenPrompts || null,
              startScreenPromptsStyle: (body as any).startScreenPromptsStyle || null,
              startScreenPromptsPosition: (body as any).startScreenPromptsPosition || null,
              startScreenPromptsIconDisplay: (body as any).startScreenPromptsIconDisplay || null,
              startScreenPromptsBackgroundColor: (body as any).startScreenPromptsBackgroundColor || null,
              startScreenPromptsFontColor: (body as any).startScreenPromptsFontColor || null,
              startScreenPromptsFontFamily: (body as any).startScreenPromptsFontFamily || null,
              startScreenPromptsFontSize: (body as any).startScreenPromptsFontSize || null,
              startScreenPromptsPadding: (body as any).startScreenPromptsPadding || null,
              startScreenPromptsBorderColor: (body as any).startScreenPromptsBorderColor || null,
              startScreenPromptsBorderWidth: (body as any).startScreenPromptsBorderWidth || null,
              startScreenPromptsBorderRadius: (body as any).startScreenPromptsBorderRadius || null,
              followUpQuestions: followUpQuestions || [],
              enableFileUpload: enableFileUpload || false,
              showCitations: showCitations !== undefined ? showCitations : true,
              deploymentType: deploymentType || 'popover',
              // Message font styling
              userMessageFontColor: userMessageFontColor || null,
              userMessageFontFamily: userMessageFontFamily || null,
              userMessageFontSize: userMessageFontSize || null,
              botMessageFontColor: botMessageFontColor || null,
              botMessageFontFamily: botMessageFontFamily || null,
              botMessageFontSize: botMessageFontSize || null,
              // Header configuration
              headerTitle: headerTitle || null,
              headerDescription: headerDescription || null,
              headerLogo: headerLogo || null,
              headerBgColor: headerBgColor || null,
              headerFontColor: headerFontColor || null,
              headerFontFamily: headerFontFamily || null,
              headerShowAvatar: headerShowAvatar !== undefined ? headerShowAvatar : null,
              headerAvatarType: headerAvatarType || null,
              headerAvatarIcon: headerAvatarIcon || null,
              headerAvatarIconColor: headerAvatarIconColor || null,
              headerAvatarBackgroundColor: headerAvatarBackgroundColor || null,
              headerAvatarImageUrl: headerAvatarImageUrl || null,
              headerBorderEnabled: headerBorderEnabled !== undefined ? headerBorderEnabled : null,
              headerBorderColor: headerBorderColor || null,
              headerPaddingX: headerPaddingX || null,
              headerPaddingY: headerPaddingY || null,
              headerShowClearSession: headerShowClearSession !== undefined ? headerShowClearSession : null,
              headerShowCloseButton: headerShowCloseButton !== undefined ? headerShowCloseButton : null,
              // Close button position
              closeButtonOffsetX: closeButtonOffsetX || null,
              closeButtonOffsetY: closeButtonOffsetY || null,
              // Send button configuration
              sendButtonWidth: sendButtonWidth || null,
              sendButtonHeight: sendButtonHeight || null,
              sendButtonPosition: sendButtonPosition || 'outside'
            },
            isPublished: false,
            createdBy: session.user.id
          }
        }
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
          take: 1
        }
      }
    })

    // Sync OpenAI API key to global provider config if provided
    if (openaiAgentSdkApiKey) {
      await syncOpenAIApiKey(openaiAgentSdkApiKey, request, session.user)
    }

    // Merge version config into chatbot object
    const mergedChatbot = mergeVersionConfig(chatbot)

    return NextResponse.json({ chatbot: mergedChatbot }, { status: 201 })
  } catch (error) {
    console.error('Error creating chatbot:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error && 'stack' in error ? (error as any).stack : undefined
    return NextResponse.json({ 
      error: 'Failed to create chatbot',
      details: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorDetails })
    }, { status: 500 })
  }
}

