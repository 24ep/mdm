import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type HookType = 'before_execution' | 'after_execution' | 'on_tool_call' | 'on_error' | 'on_handoff'

export interface LifecycleHook {
  id: string
  hookType: HookType
  enabled: boolean
  handlerType: 'api' | 'inline' | 'webhook'
  handlerUrl?: string
  handlerCode?: string
  metadata?: any
}

export interface HookContext {
  chatbotId: string
  agentId?: string
  threadId?: string
  message?: string
  toolName?: string
  toolArguments?: any
  error?: Error
  result?: any
  metadata?: any
}

/**
 * Get lifecycle hooks for a chatbot
 */
export async function getLifecycleHooks(
  chatbotId: string,
  hookType?: HookType
): Promise<LifecycleHook[]> {
  const where: any = {
    chatbotId,
    enabled: true,
  }

  if (hookType) {
    where.hookType = hookType
  }

  const hooks = await prisma.chatbotLifecycleHook.findMany({
    where,
    orderBy: {
      createdAt: 'asc',
    },
  })

  return hooks.map((h) => ({
    id: h.id,
    hookType: h.hookType as HookType,
    enabled: h.enabled,
    handlerType: h.handlerType as 'api' | 'inline' | 'webhook',
    handlerUrl: h.handlerUrl || undefined,
    handlerCode: h.handlerCode || undefined,
    metadata: h.metadata as any,
  }))
}

/**
 * Execute lifecycle hooks
 */
export async function executeLifecycleHooks(
  chatbotId: string,
  hookType: HookType,
  context: HookContext
): Promise<void> {
  const hooks = await getLifecycleHooks(chatbotId, hookType)

  for (const hook of hooks) {
    try {
      switch (hook.handlerType) {
        case 'api':
          if (hook.handlerUrl) {
            await fetch(hook.handlerUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                hookType,
                context,
                hookId: hook.id,
              }),
            })
          }
          break

        case 'inline':
          if (hook.handlerCode) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-implied-eval
              const fn = new Function('context', hook.handlerCode)
              await fn(context)
            } catch (error) {
              console.error(`Error executing inline hook ${hook.id}:`, error)
            }
          }
          break

        case 'webhook':
          if (hook.handlerUrl) {
            await fetch(hook.handlerUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                hookType,
                context,
                hookId: hook.id,
                timestamp: new Date().toISOString(),
              }),
            })
          }
          break
      }
    } catch (error) {
      console.error(`Error executing lifecycle hook ${hook.id}:`, error)
      // Don't throw - hooks should not break the main flow
    }
  }
}

