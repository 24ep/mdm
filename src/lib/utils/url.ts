
/**
 * Sanitizes a URL to prevent XSS attacks like javascript: protocols.
 * @param url The URL to sanitize
 * @returns A sanitized URL string
 */
export function sanitizeUrl(url: string | undefined | null): string {
    if (!url) return ''

    // Remove whitespace and control characters
    const sanitizedUrl = url.trim().replace(/[^\x20-\x7E]/g, '')

    // Prevent javascript: and other dangerous protocols
    const isDangerous = /^(javascript|data|vbscript):/i.test(sanitizedUrl)

    if (isDangerous) {
        console.warn(`Blocked dangerous URL: ${sanitizedUrl}`)
        return 'about:blank'
    }

    return url
}
