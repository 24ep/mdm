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

    // Check if already loaded in the target document
    if (targetDocument.getElementById(linkId)) return

    const link = targetDocument.createElement('link')
    link.id = linkId

    // Dynamically construct font URL
    // Use the clean name (preserving case for the URL, though Google Fonts API is generally case-insensitive or expects Title Case)
    // We'll trust the user/DB provided casing, but maybe Title Case is safer? 
    // Actually, usually DB has "Inter", "Open Sans". 
    // If it's "roboto", Google might redirect or fail? Google Fonts API usually handles "roboto" fine.
    // Let's us the cleaned name.
    const fontString = `${cleanFontName.replace(/ /g, '+')}:wght@300;400;500;600;700`

    link.href = `https://fonts.googleapis.com/css2?family=${fontString}&display=swap`
    link.rel = 'stylesheet'

    targetDocument.head.appendChild(link)
}
