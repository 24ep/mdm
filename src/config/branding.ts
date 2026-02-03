import { BrandingConfig } from '@/app/admin/features/system/types'

export const defaultBrandingConfig: BrandingConfig = {
    applicationName: 'Unified Data Platform',
    applicationLogo: '',
    applicationLogoType: 'image',
    applicationLogoIcon: '',
    applicationLogoIconColor: '#000000',
    applicationLogoBackgroundColor: '#ffffff',
    primaryColor: '#000000', // Premium Black
    secondaryColor: '#3A3A3C', // Dark Slate
    warningColor: '#FF9500', // macOS Orange
    dangerColor: '#FF3B30', // macOS Red
    uiBackgroundColor: 'rgba(28, 28, 30, 0.85)', // Dark frosted glass
    uiBorderColor: 'rgba(255, 255, 255, 0.1)', // Subtle light border
    topMenuBackgroundColor: 'rgba(28, 28, 30, 0.75)', // Dark frosted menu
    platformSidebarBackgroundColor: 'rgba(18, 18, 18, 0.75)', // Deep black frosted panel
    secondarySidebarBackgroundColor: 'rgba(28, 28, 30, 0.6)', // Subtle translucency
    topMenuTextColor: '#FFFFFF', // White text
    platformSidebarTextColor: '#FFFFFF',
    secondarySidebarTextColor: '#EBEBF5',
    bodyBackgroundColor: '#121212', // Pure black minimal background
    loginBackground: {
        type: 'gradient',
        gradient: {
            from: '#000000', // Deep black start
            to: '#1C1C1E', // Dark grey end
            angle: 135,
        },
    },
    globalStyling: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif', // SF Pro system font stack
        fontFamilyMono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Fira Mono", "Droid Sans Mono", "Source Code Pro", monospace', // Monospaced for prompts/parameters
        borderRadius: '10px', // Refined, elegant spacing
        borderColor: 'rgba(255, 255, 255, 0.1)', // Ultra-subtle light borders
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
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    },
    drawerOverlay: {
        color: '#000000',
        opacity: 50, // Darker overlay for dark mode
        blur: 20, // Smooth blur
    },
    componentStyling: {
        // Top Menu Bar - Dark frosted glass effect
        'top-menu-bar': {
            backdropFilter: 'blur(30px) saturate(200%)',
            borderWidth: '0px 0px 0.5px 0px',
            borderColor: 'rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(18, 18, 18, 0.75)',
            textColor: '#FFFFFF',
        },
        // Platform Sidebar
        'platform-sidebar-primary': {
            backdropFilter: 'blur(30px) saturate(200%)',
            borderWidth: '0px',
            borderColor: 'transparent',
            backgroundColor: 'rgba(10, 10, 10, 0.85)',
            textColor: '#FFFFFF',
        },
        'platform-sidebar-secondary': {
            backdropFilter: 'blur(30px) saturate(200%)',
            borderWidth: '0px',
            borderColor: 'transparent',
            backgroundColor: 'rgba(18, 18, 18, 0.75)',
            textColor: '#EBEBF5',
        },
        // Platform Sidebar Menu
        'platform-sidebar-menu-normal': {
            borderWidth: '0px',
            backgroundColor: 'transparent',
            textColor: '#EBEBF5',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        'platform-sidebar-menu-hover': {
            borderWidth: '0px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            textColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        'platform-sidebar-menu-active': {
            borderWidth: '0px',
            backgroundColor: 'rgba(255,255,255,0.12)',
            textColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        // Text Input
        'text-input': {
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.1)',
            textColor: '#FFFFFF',
            borderRadius: '8px',
        },
        // Select
        'select': {
            backgroundColor: 'rgba(255,255,255,0.05)',
            textColor: '#FFFFFF',
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
        },
        // Card
        'card': {
            backgroundColor: 'rgba(28, 28, 30, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '12px',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: '0.5px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            textColor: '#FFFFFF',
        },
        // Button
        'button': {
            borderRadius: '10px',
            borderWidth: '0px',
            backgroundColor: '#000000',
            textColor: '#FFFFFF',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        },
        'button-primary': {
            backgroundColor: '#000000',
            textColor: '#FFFFFF',
        }
    },
}
