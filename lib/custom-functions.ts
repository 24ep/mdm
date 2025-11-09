import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CustomFunction {
  id: string
  name: string
  description: string
  parameters: any // JSON schema
  endpoint?: string
  code?: string
  executionType: 'api' | 'inline' | 'webhook'
  enabled: boolean
  metadata?: any
}

/**
 * Get custom functions for a chatbot
 */
export async function getCustomFunctions(chatbotId: string): Promise<CustomFunction[]> {
  const functions = await prisma.chatbotCustomFunction.findMany({
    where: {
      chatbotId,
      enabled: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return functions.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    parameters: f.parameters as any,
    endpoint: f.endpoint || undefined,
    code: f.code || undefined,
    executionType: f.executionType as 'api' | 'inline' | 'webhook',
    enabled: f.enabled,
    metadata: f.metadata as any,
  }))
}

/**
 * Convert custom functions to OpenAI function tool format
 */
export function convertToFunctionTools(functions: CustomFunction[]): any[] {
  return functions.map((func) => ({
    type: 'function',
    function: {
      name: func.name,
      description: func.description,
      parameters: func.parameters,
    },
  }))
}

/**
 * Execute a custom function
 */
export async function executeCustomFunction(
  functionId: string,
  arguments_: any,
  chatbotId: string
): Promise<any> {
  const func = await prisma.chatbotCustomFunction.findUnique({
    where: { id: functionId },
  })

  if (!func || !func.enabled) {
    throw new Error(`Function ${functionId} not found or disabled`)
  }

  switch (func.executionType) {
    case 'api':
      if (!func.endpoint) {
        throw new Error(`Function ${func.name} has no endpoint configured`)
      }
      const response = await fetch(func.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          arguments: arguments_,
          functionId: func.id,
          chatbotId,
        }),
      })
      if (!response.ok) {
        throw new Error(`Function execution failed: ${response.statusText}`)
      }
      return await response.json()

    case 'inline':
      if (!func.code) {
        throw new Error(`Function ${func.name} has no code configured`)
      }
      // Execute inline code in a sandboxed environment
      // Note: In production, use a proper sandbox like vm2 or isolated-vm
      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const fn = new Function('arguments', 'chatbotId', func.code)
        return fn(arguments_, chatbotId)
      } catch (error) {
        throw new Error(`Function execution error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

    case 'webhook':
      if (!func.endpoint) {
        throw new Error(`Function ${func.name} has no webhook URL configured`)
      }
      const webhookResponse = await fetch(func.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          arguments: arguments_,
          functionId: func.id,
          chatbotId,
          timestamp: new Date().toISOString(),
        }),
      })
      if (!webhookResponse.ok) {
        throw new Error(`Webhook call failed: ${webhookResponse.statusText}`)
      }
      return await webhookResponse.json()

    default:
      throw new Error(`Unknown execution type: ${func.executionType}`)
  }
}

