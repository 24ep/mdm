export const extractNumericValue = (value: string | undefined): string => {
    if (!value) return '0'
    const match = value.toString().match(/(\d+(?:\.\d+)?)/)
    return match ? match[1] : '0'
}

export const convertToHex = (color: string): string | null => {
    if (!color || typeof color !== 'string') {
        return null
    }
    let trimmed = color.trim()

    // Handle hex string without #
    if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(trimmed)) {
        trimmed = '#' + trimmed
    }

    // Already hex format with #
    if (/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(trimmed)) {
        // Expand 3-digit hex to 6-digit
        if (trimmed.length === 4) {
            const r = trimmed[1]
            const g = trimmed[2]
            const b = trimmed[3]
            return `#${r}${r}${g}${g}${b}${b}`
        }
        return trimmed
    }

    // Convert rgb/rgba to hex
    const rgbMatch = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i)
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1])
        const g = parseInt(rgbMatch[2])
        const b = parseInt(rgbMatch[3])
        // We ignore alpha for hex conversion as ChatKit theme typically expects opaque hex
        // unless it supports alpha hex which is rare for basic color inputs
        
        const toHex = (n: number) => {
            const hex = Math.max(0, Math.min(255, n)).toString(16)
            return hex.length === 1 ? '0' + hex : hex
        }
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }

    return null
}

export const isLightColor = (hex: string): boolean => {
    const rgb = convertToHex(hex)
    if (!rgb) return true // Default to light

    // Parse hex
    const fullHex = rgb.replace('#', '')
    const r = parseInt(fullHex.substring(0, 2), 16)
    const g = parseInt(fullHex.substring(2, 4), 16)
    const b = parseInt(fullHex.substring(4, 6), 16)

    // Calculate relative luminance (perceived brightness)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b)

    return luminance > 128
}

export const hexToRgb = (hex: string): string => {
    hex = hex.replace('#', '')
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('')
    }
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `${r}, ${g}, ${b}`
}
