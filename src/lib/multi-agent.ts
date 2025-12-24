import { db as prisma } from '@/lib/db'

export interface AgentConfig {
  agentId: string
  name: string
  instructions?: string
  model?: string
  tools?: any[]
  conditions?: any // Conditions for when to use this agent
}

export interface HandoffRule {
  fromAgent: string
  toAgent: string
  condition: string // Condition for handoff
  priority?: number
}

export interface MultiAgentConfig {
  enabled: boolean
  agents: AgentConfig[]
  handoffRules?: HandoffRule[]
  coordinationStrategy?: 'sequential' | 'parallel' | 'conditional'
}

/**
 * Get multi-agent configuration for a chatbot
 */
export async function getMultiAgentConfig(chatbotId: string): Promise<MultiAgentConfig | null> {
  const config = await prisma.chatbotMultiAgentConfig.findUnique({
    where: { chatbotId },
  })

  if (!config || !config.enabled) {
    return null
  }

  return {
    enabled: config.enabled,
    agents: config.agents as unknown as AgentConfig[],
    handoffRules: config.handoffRules as unknown as HandoffRule[] | undefined,
    coordinationStrategy: config.coordinationStrategy as 'sequential' | 'parallel' | 'conditional' | undefined,
  }
}

/**
 * Determine which agent to use based on context and handoff rules
 */
export function selectAgent(
  config: MultiAgentConfig,
  context: {
    message?: string
    conversationHistory?: any[]
    metadata?: any
  }
): AgentConfig | null {
  if (!config.enabled || config.agents.length === 0) {
    return null
  }

  // If only one agent, use it
  if (config.agents.length === 1) {
    return config.agents[0]
  }

  // Check handoff rules first
  if (config.handoffRules && config.handoffRules.length > 0) {
    for (const rule of config.handoffRules.sort((a, b) => (b.priority || 0) - (a.priority || 0))) {
      // Simple condition evaluation (in production, use a proper expression evaluator)
      if (evaluateCondition(rule.condition, context)) {
        const agent = config.agents.find((a) => a.agentId === rule.toAgent)
        if (agent) {
          return agent
        }
      }
    }
  }

  // Default to first agent
  return config.agents[0]
}

/**
 * Simple condition evaluator (basic implementation)
 * In production, use a proper expression evaluator library
 */
function evaluateCondition(condition: string, context: any): boolean {
  try {
    // Very basic condition evaluation
    // In production, use a proper library like expr-eval or similar
    if (condition.includes('message') && context.message) {
      // Example: "message.contains('help')"
      if (condition.includes('contains')) {
        const match = condition.match(/contains\(['"](.*?)['"]\)/)
        if (match && context.message.toLowerCase().includes(match[1].toLowerCase())) {
          return true
        }
      }
    }
    return false
  } catch {
    return false
  }
}

