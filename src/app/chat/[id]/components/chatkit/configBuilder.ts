import { ChatbotConfig } from '../../types'
import { convertToHex, isLightColor } from './themeUtils'

export const buildChatKitTheme = (chatbot: ChatbotConfig) => {
    const chatkitOptions = chatbot.chatkitOptions || {}
    const validTheme: any = {}

    if (chatkitOptions.theme) {
        // Validate colorScheme - handle 'system' by detecting browser preference
        const colorScheme = chatkitOptions.theme.colorScheme as 'light' | 'dark' | 'system' | undefined
        if (colorScheme) {
            if (colorScheme === 'system') {
                // Detect system preference for light/dark mode
                const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                validTheme.colorScheme = prefersDark ? 'dark' : 'light'
            } else if (colorScheme === 'light' || colorScheme === 'dark') {
                validTheme.colorScheme = colorScheme
            }
        }

        // Validate density
        if (chatkitOptions.theme.density &&
            ['compact', 'normal', 'spacious'].includes(chatkitOptions.theme.density)) {
            validTheme.density = chatkitOptions.theme.density
        }

        // Validate radius
        if (chatkitOptions.theme.radius &&
            ['pill', 'round', 'soft', 'sharp'].includes(chatkitOptions.theme.radius)) {
            validTheme.radius = chatkitOptions.theme.radius
        }
    }

    // Build color object with validation
    const colorObj: any = {}
    let hasColor = false

    if (chatkitOptions.theme?.color) {
        // Accent color (required) - ChatKit expects hex format
        const accentPrimaryRaw = chatkitOptions.theme.color.accent?.primary || chatbot.primaryColor || '#3b82f6'
        const accentPrimaryHex = convertToHex(accentPrimaryRaw) || '#3b82f6'
        const accentLevel = chatkitOptions.theme.color.accent?.level ?? 2

        // Validate accent level (0-4)
        const validLevel = typeof accentLevel === 'number' && accentLevel >= 0 && accentLevel <= 4
            ? accentLevel
            : 2

        colorObj.accent = {
            primary: accentPrimaryHex,
            level: validLevel,
        }
        hasColor = true

        // Add icon color if provided - convert to hex
        if ((chatkitOptions.theme.color.accent as any)?.icon) {
            const iconHex = convertToHex((chatkitOptions.theme.color.accent as any).icon)
            if (iconHex) {
                ; (colorObj.accent as any).icon = iconHex
            }
        }

        // Surface colors - ChatKit supports SurfaceColors with background and foreground
        if (chatkitOptions.theme.color.surface) {
            const surface = chatkitOptions.theme.color.surface
            if (typeof surface === 'object' && surface !== null) {
                const surfaceObj: any = {}

                // Get background
                let bgHex: string | null = null
                if (surface.background) {
                    bgHex = convertToHex(surface.background)
                    if (bgHex) surfaceObj.background = bgHex
                }

                // Get foreground
                let fgHex: string | null = null
                if (surface.foreground) {
                    fgHex = convertToHex(surface.foreground)
                    if (fgHex) surfaceObj.foreground = fgHex
                }

                // If we have one but not the other, try to fill in gaps
                // If we have a background but no foreground, calculate a high-contrast foreground
                if (surfaceObj.background && !surfaceObj.foreground) {
                    surfaceObj.foreground = isLightColor(surfaceObj.background) ? '#000000' : '#ffffff'
                }

                // If we have a foreground but no background, fallback to white or black based on foreground
                if (surfaceObj.foreground && !surfaceObj.background) {
                    surfaceObj.background = isLightColor(surfaceObj.foreground) ? '#000000' : '#ffffff' // Contrast background
                }

                // Only add if we have at least one valid color (which essentially means both due to fallbacks above)
                // But specifically check validity constraints - if the schema STRICTLY requires both, we should only add if both exist.
                if (surfaceObj.background && surfaceObj.foreground) {
                    colorObj.surface = surfaceObj
                }
            } else if (typeof surface === 'string') {
                // Legacy support: if surface is a string, convert to object with background
                const surfaceHex = convertToHex(surface)
                if (surfaceHex) {
                    // Start with background
                    const sObj = {
                        background: surfaceHex,
                        foreground: isLightColor(surfaceHex) ? '#000000' : '#ffffff'
                    }
                    colorObj.surface = sObj
                }
            }
        }
    } else {
        // Default color if none provided
        colorObj.accent = {
            primary: chatbot.primaryColor || '#3b82f6',
            level: 2,
        }
        hasColor = true
    }

    // Only add color if it has at least accent
    if (hasColor && colorObj.accent) {
        validTheme.color = colorObj
    }

    // Add typography if present and valid
    if (chatkitOptions.theme?.typography) {
        const typographyObj: any = {}
        const typo = chatkitOptions.theme.typography

        // Include fontFamily
        if (typeof typo.fontFamily === 'string' && typo.fontFamily.trim() !== '') {
            typographyObj.fontFamily = typo.fontFamily.trim()
        }

        // Include numeric typography properties with strictly parsed numbers
        if (typo.fontSize !== undefined) {
            const size = parseFloat(typo.fontSize)
            if (!isNaN(size) && size > 0) typographyObj.fontSize = size
        }

        if (typo.fontWeight !== undefined) {
            const weight = parseInt(typo.fontWeight)
            if (!isNaN(weight) && weight > 0) typographyObj.fontWeight = weight
        }

        if (typo.lineHeight !== undefined) {
            const height = parseFloat(typo.lineHeight)
            if (!isNaN(height) && height > 0) typographyObj.lineHeight = height
        }

        if (typo.letterSpacing !== undefined) {
            const spacing = parseFloat(typo.letterSpacing)
            if (!isNaN(spacing)) typographyObj.letterSpacing = spacing // Allow 0 or negative
        }

        // Only add typography if it has at least one property
        if (Object.keys(typographyObj).length > 0) {
            validTheme.typography = typographyObj
        }
    }

    // Check for fontFamily fallback if not already set
    if (!validTheme.typography) validTheme.typography = {}
    if (!validTheme.typography.fontFamily && chatbot.fontFamily) {
        // Fallback: Use Platform UI font family if no specific ChatKit typography is set
        validTheme.typography.fontFamily = chatbot.fontFamily
    }
    // Cleanup empty typography object
    if (validTheme.typography && Object.keys(validTheme.typography).length === 0) {
        delete validTheme.typography
    }

    // Determine default color scheme based on background color
    // Only infer if not explicitly set in ChatKit options
    if (!validTheme.colorScheme && chatbot.messageBoxColor) {
        const isLight = isLightColor(chatbot.messageBoxColor)
        validTheme.colorScheme = isLight ? 'light' : 'dark'
    }

    // Fallback: Use Platform UI background color (messageBoxColor) as surface background if not set in ChatKit options
    if (!validTheme.color?.surface && chatbot.messageBoxColor) {
        const bgHex = convertToHex(chatbot.messageBoxColor)
        // Use fontColor for foreground or default to high-contrast color based on background brightness
        const defaultFg = isLightColor(chatbot.messageBoxColor) ? '#000000' : '#ffffff'
        const fgHex = convertToHex(chatbot.fontColor) || defaultFg

        if (bgHex && fgHex) {
            if (!validTheme.color) validTheme.color = {}
            validTheme.color.surface = {
                background: bgHex,
                foreground: fgHex
            }
        }
    }

    // Return undefined if theme is empty, otherwise return valid theme
    return Object.keys(validTheme).length > 0 ? validTheme : undefined
}
