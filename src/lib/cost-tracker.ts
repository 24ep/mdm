import { prisma } from '@/lib/prisma'

interface CostRecord {
  chatbotId: string
  userId?: string
  threadId?: string
  traceId?: string
  cost: number
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  model?: string
  metadata?: Record<string, any>
}

interface BudgetConfig {
  enabled: boolean
  monthlyBudget?: number | null
  dailyBudget?: number | null
  alertThreshold: number
  alertEmail?: string | null
  trackPerUser: boolean
  trackPerThread: boolean
}

// OpenAI pricing (as of 2024, update as needed)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
  'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
  'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 },
  'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 },
  'gpt-3.5-turbo-16k': { input: 0.003 / 1000, output: 0.004 / 1000 },
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-3.5-turbo']
  return (inputTokens * pricing.input) + (outputTokens * pricing.output)
}

export async function recordCost(record: CostRecord): Promise<void> {
  await prisma.chatbotCostRecord.create({
    data: {
      chatbotId: record.chatbotId,
      userId: record.userId || null,
      threadId: record.threadId || null,
      traceId: record.traceId || null,
      cost: record.cost,
      inputTokens: record.inputTokens || null,
      outputTokens: record.outputTokens || null,
      totalTokens: record.totalTokens || null,
      model: record.model || null,
      metadata: record.metadata || {},
    },
  })

  // Check budget and send alerts if needed
  await checkBudget(record.chatbotId)
}

