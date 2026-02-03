import { BrandingConfig } from '@/app/admin/features/system/types'

export const defaultBrandingConfig: BrandingConfig = {
    applicationName: 'Unified Data Platform',
    applicationLogo: '',
    applicationLogoType: 'image',
    applicationLogoIcon: '',
    applicationLogoIconColor: '#000000',
    applicationLogoBackgroundColor: '#ffffff',
    primaryColor: '#000000',
    secondaryColor: '#4b5563',
    warningColor: '#FF9500', // macOS Orange
    dangerColor: '#FF3B30', // macOS Red
    uiBackgroundColor: 'rgba(255, 255, 255, 0.8)',
    uiBorderColor: 'rgba(0, 0, 0, 0.1)',
    topMenuBackgroundColor: '#ffffff',
    platformSidebarBackgroundColor: '#ffffff',
    secondarySidebarBackgroundColor: '#f9fafb',
    topMenuTextColor: '#1f2937',
    platformSidebarTextColor: '#4b5563',
    secondarySidebarTextColor: '#6b7280',
    bodyBackgroundColor: '#f3f4f6',
    loginBackground: {
        type: 'gradient',
        gradient: {
            from: '#000000', // Deep black start
            to: '#1C1C1E', // Dark grey end
            angle: 135,
        },
    },
    globalStyling: {
        fontFamily: 'Inter, sans-serif',
        fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        borderRadius: '8px',
        borderColor: '#e5e7eb',
        borderWidth: '1px',
        buttonBorderRadius: '8px',
        buttonBorderWidth: '0px',
        inputBorderRadius: '6px',
        inputBorderWidth: '1px',
        selectBorderRadius: '6px',
        selectBorderWidth: '1px',
        textareaBorderRadius: '6px',
        textareaBorderWidth: '1px',
        transitionDuration: '150ms',
        transitionTiming: 'ease-in-out',
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    drawerOverlay: {
        color: '#000000',
        opacity: 40,
        blur: 4,
    },
    componentStyling: {
        'top-menu-bar': {
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            borderWidth: '0px 0px 1px 0px',
            borderColor: '#e5e7eb',
        },
        'platform-sidebar-primary': {
            backgroundColor: '#ffffff',
            textColor: '#4b5563',
        },
        'platform-sidebar-secondary': {
            backgroundColor: '#f9fafb',
            textColor: '#6b7280',
        },
        'platform-sidebar-menu-normal': {
            textColor: '#4b5563',
            backgroundColor: 'transparent',
        },
        'platform-sidebar-menu-hover': {
            backgroundColor: '#f3f4f6',
            textColor: '#111827',
        },
        'platform-sidebar-menu-active': {
            backgroundColor: '#f3f4f6',
            textColor: '#111827',
            fontWeight: '600',
        },
        'text-input': {
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            textColor: '#111827',
        },
        'select': {
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            textColor: '#111827',
        },
        'card': {
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            textColor: '#111827',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
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
