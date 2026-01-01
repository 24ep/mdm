export const GOOGLE_FONTS_MAP: Record<string, string> = {
    'Inter': 'Inter:wght@300;400;500;600;700',
    'Roboto': 'Roboto:wght@300;400;500;700',
    'Open Sans': 'Open+Sans:wght@300;400;500;600;700',
    'Lato': 'Lato:wght@300;400;700',
    'Montserrat': 'Montserrat:wght@300;400;500;600;700',
    'Poppins': 'Poppins:wght@300;400;500;600;700',
    'Source Sans Pro': 'Source+Sans+Pro:wght@300;400;600;700',
    'Nunito': 'Nunito:wght@300;400;600;700',
    'Raleway': 'Raleway:wght@300;400;500;600;700',
    'Ubuntu': 'Ubuntu:wght@300;400;500;700',
    'Outfit': 'Outfit:wght@300;400;500;600;700',
    'Work Sans': 'Work+Sans:wght@300;400;500;600;700'
}

// Global cache to track loaded fonts across all documents
const loadedFontsCache = new Set<string>()

// Debounce timer for font loading to prevent rapid successive loads
let fontLoadDebounceTimer: ReturnType<typeof setTimeout> | null = null

export const loadGoogleFont = (fontFamily: string, targetDocument: Document = document) => {
    if (!targetDocument || !fontFamily) return

    // Clean font family string (e.g. "Roboto, sans-serif" -> "Roboto")
    const cleanFontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim()

    // Skip generic font families and standard system fonts
    const systemFonts = [
        'inherit', 'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
        'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace',
        'initial', 'revert', 'arial', 'helvetica', 'times new roman', 'courier new', 'verdana'
    ]

    // Case-insensitive check against system fonts
    if (systemFonts.includes(cleanFontName.toLowerCase())) return

    const linkId = `google-font-${cleanFontName.toLowerCase().replace(/\s+/g, '-')}`
    const cacheKey = `${targetDocument.location?.href || 'default'}-${linkId}`

    // Check global cache first
    if (loadedFontsCache.has(cacheKey)) return

    // Check if already loaded in the target document
    if (targetDocument.getElementById(linkId)) {
        loadedFontsCache.add(cacheKey)
        return
    }

    // Debounce font loading to prevent rapid successive loads
    if (fontLoadDebounceTimer) {
        clearTimeout(fontLoadDebounceTimer)
    }

    fontLoadDebounceTimer = setTimeout(() => {
        // Double-check after debounce
        if (loadedFontsCache.has(cacheKey) || targetDocument.getElementById(linkId)) {
            loadedFontsCache.add(cacheKey)
            return
        }

        const link = targetDocument.createElement('link')
        link.id = linkId

        // Dynamically construct font URL
        const fontString = `${cleanFontName.replace(/ /g, '+')}:wght@300;400;500;600;700`

        link.href = `https://fonts.googleapis.com/css2?family=${fontString}&display=swap`
        link.rel = 'stylesheet'

        // Add to cache before appending to prevent duplicate loads
        loadedFontsCache.add(cacheKey)

        targetDocument.head.appendChild(link)
    }, 100) // 100ms debounce
}

/**
 * Preload commonly used fonts during app initialization
 */
export function preloadCommonFonts(fonts: string[] = ['Inter', 'Roboto']) {
    fonts.forEach(font => loadGoogleFont(font))
}

/**
 * Clear font cache (useful for testing)
 */
export function clearFontCache() {
    loadedFontsCache.clear()
}
