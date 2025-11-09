import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type WebhookEvent = 
  | 'budget_alert' 
  | 'budget_exceeded' 
  | 'rate_limit_exceeded' 
  | 'cost_threshold'

export interface WebhookPayload {
  event: WebhookEvent
  chatbotId: string
  timestamp: string
  data: Record<string, any>
}

/**
 * Send webhook notification to configured webhooks
 */
export async function sendWebhook(
  chatbotId: string,
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  try {
    const webhooks = await prisma.chatbotWebhook.findMany({
      where: {
        chatbotId,
        enabled: true,
        events: {
          has: event,
        },
      },
    })

    if (webhooks.length === 0) return

    const payload: WebhookPayload = {
      event,
      chatbotId,
      timestamp: new Date().toISOString(),
      data,
    }

    // Send to all matching webhooks
    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const signature = webhook.secret
            ? generateSignature(JSON.stringify(payload), webhook.secret)
            : undefined

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(signature && { 'X-Webhook-Signature': signature }),
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000), // 10 second timeout
          })

          if (!response.ok) {
            console.error(`Webhook failed for ${webhook.url}: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.error(`Error sending webhook to ${webhook.url}:`, error)
        }
      })
    )
  } catch (error) {
    console.error('Error in sendWebhook:', error)
  }
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

