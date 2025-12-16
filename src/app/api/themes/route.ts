import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { safeParseThemeListItem, safeParseBrandingConfig, CreateThemeInputSchema, type ThemeListItem } from '@/lib/theme-types'

// GET /api/themes - List all themes
export async function GET(request: NextRequest) {
    try {
        const themes = await prisma.theme.findMany({
            orderBy: [
                { isDefault: 'desc' },
                { isActive: 'desc' },
                { updatedAt: 'desc' }
            ]
        })

        // Transform to include preview colors with validation
        const themesWithPreview: ThemeListItem[] = themes.map(theme => {
            // Prisma returns JSON fields as objects, but ensure we handle it correctly
            let config: any = theme.config
            if (typeof config === 'string') {
                try {
                    config = JSON.parse(config)
                } catch (e) {
                    config = null
                }
            }
            
            const themeMode = (theme.themeMode || 'light') as 'light' | 'dark'
            
            // Handle both flattened and nested config structures
            let primaryColor: string
            let secondaryColor: string
            let bodyBackgroundColor: string
            let topMenuBackgroundColor: string
            
            if (config && typeof config === 'object' && !Array.isArray(config)) {
                // Check for flattened structure first (new format)
                if (config.primaryColor && typeof config.primaryColor === 'string') {
                    primaryColor = config.primaryColor
                    secondaryColor = config.secondaryColor || '#8B5CF6'
                    bodyBackgroundColor = config.bodyBackgroundColor || (themeMode === 'dark' ? '#000000' : '#F5F5F7')
                    topMenuBackgroundColor = config.topMenuBackgroundColor || (themeMode === 'dark' ? '#1E293B' : '#FFFFFF')
                } 
                // Check for nested structure (old format)
                else if (config.lightMode || config.darkMode) {
                    const modeConfig = themeMode === 'dark' 
                        ? (config.darkMode || config.lightMode)
                        : (config.lightMode || config.darkMode)
                    
                    if (modeConfig && typeof modeConfig === 'object') {
                        primaryColor = modeConfig.primaryColor || '#3B82F6'
                        secondaryColor = modeConfig.secondaryColor || '#8B5CF6'
                        bodyBackgroundColor = modeConfig.bodyBackgroundColor || (themeMode === 'dark' ? '#000000' : '#F5F5F7')
                        topMenuBackgroundColor = modeConfig.topMenuBackgroundColor || (themeMode === 'dark' ? '#1E293B' : '#FFFFFF')
                    } else {
                        // Fallback if mode config is invalid
                        primaryColor = '#3B82F6'
                        secondaryColor = '#8B5CF6'
                        bodyBackgroundColor = themeMode === 'dark' ? '#000000' : '#F5F5F7'
                        topMenuBackgroundColor = themeMode === 'dark' ? '#1E293B' : '#FFFFFF'
                    }
                } 
                // Unknown structure - use defaults based on themeMode
                else {
                    primaryColor = '#3B82F6'
                    secondaryColor = '#8B5CF6'
                    bodyBackgroundColor = themeMode === 'dark' ? '#000000' : '#F5F5F7'
                    topMenuBackgroundColor = themeMode === 'dark' ? '#1E293B' : '#FFFFFF'
                }
            } 
            // No valid config - use defaults based on themeMode
            else {
                primaryColor = '#3B82F6'
                secondaryColor = '#8B5CF6'
                bodyBackgroundColor = themeMode === 'dark' ? '#000000' : '#F5F5F7'
                topMenuBackgroundColor = themeMode === 'dark' ? '#1E293B' : '#FFFFFF'
            }
            
            const themeListItem = {
                id: theme.id,
                name: theme.name,
                description: theme.description ?? undefined,
                themeMode: themeMode,
                tags: theme.tags || [],
                isActive: theme.isActive,
                isDefault: theme.isDefault,
                updatedAt: theme.updatedAt,
                previewColors: {
                    primary: primaryColor,
                    secondary: secondaryColor,
                    background: bodyBackgroundColor,
                    surface: topMenuBackgroundColor
                }
            }
            
            // Validate the theme list item
            const validation = safeParseThemeListItem(themeListItem)
            if (!validation.success) {
                console.warn(`[GET /api/themes] Invalid theme list item for ${theme.id}:`, validation.error)
                // Return a valid structure even if validation fails
            }
            
            return themeListItem
        }).filter((theme) => {
            // Filter out invalid themes
            const validation = safeParseThemeListItem(theme)
            return validation.success
        }) as ThemeListItem[]

        return NextResponse.json({ themes: themesWithPreview })
    } catch (error: any) {
        console.error('Error fetching themes:', error)
        
        // Check if it's a database connection error
        const isConnectionError = error?.code === 'P1001' || 
                                 error?.message?.includes('Can\'t reach database server') ||
                                 error?.message?.includes('connect ECONNREFUSED')
        
        if (isConnectionError) {
            return NextResponse.json(
                { 
                    error: 'Database connection failed',
                    message: 'Please ensure your database server is running',
                    details: process.env.NODE_ENV === 'development' 
                        ? error.message 
                        : undefined
                },
                { status: 503 } // Service Unavailable
            )
        }
        
        return NextResponse.json(
            { error: 'Failed to fetch themes' },
            { status: 500 }
        )
    }
}

// POST /api/themes - Create new theme
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        
        // Validate input
        const inputValidation = CreateThemeInputSchema.safeParse(body)
        if (!inputValidation.success) {
            return NextResponse.json(
                { 
                    error: 'Invalid theme input',
                    details: inputValidation.error.issues
                },
                { status: 400 }
            )
        }
        
        const { name, description, config, cloneFromId } = inputValidation.data

        // If cloning from another theme
        let themeConfig = config
        if (cloneFromId) {
            const sourceTheme = await prisma.theme.findUnique({
                where: { id: cloneFromId }
            })
            if (sourceTheme) {
                // Validate cloned config
                const configValidation = safeParseBrandingConfig(sourceTheme.config)
                if (configValidation.success) {
                    themeConfig = configValidation.data
                } else {
                    return NextResponse.json(
                        { error: 'Source theme has invalid configuration' },
                        { status: 400 }
                    )
                }
            } else {
                return NextResponse.json(
                    { error: 'Source theme not found' },
                    { status: 404 }
                )
            }
        }

        // Validate config if provided
        if (themeConfig) {
            const configValidation = safeParseBrandingConfig(themeConfig)
            if (!configValidation.success) {
                return NextResponse.json(
                    { 
                        error: 'Invalid theme configuration',
                        details: configValidation.error.issues
                    },
                    { status: 400 }
                )
            }
            themeConfig = configValidation.data
        }

        // Ensure we have a valid config
        if (!themeConfig) {
            return NextResponse.json(
                { error: 'Theme configuration is required' },
                { status: 400 }
            )
        }

        const theme = await prisma.theme.create({
            data: {
                name,
                description,
                themeMode: body.themeMode || 'light',
                tags: body.tags || [], // Use tags from request, or empty array
                config: themeConfig,
                isActive: false,
                isDefault: false
            }
        })

        return NextResponse.json({ theme })
    } catch (error) {
        console.error('Error creating theme:', error)
        return NextResponse.json(
            { error: 'Failed to create theme' },
            { status: 500 }
        )
    }
}
