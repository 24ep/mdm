export const extractNumericValue = (value: string | undefined): string => {
    if (!value) return '0'
    const match = value.toString().match(/(\d+(?:\.\d+)?)/)
    return match ? match[1] : '0'
}

export const convertToHex = (color: string): string | null => {
    if (!color || typeof color !== 'string') {
        return null
    }
    const trimmed = color.trim()

    // Already hex format
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(trimmed)) {
        // Expand 3-digit hex to 6-digit
        if (trimmed.length === 4) {
            const r = trimmed[1]
            const g = trimmed[2]
            const b = trimmed[3]
            return `#${r}${r}${g}${g}${b}${b}`
        }
        return trimmed
    }

    // Convert rgb/rgba to hex (only if opacity > 0)
    const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(,\s*([\d.]+))?\)/)
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1])
        const g = parseInt(rgbMatch[2])
        const b = parseInt(rgbMatch[3])
        const opacity = rgbMatch[5] ? parseFloat(rgbMatch[5]) : 1

        // Only convert if opacity > 0
        if (opacity > 0) {
            const toHex = (n: number) => {
                const hex = Math.round(n).toString(16)
                return hex.length === 1 ? '0' + hex : hex
            }
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`
        }
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