export async function checkBudget(chatbotId: string): Promise<void> {
  const budget = await prisma.chatbotCostBudget.findUnique({
    where: { chatbotId },
  })

  if (!budget || !budget.enabled) return

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Check daily budget
  if (budget.dailyBudget) {
    const dailyCost = await prisma.chatbotCostRecord.aggregate({
      where: {
        chatbotId,
        recordedAt: { gte: startOfDay },
      },
      _sum: { cost: true },
    })

    const dailyTotal = Number(dailyCost._sum.cost || 0)
    const dailyThreshold = Number(budget.dailyBudget) * budget.alertThreshold

    if (dailyTotal >= dailyThreshold) {
      // Send webhook if configured
      const { sendWebhook } = await import('@/lib/webhook-service')
      await sendWebhook(chatbotId, 'budget_alert', {
        type: 'daily',
        current: dailyTotal,
        budget: Number(budget.dailyBudget),
        threshold: dailyThreshold,
        percentage: ((dailyTotal / Number(budget.dailyBudget)) * 100).toFixed(1),
      }).catch(err => console.error('Failed to send budget alert webhook:', err))

      // Send alert email if configured
      if (budget.alertEmail) {
        const { NotificationService } = await import('@/lib/notifications')
        const percentage = ((dailyTotal / Number(budget.dailyBudget)) * 100).toFixed(1)
        await NotificationService.sendEmail({
          to: budget.alertEmail,
          subject: `⚠️ Budget Alert: ${percentage}% of Daily Budget Used`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
              <h2 style="color: #f59e0b;">Budget Alert</h2>
              <p>Your chatbot has reached <strong>${percentage}%</strong> of its daily budget.</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Current Spending:</strong> $${dailyTotal.toFixed(2)}</p>
                <p><strong>Daily Budget:</strong> $${budget.dailyBudget}</p>
                <p><strong>Remaining:</strong> $${(Number(budget.dailyBudget) - dailyTotal).toFixed(2)}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This is an automated alert. You can adjust your budget settings in the admin panel.</p>
            </div>
          `,
        }).catch(err => console.error('Failed to send budget alert email:', err))
      }
      console.warn(`Daily budget alert for chatbot ${chatbotId}: $${dailyTotal.toFixed(2)} / $${budget.dailyBudget}`)
    }

    if (dailyTotal >= Number(budget.dailyBudget)) {
      // Send webhook if configured
      const { sendWebhook } = await import('@/lib/webhook-service')
      await sendWebhook(chatbotId, 'budget_exceeded', {
        type: 'daily',
        current: dailyTotal,
        budget: Number(budget.dailyBudget),
        overBudget: dailyTotal - Number(budget.dailyBudget),
      }).catch(err => console.error('Failed to send budget exceeded webhook:', err))

      // Send critical alert email if configured
      if (budget.alertEmail) {
        const { NotificationService } = await import('@/lib/notifications')
        await NotificationService.sendEmail({
          to: budget.alertEmail,
          subject: `🚨 CRITICAL: Daily Budget Exceeded`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
              <h2 style="color: #dc2626;">Critical Budget Alert</h2>
              <p>Your chatbot has <strong>exceeded</strong> its daily budget. New requests will be blocked until the budget resets.</p>
              <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p><strong>Current Spending:</strong> $${dailyTotal.toFixed(2)}</p>
                <p><strong>Daily Budget:</strong> $${budget.dailyBudget}</p>
                <p><strong>Over Budget:</strong> $${(dailyTotal - Number(budget.dailyBudget)).toFixed(2)}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Please review your usage and adjust your budget if needed.</p>
            </div>
          `,
        }).catch(err => console.error('Failed to send critical budget alert email:', err))
      }
      throw new Error(`Daily budget exceeded: $${dailyTotal.toFixed(2)} / $${budget.dailyBudget}`)
    }
  }

  // Check monthly budget
  if (budget.monthlyBudget) {
    const monthlyCost = await prisma.chatbotCostRecord.aggregate({
      where: {
        chatbotId,
        recordedAt: { gte: startOfMonth },
      },
      _sum: { cost: true },
    })

    const monthlyTotal = Number(monthlyCost._sum.cost || 0)
    const monthlyThreshold = Number(budget.monthlyBudget) * budget.alertThreshold

    if (monthlyTotal >= monthlyThreshold) {
      // Send webhook if configured
      const { sendWebhook } = await import('@/lib/webhook-service')
      await sendWebhook(chatbotId, 'budget_alert', {
        type: 'monthly',
        current: monthlyTotal,
        budget: Number(budget.monthlyBudget),
        threshold: monthlyThreshold,
        percentage: ((monthlyTotal / Number(budget.monthlyBudget)) * 100).toFixed(1),
      }).catch(err => console.error('Failed to send budget alert webhook:', err))

      // Send alert email if configured
      if (budget.alertEmail) {
        const { NotificationService } = await import('@/lib/notifications')
        const percentage = ((monthlyTotal / Number(budget.monthlyBudget)) * 100).toFixed(1)
        await NotificationService.sendEmail({
          to: budget.alertEmail,
          subject: `⚠️ Budget Alert: ${percentage}% of Monthly Budget Used`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
              <h2 style="color: #f59e0b;">Budget Alert</h2>
              <p>Your chatbot has reached <strong>${percentage}%</strong> of its monthly budget.</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Current Spending:</strong> $${monthlyTotal.toFixed(2)}</p>
                <p><strong>Monthly Budget:</strong> $${budget.monthlyBudget}</p>
                <p><strong>Remaining:</strong> $${(Number(budget.monthlyBudget) - monthlyTotal).toFixed(2)}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This is an automated alert. You can adjust your budget settings in the admin panel.</p>
            </div>
          `,
        }).catch(err => console.error('Failed to send budget alert email:', err))
      }
      console.warn(`Monthly budget alert for chatbot ${chatbotId}: $${monthlyTotal.toFixed(2)} / $${budget.monthlyBudget}`)
    }

    if (monthlyTotal >= Number(budget.monthlyBudget)) {
      // Send webhook if configured
      const { sendWebhook } = await import('@/lib/webhook-service')
      await sendWebhook(chatbotId, 'budget_exceeded', {
        type: 'monthly',
        current: monthlyTotal,
        budget: Number(budget.monthlyBudget),
        overBudget: monthlyTotal - Number(budget.monthlyBudget),
      }).catch(err => console.error('Failed to send budget exceeded webhook:', err))

      // Send critical alert email if configured
      if (budget.alertEmail) {
        const { NotificationService } = await import('@/lib/notifications')
        await NotificationService.sendEmail({
          to: budget.alertEmail,
          subject: `🚨 CRITICAL: Monthly Budget Exceeded`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
              <h2 style="color: #dc2626;">Critical Budget Alert</h2>
              <p>Your chatbot has <strong>exceeded</strong> its monthly budget. New requests will be blocked until the budget resets.</p>
              <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p><strong>Current Spending:</strong> $${monthlyTotal.toFixed(2)}</p>
                <p><strong>Monthly Budget:</strong> $${budget.monthlyBudget}</p>
                <p><strong>Over Budget:</strong> $${(monthlyTotal - Number(budget.monthlyBudget)).toFixed(2)}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Please review your usage and adjust your budget if needed.</p>
            </div>
          `,
        }).catch(err => console.error('Failed to send critical budget alert email:', err))
      }
      throw new Error(`Monthly budget exceeded: $${monthlyTotal.toFixed(2)} / $${budget.monthlyBudget}`)
    }
  }
}

