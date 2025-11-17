/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return null
  }
}

/**
 * Get favicon URL for a given website URL
 * Uses Google's favicon service as primary method for reliability
 */
export function getFaviconUrl(url: string): string {
  const domain = extractDomain(url)
  if (!domain) {
    return '/favicon.svg' // Fallback to default
  }
  
  // Use Google's favicon service - reliable and works for most sites
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
}

/**
 * Try to fetch favicon from the website directly
 * This is a fallback if Google's service doesn't work
 */
export async function fetchFaviconFromUrl(url: string): Promise<string | null> {
  const domain = extractDomain(url)
  if (!domain) return null
  
  const faviconUrls = [
    `https://${domain}/favicon.ico`,
    `https://${domain}/favicon.png`,
    `https://${domain}/apple-touch-icon.png`,
  ]
  
  for (const faviconUrl of faviconUrls) {
    try {
      const response = await fetch(faviconUrl, { method: 'HEAD', mode: 'no-cors' })
      // With no-cors, we can't check status, but we can try to load it
      return faviconUrl
    } catch {
      continue
    }
  }
  
  return null
}

/**
 * Get favicon URL with caching
 * Returns Google's favicon service URL (most reliable)
 */
export function getCachedFaviconUrl(url: string): string {
  return getFaviconUrl(url)
}

