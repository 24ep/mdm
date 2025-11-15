/**
 * Parse @mentions from markdown content
 */

export interface Mention {
  userId?: string
  userName: string
  position: number
  length: number
}

/**
 * Parse @mentions from text content
 */
export function parseMentions(content: string): Mention[] {
  const mentions: Mention[] = []
  const mentionRegex = /@(\w+)/g
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      userName: match[1],
      position: match.index,
      length: match[0].length,
    })
  }

  return mentions
}

/**
 * Extract unique user names from mentions
 */
export function extractMentionedUsers(content: string): string[] {
  const mentions = parseMentions(content)
  const uniqueNames = new Set(mentions.map(m => m.userName))
  return Array.from(uniqueNames)
}

/**
 * Replace @mentions with formatted text
 */
export function formatMentions(content: string, format: (userName: string) => string): string {
  return content.replace(/@(\w+)/g, (match, userName) => {
    return format(userName)
  })
}

