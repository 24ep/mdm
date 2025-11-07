import { Message, ChatbotConfig } from '../types'

export interface SendMessageOptions {
  chatbot: ChatbotConfig
  content: string
  attachments?: Array<{ type: 'image' | 'video', url: string, name?: string }>
  conversationHistory: Message[]
  onStreamingUpdate?: (content: string) => void
}

export interface SendMessageResult {
  message: Message
  conversationId?: string
}

export async function sendMessageToEngine(options: SendMessageOptions): Promise<SendMessageResult> {
  const { chatbot, content, attachments, conversationHistory, onStreamingUpdate } = options

  // Handle OpenAI Agent SDK
  if (chatbot.engineType === 'openai-agent-sdk' && chatbot.openaiAgentSdkAgentId && chatbot.openaiAgentSdkApiKey) {
    return await sendToOpenAIAgentSDK(chatbot, content, attachments, conversationHistory, onStreamingUpdate)
  }

  // Handle Dify
  if (chatbot.engineType === 'dify' && chatbot.difyApiKey && chatbot.difyOptions?.apiBaseUrl) {
    return await sendToDify(chatbot, content, attachments, conversationHistory, onStreamingUpdate)
  }

  // Handle custom/other engines
  return await sendToCustomAPI(chatbot, content, attachments, conversationHistory)
}

async function sendToOpenAIAgentSDK(
  chatbot: ChatbotConfig,
  content: string,
  attachments: Array<{ type: 'image' | 'video', url: string, name?: string }> | undefined,
  conversationHistory: Message[],
  onStreamingUpdate?: (content: string) => void
): Promise<SendMessageResult> {
  const proxyUrl = '/api/openai-agent-sdk/chat-messages'
  
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: chatbot.openaiAgentSdkAgentId,
      apiKey: chatbot.openaiAgentSdkApiKey,
      model: chatbot.openaiAgentSdkModel,
      instructions: chatbot.openaiAgentSdkInstructions,
      reasoningEffort: chatbot.openaiAgentSdkReasoningEffort,
      store: chatbot.openaiAgentSdkStore,
      vectorStoreId: chatbot.openaiAgentSdkVectorStoreId,
      message: content.trim() || '',
      attachments: attachments || [],
      conversationHistory: conversationHistory.map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments
      }))
    })
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`OpenAI Agent SDK API request failed: ${response.status} ${errorText}`)
  }

  const contentType = response.headers.get('content-type')
  const isStreaming = contentType?.includes('text/event-stream') || contentType?.includes('text/plain')

  if (isStreaming && response.body && onStreamingUpdate) {
    return await handleStreamingResponse(response, onStreamingUpdate, chatbot)
  } else {
    const data = await response.json()
    return {
      message: {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.message || data.text || data.response || 'No response received',
        timestamp: new Date(),
        citations: chatbot.showCitations ? (data.citations || data.sources || []) : undefined
      }
    }
  }
}

async function sendToDify(
  chatbot: ChatbotConfig,
  content: string,
  attachments: Array<{ type: 'image' | 'video', url: string, name?: string }> | undefined,
  conversationHistory: Message[],
  onStreamingUpdate?: (content: string) => void
): Promise<SendMessageResult> {
  const difyOptions = chatbot.difyOptions!
  let apiBaseUrl = (difyOptions.apiBaseUrl || '').replace(/\/$/, '').replace(/\/v1$/, '')
  
  const files = (attachments || []).map(att => ({
    type: att.type === 'image' ? 'image' : att.type === 'video' ? 'video' : 'document',
    transfer_method: 'remote_url' as const,
    url: att.url
  }))

  const requestBody: any = {
    inputs: difyOptions.inputs || {},
    query: content.trim() || '',
    response_mode: difyOptions.responseMode || 'streaming',
    conversation_id: difyOptions.conversationId || '',
    user: difyOptions.user || 'user-' + Date.now(),
  }

  if (files.length > 0) {
    requestBody.files = files
  }

  const proxyUrl = '/api/dify/chat-messages'
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiBaseUrl, apiKey: chatbot.difyApiKey, requestBody })
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Dify API request failed: ${response.status} ${errorText}`)
  }

  if (difyOptions.responseMode === 'streaming' && response.body && onStreamingUpdate) {
    return await handleDifyStreamingResponse(response, onStreamingUpdate, chatbot)
  } else {
    const data = await response.json()
    return {
      message: {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || data.message || 'No response received',
        timestamp: new Date(),
        citations: chatbot.showCitations ? (data.metadata?.retriever_resources || []) : undefined
      }
    }
  }
}

async function sendToCustomAPI(
  chatbot: ChatbotConfig,
  content: string,
  attachments: Array<{ type: 'image' | 'video', url: string, name?: string }> | undefined,
  conversationHistory: Message[]
): Promise<SendMessageResult> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }

  if (chatbot.apiAuthType !== 'none' && chatbot.apiAuthValue) {
    if (chatbot.apiAuthType === 'bearer') {
      headers['Authorization'] = `Bearer ${chatbot.apiAuthValue}`
    } else if (chatbot.apiAuthType === 'api_key') {
      headers['X-API-Key'] = chatbot.apiAuthValue
    } else if (chatbot.apiAuthType === 'custom') {
      headers['X-Custom-Auth'] = chatbot.apiAuthValue
    }
  }

  const response = await fetch(chatbot.apiEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: content.trim() || '',
      attachments: attachments || [],
      conversation_history: conversationHistory.map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments
      }))
    })
  })

  if (!response.ok) {
    throw new Error('API request failed')
  }

  const data = await response.json()
  return {
    message: {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.response || data.message || data.text || 'No response received',
      timestamp: new Date(),
      citations: chatbot.showCitations ? (data.citations || data.sources || []) : undefined
    }
  }
}

async function handleStreamingResponse(
  response: Response,
  onStreamingUpdate: (content: string) => void,
  chatbot: ChatbotConfig
): Promise<SendMessageResult> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          if (data.content) {
            fullResponse += data.content
            onStreamingUpdate(fullResponse)
          }
        } catch (e) {
          // Skip invalid JSON
        }
      } else if (line.trim() && !line.startsWith('data:')) {
        fullResponse += line
        onStreamingUpdate(fullResponse)
      }
    }
  }

  return {
    message: {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: fullResponse || 'No response received',
      timestamp: new Date()
    }
  }
}

async function handleDifyStreamingResponse(
  response: Response,
  onStreamingUpdate: (content: string) => void,
  chatbot: ChatbotConfig
): Promise<SendMessageResult> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ''
  let conversationId = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          if (data.event === 'message') {
            fullResponse += data.answer || ''
            onStreamingUpdate(fullResponse)
          } else if (data.event === 'message_end') {
            conversationId = data.conversation_id || conversationId
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }

  return {
    message: {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: fullResponse || 'No response received',
      timestamp: new Date()
    },
    conversationId
  }
}

