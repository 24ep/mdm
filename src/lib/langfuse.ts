import { Langfuse } from 'langfuse'

// Initialize Langfuse client (singleton pattern)
let langfuseClient: Langfuse | null = null

export function getLangfuseClient(): Langfuse | null {
  // Only initialize if API keys are provided
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    return null
  }

  if (!langfuseClient) {
    langfuseClient = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
    })
  }

  return langfuseClient
}

// Helper to check if Langfuse is enabled
export function isLangfuseEnabled(): boolean {
  return !!(
    process.env.LANGFUSE_PUBLIC_KEY &&
    process.env.LANGFUSE_SECRET_KEY
  )
}