export async function getCostStats(
  chatbotId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalCost: number
  totalRequests: number
  averageCost: number
  costByModel: Record<string, number>
  costByUser?: Record<string, number>
  costByThread?: Record<string, number>
}> {
  const where: any = { chatbotId }
  if (startDate || endDate) {
    where.recordedAt = {}
    if (startDate) where.recordedAt.gte = startDate
    if (endDate) where.recordedAt.lte = endDate
  }

  const records = await prisma.chatbotCostRecord.findMany({ where })

  const totalCost = records.reduce((sum, r) => sum + Number(r.cost), 0)
  const totalRequests = records.length
  const averageCost = totalRequests > 0 ? totalCost / totalRequests : 0

  const costByModel: Record<string, number> = {}
  const costByUser: Record<string, number> = {}
  const costByThread: Record<string, number> = {}

  for (const record of records) {
    if (record.model) {
      costByModel[record.model] = (costByModel[record.model] || 0) + Number(record.cost)
    }
    // Only include user/thread breakdowns if tracking is enabled
    // Note: We check the budget config to see if tracking is enabled
    // For now, we'll include all data and let the UI filter if needed
    if (record.userId) {
      costByUser[record.userId] = (costByUser[record.userId] || 0) + Number(record.cost)
    }
    if (record.threadId) {
      costByThread[record.threadId] = (costByThread[record.threadId] || 0) + Number(record.cost)
    }
  }

  return {
    totalCost,
    totalRequests,
    averageCost,
    costByModel,
    ...(Object.keys(costByUser).length > 0 && { costByUser }),
    ...(Object.keys(costByThread).length > 0 && { costByThread }),
  }
}

/**
 * Get cost forecast based on historical data
 */
export async function getCostForecast(
  chatbotId: string,
  days: number = 30
): Promise<{
  forecastedCost: number
  forecastedDailyAverage: number
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
  historicalData: Array<{ date: string; cost: number }>
}> {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - days)

  const records = await prisma.chatbotCostRecord.findMany({
    where: {
      chatbotId,
      recordedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { recordedAt: 'asc' },
  })

  // Group by day
  const dailyCosts: Record<string, number> = {}
  for (const record of records) {
    const date = record.recordedAt.toISOString().split('T')[0]
    dailyCosts[date] = (dailyCosts[date] || 0) + Number(record.cost)
  }

  const historicalData = Object.entries(dailyCosts)
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (historicalData.length < 2) {
    return {
      forecastedCost: 0,
      forecastedDailyAverage: 0,
      trend: 'stable',
      confidence: 0,
      historicalData,
    }
  }

  // Simple linear regression for trend
  const n = historicalData.length
  const costs = historicalData.map((d) => d.cost)
  const avgCost = costs.reduce((a, b) => a + b, 0) / n

  // Calculate trend
  const firstHalf = costs.slice(0, Math.floor(n / 2))
  const secondHalf = costs.slice(Math.floor(n / 2))
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (secondAvg > firstAvg * 1.1) trend = 'increasing'
  else if (secondAvg < firstAvg * 0.9) trend = 'decreasing'

  // Forecast: simple average of recent days
  const recentDays = Math.min(7, historicalData.length)
  const recentCosts = costs.slice(-recentDays)
  const forecastedDailyAverage = recentCosts.reduce((a, b) => a + b, 0) / recentCosts.length
  const forecastedCost = forecastedDailyAverage * 30 // Forecast for next 30 days

  // Confidence based on data points
  const confidence = Math.min(1, historicalData.length / 30)

  return {
    forecastedCost,
    forecastedDailyAverage,
    trend,
    confidence,
    historicalData,
  }
}

export async function getBudgetConfig(chatbotId: string): Promise<BudgetConfig | null> {
  const budget = await prisma.chatbotCostBudget.findUnique({
    where: { chatbotId },
  })

  if (!budget) return null

  return {
    enabled: budget.enabled,
    monthlyBudget: budget.monthlyBudget ? Number(budget.monthlyBudget) : null,
    dailyBudget: budget.dailyBudget ? Number(budget.dailyBudget) : null,
    alertThreshold: budget.alertThreshold,
    alertEmail: budget.alertEmail,
    trackPerUser: budget.trackPerUser,
    trackPerThread: budget.trackPerThread,
  }
}

