import { BrandingConfig } from '@/app/admin/features/system/types'

export const defaultBrandingConfig: BrandingConfig = {
    applicationName: 'Unified Data Platform',
    applicationLogo: '',
    applicationLogoType: 'image',
    applicationLogoIcon: '',
    applicationLogoIconColor: '#000000',
    applicationLogoBackgroundColor: '#ffffff',
    lightMode: {
        primaryColor: '#007AFF', // macOS Blue - Soft blue for focus states
        secondaryColor: '#8E8E93', // Refined secondary color
        warningColor: '#FF9500', // macOS Orange
        dangerColor: '#FF3B30', // macOS Red
        uiBackgroundColor: 'rgba(255, 255, 255, 0.85)', // Ultra-clean frosted glass
        uiBorderColor: 'rgba(0, 0, 0, 0.06)', // Subtle border
        topMenuBackgroundColor: 'rgba(255, 255, 255, 0.75)', // Frosted glass with translucency
        platformSidebarBackgroundColor: 'rgba(242, 242, 247, 0.75)', // Soft frosted panel
        secondarySidebarBackgroundColor: 'rgba(255, 255, 255, 0.6)', // Subtle translucency
        topMenuTextColor: '#1D1D1F', // Refined text color
        platformSidebarTextColor: '#1D1D1F',
        secondarySidebarTextColor: '#3A3A3C',
        bodyBackgroundColor: '#F5F5F7', // Calm, minimal background
    },
    darkMode: {
        primaryColor: '#0A84FF', // macOS Dark Blue - Soft blue highlights
        secondaryColor: '#8E8E93',
        warningColor: '#FF9500',
        dangerColor: '#FF453A', // macOS Dark Red
        uiBackgroundColor: 'rgba(28, 28, 30, 0.85)', // Frosted glass dark
        uiBorderColor: 'rgba(255, 255, 255, 0.08)', // Subtle border
        topMenuBackgroundColor: 'rgba(28, 28, 30, 0.75)', // Frosted glass with translucency
        platformSidebarBackgroundColor: 'rgba(28, 28, 30, 0.75)', // Soft frosted panel
        secondarySidebarBackgroundColor: 'rgba(44, 44, 46, 0.6)', // Subtle translucency
        topMenuTextColor: '#F5F5F7', // Refined text color
        platformSidebarTextColor: '#F5F5F7',
        secondarySidebarTextColor: '#EBEBF5',
        bodyBackgroundColor: '#000000', // Deep black background
    },
    loginBackground: {
        type: 'gradient',
        gradient: {
            from: '#F5F5F7', // Ultra-clean, minimal light gradient start
            to: '#E8E8ED', // Subtle light gradient end
            angle: 135,
        },
    },
    globalStyling: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif', // SF Pro system font stack
        fontFamilyMono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Fira Mono", "Droid Sans Mono", "Source Code Pro", monospace', // Monospaced for prompts/parameters
        borderRadius: '10px', // Refined, elegant spacing
        borderColor: 'rgba(0, 0, 0, 0.06)', // Ultra-subtle borders
        borderWidth: '0.5px', // Fine-grain precision
        buttonBorderRadius: '10px', // Smooth, modern buttons
        buttonBorderWidth: '0px', // Clean, borderless buttons
        inputBorderRadius: '8px', // Refined input fields
        inputBorderWidth: '0.5px',
        selectBorderRadius: '8px',
        selectBorderWidth: '0.5px',
        textareaBorderRadius: '8px',
        textareaBorderWidth: '0.5px',
        // Animation & micro-interactions
        transitionDuration: '200ms', // Fast, delightful transitions
        transitionTiming: 'cubic-bezier(0.4, 0, 0.2, 1)', // Smooth easing
        // Shadows - smooth drop-shadows like macOS
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    drawerOverlay: {
        color: '#000000',
        opacity: 30, // Subtle overlay
        blur: 20, // Smooth blur like macOS Control Center
    },
    componentStyling: {
        // Top Menu Bar - Ultra-clean frosted glass effect
        'top-menu-bar': {
            light: {
                backdropFilter: 'blur(30px) saturate(200%)', // Enhanced blur and saturation
                borderWidth: '0px 0px 0.5px 0px', // Fine-grain precision
                borderColor: 'rgba(0,0,0,0.04)', // Ultra-subtle border
            },
            dark: {
                backdropFilter: 'blur(30px) saturate(200%)', // Enhanced blur and saturation
                borderWidth: '0px 0px 0.5px 0px', // Fine-grain precision
                borderColor: 'rgba(255,255,255,0.06)', // Ultra-subtle border
            },
        },
        // Platform Sidebar - Soft frosted glass panels (borderless for ultra-clean macOS look)
        'platform-sidebar-primary': {
            light: {
                backdropFilter: 'blur(30px) saturate(200%)', // Enhanced blur and saturation
                borderWidth: '0px', // Borderless for ultra-clean look
                borderColor: 'transparent',
            },
            dark: {
                backdropFilter: 'blur(30px) saturate(200%)', // Enhanced blur and saturation
                borderWidth: '0px', // Borderless for ultra-clean look
                borderColor: 'transparent',
            },
        },
        'platform-sidebar-secondary': {
            light: {
                backdropFilter: 'blur(30px) saturate(200%)', // Enhanced frosted effect
                borderWidth: '0px', // Borderless for ultra-clean look
                borderColor: 'transparent',
            },
            dark: {
                backdropFilter: 'blur(30px) saturate(200%)', // Enhanced frosted effect
                borderWidth: '0px', // Borderless for ultra-clean look
                borderColor: 'transparent',
            },
        },
        // Platform Sidebar Menu - Ultra-clean macOS style with micro-interactions
        'platform-sidebar-menu-normal': {
            light: {
                borderWidth: '0px',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem', // Elegant spacing
                fontSize: '0.875rem', // Refined font size
                fontWeight: '500', // Medium weight
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)', // Smooth micro-interaction
            },
            dark: {
                borderWidth: '0px',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem', // Elegant spacing
                fontSize: '0.875rem', // Refined font size
                fontWeight: '500', // Medium weight
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)', // Smooth micro-interaction
            },
        },
        'platform-sidebar-menu-hover': {
            light: {
                borderWidth: '0px',
                backgroundColor: 'rgba(0,0,0,0.06)', // Subtle hover state
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transition
            },
            dark: {
                borderWidth: '0px',
                backgroundColor: 'rgba(255,255,255,0.08)', // Subtle hover state
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transition
            },
        },
        'platform-sidebar-menu-active': {
            light: {
                borderWidth: '0px',
                backgroundColor: 'rgba(0,122,255,0.12)', // Soft blue highlight for focus
                textColor: '#007AFF', // Soft blue for focus states
                borderRadius: '8px',
                padding: '0.5rem 0.75rem', // Elegant spacing
                fontSize: '0.875rem', // Refined font size
                fontWeight: '600', // Slightly bolder for active state
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transition
            },
            dark: {
                borderWidth: '0px',
                backgroundColor: 'rgba(10,132,255,0.18)', // Soft blue highlight for focus
                textColor: '#0A84FF', // Soft blue for focus states
                borderRadius: '8px',
                padding: '0.5rem 0.75rem', // Elegant spacing
                fontSize: '0.875rem', // Refined font size
                fontWeight: '600', // Slightly bolder for active state
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transition
            },
        },
        // Vertical Tab Menu - Default: no border
        'vertical-tab-menu-normal': {
            light: {
                borderWidth: '0px',
            },
            dark: {
                borderWidth: '0px',
            },
        },
        'vertical-tab-menu-hover': {
            light: {
                borderWidth: '0px',
            },
            dark: {
                borderWidth: '0px',
            },
        },
        'vertical-tab-menu-active': {
            light: {
                borderWidth: '0px',
            },
            dark: {
                borderWidth: '0px',
            },
        },
        // Text Input - Ultra-clean with soft focus states
        'text-input': {
            light: {
                backgroundColor: 'rgba(0,0,0,0.04)', // Refined, minimal background
                borderColor: 'transparent', // Transparent border to match theme
                borderRadius: '8px',
            },
            dark: {
                backgroundColor: 'rgba(255,255,255,0.08)', // Refined, minimal background
                borderColor: 'transparent', // Transparent border to match theme
                borderRadius: '8px',
            },
        },
        // Select - Ultra-clean with soft focus states
        'select': {
            light: {
                backgroundColor: 'rgba(0,0,0,0.04)', // Refined, minimal background
                textColor: '#1D1D1F', // Refined text color
                borderColor: 'rgba(0,0,0,0.06)', // Ultra-subtle border
                borderRadius: '8px',
            },
            dark: {
                backgroundColor: 'rgba(255,255,255,0.08)', // Refined, minimal background
                textColor: '#F5F5F7', // Refined text color
                borderColor: 'rgba(255,255,255,0.08)', // Ultra-subtle border
                borderRadius: '8px',
            },
        },
        // Multi-Select - Ultra-clean with soft focus states
        'multi-select': {
            light: {
                backgroundColor: 'rgba(0,0,0,0.04)', // Refined, minimal background
                textColor: '#1D1D1F', // Refined text color
                borderColor: 'rgba(0,0,0,0.06)', // Ultra-subtle border
                borderRadius: '8px',
            },
            dark: {
                backgroundColor: 'rgba(255,255,255,0.08)', // Refined, minimal background
                textColor: '#F5F5F7', // Refined text color
                borderColor: 'rgba(255,255,255,0.08)', // Ultra-subtle border
                borderRadius: '8px',
            },
        },
        // Textarea - Ultra-clean with soft focus states (matches text-input)
        'textarea': {
            light: {
                backgroundColor: 'rgba(0,0,0,0.04)', // Refined, minimal background
                borderColor: 'transparent', // Transparent border to match text-input
                borderRadius: '8px',
            },
            dark: {
                backgroundColor: 'rgba(255,255,255,0.08)', // Refined, minimal background
                borderColor: 'transparent', // Transparent border to match text-input
                borderRadius: '8px',
            },
        },
        // Button - Smooth, modern with soft blue focus and micro-interactions
        'button': {
            light: {
                borderRadius: '10px',
                borderWidth: '0px',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Subtle shadow
            },
            dark: {
                borderRadius: '10px',
                borderWidth: '0px',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)', // Subtle shadow
            },
        },
        // Card - Frosted glass panels with smooth shadows
        'card': {
            light: {
                backgroundColor: 'rgba(255, 255, 255, 0.85)', // Frosted glass
                backdropFilter: 'blur(20px) saturate(180%)',
                borderRadius: '12px',
                borderColor: 'rgba(0,0,0,0.06)',
                borderWidth: '0.5px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Smooth drop-shadow
            },
            dark: {
                backgroundColor: 'rgba(28, 28, 30, 0.85)', // Frosted glass
                backdropFilter: 'blur(20px) saturate(180%)',
                borderRadius: '12px',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: '0.5px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)', // Smooth drop-shadow
            },
        },
        // Checkbox - Ultra-clean macOS style
        'checkbox': {
            light: {
                borderRadius: '4px', // Subtle rounded corners
                borderColor: 'rgba(0,0,0,0.2)', // Subtle border
                borderWidth: '1.5px',
                backgroundColor: 'rgba(255,255,255,0.9)', // Clean background
            },
            dark: {
                borderRadius: '4px',
                borderColor: 'rgba(255,255,255,0.3)',
                borderWidth: '1.5px',
                backgroundColor: 'rgba(28,28,30,0.9)',
            },
        },
        // Radio - Smooth, modern macOS style
        'radio': {
            light: {
                borderRadius: '50%', // Perfect circle
                borderColor: 'rgba(0,0,0,0.2)', // Subtle border
                borderWidth: '1.5px',
                backgroundColor: 'rgba(255,255,255,0.9)', // Clean background
            },
            dark: {
                borderRadius: '50%',
                borderColor: 'rgba(255,255,255,0.3)',
                borderWidth: '1.5px',
                backgroundColor: 'rgba(28,28,30,0.9)',
            },
        },
        // Switch - Smooth toggle with soft blue active state
        'switch': {
            light: {
                borderRadius: '9999px', // Fully rounded
                borderWidth: '0px',
                backgroundColor: 'rgba(0,0,0,0.1)', // Subtle inactive state
            },
            dark: {
                borderRadius: '9999px',
                borderWidth: '0px',
                backgroundColor: 'rgba(255,255,255,0.15)', // Subtle inactive state
            },
        },
    },
}
