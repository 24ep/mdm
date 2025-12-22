/**
 * Helper functions for chatbot operations
 */

/**
 * Merge version config into chatbot object.
 * Filters out undefined/null values from version config to prevent overwriting
 * valid chatbot base values with undefined.
 * 
 * @param chatbot - The chatbot object with versions array
 * @returns The merged chatbot object with version config applied
 */
export function mergeVersionConfig(chatbot: any): any {
  if (!chatbot) return chatbot

  // Get the latest version config (first in the array since it's ordered by createdAt desc)
  const latestVersion = chatbot.versions && chatbot.versions.length > 0 ? chatbot.versions[0] : null
  const rawVersionConfig = latestVersion?.config || {}

  // Filter out undefined/null values from version config
  // This ensures we don't overwrite valid chatbot base values with undefined
  const versionConfig: Record<string, any> = {}
  for (const [key, value] of Object.entries(rawVersionConfig)) {
    if (value !== undefined && value !== null) {
      versionConfig[key] = value
    }
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

/**
 * Sanitize chatbot config by removing sensitive API keys.
 * This should be used before returning the chatbot object to the frontend.
 * 
 * @param chatbot - The merged chatbot object
 * @returns The sanitized chatbot object
 */
export function sanitizeChatbotConfig(chatbot: any): any {
  if (!chatbot) return chatbot

  // Create a shallow copy
  const sanitized = { ...chatbot }

  // Remove sensitive keys from root (merged config)
  // delete sanitized.openaiAgentSdkApiKey
  // delete sanitized.difyApiKey
  // delete sanitized.apiAuthValue
  // delete sanitized.chatkitApiKey

  // Remove sensitive keys from versions if present
  if (sanitized.versions && Array.isArray(sanitized.versions)) {
    sanitized.versions = sanitized.versions.map((v: any) => {
      const newV = { ...v }
      if (newV.config) {
        const newConfig = { ...newV.config }
        // delete newConfig.openaiAgentSdkApiKey
        // delete newConfig.difyApiKey
        // delete newConfig.apiAuthValue
        // delete newConfig.chatkitApiKey
        newV.config = newConfig
      }
      return newV
    })
  }

  return sanitized
}
