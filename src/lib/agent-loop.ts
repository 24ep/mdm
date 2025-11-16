import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface StopCondition {
  type: 'max_iterations' | 'timeout' | 'condition' | 'error_threshold'
  value: any
}

export interface HumanInLoopConfig {
  enabled: boolean
  pausePoints?: string[] // Points where to pause for human input
  timeout?: number // Timeout for human response
  notificationUrl?: string // URL to notify when human input is needed
}

export interface AgentLoopConfig {
  maxIterations?: number
  stopConditions?: StopCondition[]
  timeout?: number
  enableHumanInLoop?: boolean
  humanInLoopConfig?: HumanInLoopConfig
}

/**
 * Get agent loop configuration for a chatbot
 */
export async function getAgentLoopConfig(chatbotId: string): Promise<AgentLoopConfig | null> {
  const config = await prisma.chatbotAgentLoopConfig.findUnique({
    where: { chatbotId },
  })

  if (!config) {
    return null
  }

  return {
    maxIterations: config.maxIterations || undefined,
    stopConditions: config.stopConditions as unknown as StopCondition[] | undefined,
    timeout: config.timeout || undefined,
    enableHumanInLoop: config.enableHumanInLoop || false,
    humanInLoopConfig: config.humanInLoopConfig as unknown as HumanInLoopConfig | undefined,
  }
}

/**
 * Check if agent loop should stop based on conditions
 */
export function shouldStopLoop(
  config: AgentLoopConfig | null,
  currentIteration: number,
  startTime: number,
  errorCount: number = 0
): { shouldStop: boolean; reason?: string } {
  if (!config) {
    return { shouldStop: false }
  }

  // Check max iterations
  if (config.maxIterations && currentIteration >= config.maxIterations) {
    return { shouldStop: true, reason: 'max_iterations_reached' }
  }

  // Check timeout
  if (config.timeout && Date.now() - startTime > config.timeout) {
    return { shouldStop: true, reason: 'timeout' }
  }

  // Check stop conditions
  if (config.stopConditions) {
    for (const condition of config.stopConditions) {
      switch (condition.type) {
        case 'max_iterations':
          if (currentIteration >= condition.value) {
            return { shouldStop: true, reason: 'max_iterations_reached' }
          }
          break
        case 'timeout':
          if (Date.now() - startTime > condition.value) {
            return { shouldStop: true, reason: 'timeout' }
          }
          break
        case 'error_threshold':
          if (errorCount >= condition.value) {
            return { shouldStop: true, reason: 'error_threshold_reached' }
          }
          break
      }
    }
  }

  return { shouldStop: false }
}

