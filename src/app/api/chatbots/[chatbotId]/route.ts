import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isUuid } from '@/lib/validation'
import { encryptApiKey, encrypt, decrypt } from '@/lib/encryption'
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

// Helper function to decrypt workflow code if encrypted
function decryptWorkflowCode(workflowCode: any): string | null {
  if (!workflowCode) return null
  if (typeof workflowCode !== 'string') return workflowCode
  
  try {
    // Try to decrypt - if it fails, assume it's plain text (backward compatibility)
    return decrypt(workflowCode)
  } catch (error) {
    // If decryption fails, it might be plain text
    return workflowCode
  }
}

// Helper function to merge version config into chatbot object
function mergeVersionConfig(chatbot: any): any {
  if (!chatbot) return chatbot
  
  // Get the latest version config (first in the array since it's ordered by createdAt desc)
  const latestVersion = chatbot.versions && chatbot.versions.length > 0 ? chatbot.versions[0] : null
  const versionConfig = latestVersion?.config || {}
  
  // Decrypt workflow code if present
  if (versionConfig.openaiAgentSdkWorkflowCode) {
    versionConfig.openaiAgentSdkWorkflowCode = decryptWorkflowCode(versionConfig.openaiAgentSdkWorkflowCode)
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    // Public endpoint - no auth required for published chatbots
    const { chatbotId } = await params
    
    // Validate UUID format before querying
    if (!isUuid(chatbotId)) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    const userId = session?.user?.id

    const chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        deletedAt: null,
        OR: [
          { isPublished: true },
          ...(userId ? [
            { createdBy: userId },
            { space: { members: { some: { userId } } } }
          ] : [])
        ]
      },
      include: {
        versions: {
          where: {
            OR: [
              { isPublished: true },
              ...(userId ? [{ createdBy: userId }] : [])
            ]
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }}
    
    // Merge version config into chatbot object
    const mergedChatbot = mergeVersionConfig(chatbot)
    
    return NextResponse.json({ chatbot: mergedChatbot })
  } catch (error: any) {
    console.error('Error fetching chatbot:', error)
    
    // Handle Prisma UUID validation errors
    if (error?.code === 'P2023' || error?.message?.includes('UUID')) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch chatbot',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { chatbotId } = await params
    
    // Validate UUID format before querying
    if (!isUuid(chatbotId)) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    const body = await request.json()

    // Check if chatbot exists and user has access
    const existingChatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        deletedAt: null,
        createdBy: session.user.id
      }
    })

  if (!existingChatbot) {
    return NextResponse.json({ error: 'Chatbot not found or access denied' }, { status: 404 })
  }

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
      isPublished,
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
      closeButtonOffsetY
    } = body

    // Get current version to determine next version number
    const currentChatbot = await db.chatbot.findFirst({
      where: { id: chatbotId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    
    const currentVersionNumber = currentChatbot?.currentVersion || '1.0.0'
    const latestVersion = currentChatbot?.versions?.[0]
    const existingConfig = (latestVersion?.config as any) || {}
    
    // Build new version config with all fields
    const newVersionConfig = {
      ...(existingConfig as any),
      name: name || existingConfig.name,
      website: website !== undefined ? website : existingConfig.website,
      description: description !== undefined ? description : existingConfig.description,
      engineType: engineType || existingConfig.engineType || 'custom',
      apiEndpoint: apiEndpoint || existingConfig.apiEndpoint,
      apiAuthType: apiAuthType !== undefined ? apiAuthType : existingConfig.apiAuthType,
      apiAuthValue: apiAuthValue !== undefined ? apiAuthValue : existingConfig.apiAuthValue,
      selectedModelId: selectedModelId !== undefined ? selectedModelId : existingConfig.selectedModelId,
      selectedEngineId: selectedEngineId !== undefined ? selectedEngineId : existingConfig.selectedEngineId,
      chatkitAgentId: chatkitAgentId !== undefined ? chatkitAgentId : existingConfig.chatkitAgentId,
      chatkitApiKey: chatkitApiKey !== undefined ? chatkitApiKey : existingConfig.chatkitApiKey,
      chatkitOptions: chatkitOptions !== undefined ? chatkitOptions : existingConfig.chatkitOptions,
      useChatKitInRegularStyle: useChatKitInRegularStyle !== undefined ? useChatKitInRegularStyle : existingConfig.useChatKitInRegularStyle,
      difyApiKey: difyApiKey !== undefined ? difyApiKey : existingConfig.difyApiKey,
      difyOptions: difyOptions !== undefined ? difyOptions : existingConfig.difyOptions,
      openaiAgentSdkAgentId: openaiAgentSdkAgentId !== undefined ? openaiAgentSdkAgentId : existingConfig.openaiAgentSdkAgentId,
      openaiAgentSdkApiKey: openaiAgentSdkApiKey !== undefined ? openaiAgentSdkApiKey : existingConfig.openaiAgentSdkApiKey,
      openaiAgentSdkModel: openaiAgentSdkModel !== undefined ? openaiAgentSdkModel : existingConfig.openaiAgentSdkModel,
      openaiAgentSdkInstructions: openaiAgentSdkInstructions !== undefined ? openaiAgentSdkInstructions : existingConfig.openaiAgentSdkInstructions,
      openaiAgentSdkReasoningEffort: openaiAgentSdkReasoningEffort !== undefined ? openaiAgentSdkReasoningEffort : existingConfig.openaiAgentSdkReasoningEffort,
      openaiAgentSdkStore: openaiAgentSdkStore !== undefined ? openaiAgentSdkStore : existingConfig.openaiAgentSdkStore,
      openaiAgentSdkVectorStoreId: openaiAgentSdkVectorStoreId !== undefined ? openaiAgentSdkVectorStoreId : existingConfig.openaiAgentSdkVectorStoreId,
      openaiAgentSdkEnableWebSearch: openaiAgentSdkEnableWebSearch !== undefined ? openaiAgentSdkEnableWebSearch : existingConfig.openaiAgentSdkEnableWebSearch,
      openaiAgentSdkEnableCodeInterpreter: openaiAgentSdkEnableCodeInterpreter !== undefined ? openaiAgentSdkEnableCodeInterpreter : existingConfig.openaiAgentSdkEnableCodeInterpreter,
      openaiAgentSdkEnableComputerUse: openaiAgentSdkEnableComputerUse !== undefined ? openaiAgentSdkEnableComputerUse : existingConfig.openaiAgentSdkEnableComputerUse,
      openaiAgentSdkEnableImageGeneration: openaiAgentSdkEnableImageGeneration !== undefined ? openaiAgentSdkEnableImageGeneration : existingConfig.openaiAgentSdkEnableImageGeneration,
      openaiAgentSdkUseWorkflowConfig: openaiAgentSdkUseWorkflowConfig !== undefined ? openaiAgentSdkUseWorkflowConfig : existingConfig.openaiAgentSdkUseWorkflowConfig,
      openaiAgentSdkGreeting: openaiAgentSdkGreeting !== undefined ? openaiAgentSdkGreeting : existingConfig.openaiAgentSdkGreeting,
      openaiAgentSdkPlaceholder: openaiAgentSdkPlaceholder !== undefined ? openaiAgentSdkPlaceholder : existingConfig.openaiAgentSdkPlaceholder,
      openaiAgentSdkBackgroundColor: openaiAgentSdkBackgroundColor !== undefined ? openaiAgentSdkBackgroundColor : existingConfig.openaiAgentSdkBackgroundColor,
      openaiAgentSdkWorkflowCode: openaiAgentSdkWorkflowCode !== undefined ? (openaiAgentSdkWorkflowCode ? encrypt(openaiAgentSdkWorkflowCode) : null) : existingConfig.openaiAgentSdkWorkflowCode,
      openaiAgentSdkWorkflowFile: openaiAgentSdkWorkflowFile !== undefined ? openaiAgentSdkWorkflowFile : existingConfig.openaiAgentSdkWorkflowFile,
      openaiAgentSdkRealtimePromptId: openaiAgentSdkRealtimePromptId !== undefined ? openaiAgentSdkRealtimePromptId : existingConfig.openaiAgentSdkRealtimePromptId,
      openaiAgentSdkRealtimePromptVersion: openaiAgentSdkRealtimePromptVersion !== undefined ? openaiAgentSdkRealtimePromptVersion : existingConfig.openaiAgentSdkRealtimePromptVersion,
      openaiAgentSdkGuardrails: openaiAgentSdkGuardrails !== undefined ? openaiAgentSdkGuardrails : existingConfig.openaiAgentSdkGuardrails,
      openaiAgentSdkInputGuardrails: openaiAgentSdkInputGuardrails !== undefined ? openaiAgentSdkInputGuardrails : existingConfig.openaiAgentSdkInputGuardrails,
      openaiAgentSdkOutputGuardrails: openaiAgentSdkOutputGuardrails !== undefined ? openaiAgentSdkOutputGuardrails : existingConfig.openaiAgentSdkOutputGuardrails,
      logo: logo !== undefined ? logo : existingConfig.logo,
      primaryColor: primaryColor !== undefined ? primaryColor : existingConfig.primaryColor,
      fontFamily: fontFamily !== undefined ? fontFamily : existingConfig.fontFamily,
      fontSize: fontSize !== undefined ? fontSize : existingConfig.fontSize,
      fontColor: fontColor !== undefined ? fontColor : existingConfig.fontColor,
      borderColor: borderColor !== undefined ? borderColor : existingConfig.borderColor,
      borderWidth: borderWidth !== undefined ? borderWidth : existingConfig.borderWidth,
      borderRadius: borderRadius !== undefined ? borderRadius : existingConfig.borderRadius,
      messageBoxColor: messageBoxColor !== undefined ? messageBoxColor : existingConfig.messageBoxColor,
      shadowColor: shadowColor !== undefined ? shadowColor : existingConfig.shadowColor,
      shadowBlur: shadowBlur !== undefined ? shadowBlur : existingConfig.shadowBlur,
      conversationOpener: conversationOpener !== undefined ? conversationOpener : existingConfig.conversationOpener,
      showStartConversation: (body as any).showStartConversation !== undefined ? (body as any).showStartConversation : existingConfig.showStartConversation,
      startScreenPrompts: (body as any).startScreenPrompts !== undefined ? (body as any).startScreenPrompts : existingConfig.startScreenPrompts,
      startScreenPromptsStyle: (body as any).startScreenPromptsStyle !== undefined ? (body as any).startScreenPromptsStyle : existingConfig.startScreenPromptsStyle,
      startScreenPromptsPosition: (body as any).startScreenPromptsPosition !== undefined ? (body as any).startScreenPromptsPosition : existingConfig.startScreenPromptsPosition,
      startScreenPromptsIconDisplay: (body as any).startScreenPromptsIconDisplay !== undefined ? (body as any).startScreenPromptsIconDisplay : existingConfig.startScreenPromptsIconDisplay,
      startScreenPromptsBackgroundColor: (body as any).startScreenPromptsBackgroundColor !== undefined ? (body as any).startScreenPromptsBackgroundColor : existingConfig.startScreenPromptsBackgroundColor,
      startScreenPromptsFontColor: (body as any).startScreenPromptsFontColor !== undefined ? (body as any).startScreenPromptsFontColor : existingConfig.startScreenPromptsFontColor,
      startScreenPromptsFontFamily: (body as any).startScreenPromptsFontFamily !== undefined ? (body as any).startScreenPromptsFontFamily : existingConfig.startScreenPromptsFontFamily,
      startScreenPromptsFontSize: (body as any).startScreenPromptsFontSize !== undefined ? (body as any).startScreenPromptsFontSize : existingConfig.startScreenPromptsFontSize,
      startScreenPromptsPadding: (body as any).startScreenPromptsPadding !== undefined ? (body as any).startScreenPromptsPadding : existingConfig.startScreenPromptsPadding,
      startScreenPromptsBorderColor: (body as any).startScreenPromptsBorderColor !== undefined ? (body as any).startScreenPromptsBorderColor : existingConfig.startScreenPromptsBorderColor,
      startScreenPromptsBorderWidth: (body as any).startScreenPromptsBorderWidth !== undefined ? (body as any).startScreenPromptsBorderWidth : existingConfig.startScreenPromptsBorderWidth,
      startScreenPromptsBorderRadius: (body as any).startScreenPromptsBorderRadius !== undefined ? (body as any).startScreenPromptsBorderRadius : existingConfig.startScreenPromptsBorderRadius,
      followUpQuestions: followUpQuestions !== undefined ? followUpQuestions : existingConfig.followUpQuestions,
      enableFileUpload: enableFileUpload !== undefined ? enableFileUpload : existingConfig.enableFileUpload,
      showCitations: showCitations !== undefined ? showCitations : existingConfig.showCitations,
      enableVoiceAgent: enableVoiceAgent !== undefined ? enableVoiceAgent : existingConfig.enableVoiceAgent,
      voiceProvider: voiceProvider !== undefined ? voiceProvider : existingConfig.voiceProvider,
      voiceUIStyle: voiceUIStyle !== undefined ? voiceUIStyle : existingConfig.voiceUIStyle,
      showMessageFeedback: showMessageFeedback !== undefined ? showMessageFeedback : existingConfig.showMessageFeedback,
      showMessageRetry: showMessageRetry !== undefined ? showMessageRetry : existingConfig.showMessageRetry,
      typingIndicatorStyle: typingIndicatorStyle !== undefined ? typingIndicatorStyle : existingConfig.typingIndicatorStyle,
      fileUploadLayout: fileUploadLayout !== undefined ? fileUploadLayout : existingConfig.fileUploadLayout,
      deploymentType: deploymentType !== undefined ? deploymentType : existingConfig.deploymentType,
      // Message font styling
      userMessageFontColor: userMessageFontColor !== undefined ? userMessageFontColor : existingConfig.userMessageFontColor,
      userMessageFontFamily: userMessageFontFamily !== undefined ? userMessageFontFamily : existingConfig.userMessageFontFamily,
      userMessageFontSize: userMessageFontSize !== undefined ? userMessageFontSize : existingConfig.userMessageFontSize,
      botMessageFontColor: botMessageFontColor !== undefined ? botMessageFontColor : existingConfig.botMessageFontColor,
      botMessageFontFamily: botMessageFontFamily !== undefined ? botMessageFontFamily : existingConfig.botMessageFontFamily,
      botMessageFontSize: botMessageFontSize !== undefined ? botMessageFontSize : existingConfig.botMessageFontSize,
      // Header configuration
      headerTitle: headerTitle !== undefined ? headerTitle : existingConfig.headerTitle,
      headerDescription: headerDescription !== undefined ? headerDescription : existingConfig.headerDescription,
      headerLogo: headerLogo !== undefined ? headerLogo : existingConfig.headerLogo,
      headerBgColor: headerBgColor !== undefined ? headerBgColor : existingConfig.headerBgColor,
      headerFontColor: headerFontColor !== undefined ? headerFontColor : existingConfig.headerFontColor,
      headerFontFamily: headerFontFamily !== undefined ? headerFontFamily : existingConfig.headerFontFamily,
      headerShowAvatar: headerShowAvatar !== undefined ? headerShowAvatar : existingConfig.headerShowAvatar,
      headerAvatarType: headerAvatarType !== undefined ? headerAvatarType : existingConfig.headerAvatarType,
      headerAvatarIcon: headerAvatarIcon !== undefined ? headerAvatarIcon : existingConfig.headerAvatarIcon,
      headerAvatarIconColor: headerAvatarIconColor !== undefined ? headerAvatarIconColor : existingConfig.headerAvatarIconColor,
      headerAvatarBackgroundColor: headerAvatarBackgroundColor !== undefined ? headerAvatarBackgroundColor : existingConfig.headerAvatarBackgroundColor,
      headerAvatarImageUrl: headerAvatarImageUrl !== undefined ? headerAvatarImageUrl : existingConfig.headerAvatarImageUrl,
      headerBorderEnabled: headerBorderEnabled !== undefined ? headerBorderEnabled : existingConfig.headerBorderEnabled,
      headerBorderColor: headerBorderColor !== undefined ? headerBorderColor : existingConfig.headerBorderColor,
      headerPaddingX: headerPaddingX !== undefined ? headerPaddingX : existingConfig.headerPaddingX,
      headerPaddingY: headerPaddingY !== undefined ? headerPaddingY : existingConfig.headerPaddingY,
      headerShowClearSession: headerShowClearSession !== undefined ? headerShowClearSession : existingConfig.headerShowClearSession,
      headerShowCloseButton: headerShowCloseButton !== undefined ? headerShowCloseButton : existingConfig.headerShowCloseButton,
      // Close button position
      closeButtonOffsetX: closeButtonOffsetX !== undefined ? closeButtonOffsetX : existingConfig.closeButtonOffsetX,
      closeButtonOffsetY: closeButtonOffsetY !== undefined ? closeButtonOffsetY : existingConfig.closeButtonOffsetY,
    }

    const chatbot = await db.chatbot.update({
      where: { id: chatbotId },
      data: {
        ...(name && { name }),
        ...(website !== undefined && { website }),
        ...(description !== undefined && { description }),
        ...(apiEndpoint && { apiEndpoint }),
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
        // Note: showStartConversation and startScreenPrompts* fields are stored in version config, not as direct Chatbot fields
        ...(followUpQuestions !== undefined && { followUpQuestions }),
        ...(enableFileUpload !== undefined && { enableFileUpload }),
        ...(showCitations !== undefined && { showCitations }),
        ...(deploymentType !== undefined && { deploymentType }),
        ...(isPublished !== undefined && { isPublished }),
        ...(currentVersion !== undefined && { currentVersion }),
        ...(spaceId !== undefined && { spaceId }),
        // Create new version with updated config
        versions: {
          create: {
            version: currentVersion || currentVersionNumber,
            config: newVersionConfig,
            isPublished: isPublished || false,
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
          take: 5
        }
      }
    })

    // Sync OpenAI API key to global provider config if provided
    if (openaiAgentSdkApiKey !== undefined) {
      await syncOpenAIApiKey(openaiAgentSdkApiKey, request, session.user)
    }

  // Merge version config into chatbot object
  const mergedChatbot = mergeVersionConfig(chatbot)

  return NextResponse.json({ chatbot: mergedChatbot })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/chatbots/[chatbotId]')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { chatbotId } = await params

  // Validate UUID format before querying
  if (!isUuid(chatbotId)) {
    return NextResponse.json(
      { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
      { status: 400 }
    )
  }

  // Check if chatbot exists and user has access
  const existingChatbot = await db.chatbot.findFirst({
    where: {
      id: chatbotId,
      deletedAt: null,
      createdBy: session.user.id
    }
  })

  if (!existingChatbot) {
    return NextResponse.json({ error: 'Chatbot not found or access denied' }, { status: 404 })
  }

  // Soft delete
  await db.chatbot.update({
    where: { id: chatbotId },
    data: { deletedAt: new Date() }
  })

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/chatbots/[chatbotId]')

