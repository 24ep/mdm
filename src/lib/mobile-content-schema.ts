/**
 * Mobile Content Schema - AEM-like Component Schema for Mobile Applications
 * 
 * This module defines a standardized schema for UI components that can be
 * consumed by mobile applications (iOS, Android, React Native, Flutter, etc.)
 * 
 * The schema follows Adobe Experience Manager (AEM) concepts:
 * - Components are self-describing with their own schema
 * - Data bindings connect components to data sources
 * - Styles are platform-agnostic
 * - Actions define user interactions
 */

import { z } from 'zod'

// ============================================================================
// Base Types
// ============================================================================

/**
 * Supported platforms for conditional rendering
 */
export const PlatformSchema = z.enum(['ios', 'android', 'web', 'all'])
export type Platform = z.infer<typeof PlatformSchema>

/**
 * Responsive breakpoints
 */
export const BreakpointSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl'])
export type Breakpoint = z.infer<typeof BreakpointSchema>

/**
 * Color value - supports hex, rgb, rgba, and semantic colors
 */
export const ColorSchema = z.string()

/**
 * Dimension value - supports px, %, rem, or numeric values
 */
export const DimensionSchema = z.union([z.string(), z.number()])

// ============================================================================
// Style Schema
// ============================================================================

/**
 * Platform-agnostic style properties
 * Mobile apps translate these to native styles
 */
export const StyleSchema = z.object({
  // Layout
  width: DimensionSchema.optional(),
  height: DimensionSchema.optional(),
  minWidth: DimensionSchema.optional(),
  maxWidth: DimensionSchema.optional(),
  minHeight: DimensionSchema.optional(),
  maxHeight: DimensionSchema.optional(),
  
  // Spacing
  padding: z.union([z.number(), z.object({
    top: z.number().optional(),
    right: z.number().optional(),
    bottom: z.number().optional(),
    left: z.number().optional(),
  })]).optional(),
  margin: z.union([z.number(), z.object({
    top: z.number().optional(),
    right: z.number().optional(),
    bottom: z.number().optional(),
    left: z.number().optional(),
  })]).optional(),
  
  // Positioning
  position: z.enum(['relative', 'absolute', 'fixed']).optional(),
  top: DimensionSchema.optional(),
  right: DimensionSchema.optional(),
  bottom: DimensionSchema.optional(),
  left: DimensionSchema.optional(),
  zIndex: z.number().optional(),
  
  // Flexbox
  flex: z.number().optional(),
  flexDirection: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional(),
  flexWrap: z.enum(['wrap', 'nowrap', 'wrap-reverse']).optional(),
  justifyContent: z.enum(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']).optional(),
  alignItems: z.enum(['flex-start', 'flex-end', 'center', 'stretch', 'baseline']).optional(),
  alignSelf: z.enum(['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline']).optional(),
  gap: z.number().optional(),
  
  // Colors
  backgroundColor: ColorSchema.optional(),
  color: ColorSchema.optional(),
  
  // Border
  borderWidth: z.number().optional(),
  borderColor: ColorSchema.optional(),
  borderRadius: z.union([z.number(), z.object({
    topLeft: z.number().optional(),
    topRight: z.number().optional(),
    bottomRight: z.number().optional(),
    bottomLeft: z.number().optional(),
  })]).optional(),
  borderStyle: z.enum(['solid', 'dashed', 'dotted', 'none']).optional(),
  
  // Typography
  fontSize: z.number().optional(),
  fontWeight: z.enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']).optional(),
  fontFamily: z.string().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  
  // Effects
  opacity: z.number().min(0).max(1).optional(),
  shadow: z.object({
    color: ColorSchema,
    offsetX: z.number(),
    offsetY: z.number(),
    blurRadius: z.number(),
    spreadRadius: z.number().optional(),
  }).optional(),
  
  // Visibility
  display: z.enum(['flex', 'none', 'block']).optional(),
  overflow: z.enum(['visible', 'hidden', 'scroll']).optional(),
}).partial()

export type Style = z.infer<typeof StyleSchema>

/**
 * Responsive styles per breakpoint
 */
export const ResponsiveStyleSchema = z.object({
  base: StyleSchema.optional(),
  xs: StyleSchema.optional(),
  sm: StyleSchema.optional(),
  md: StyleSchema.optional(),
  lg: StyleSchema.optional(),
  xl: StyleSchema.optional(),
})

export type ResponsiveStyle = z.infer<typeof ResponsiveStyleSchema>

// ============================================================================
// Data Binding Schema
// ============================================================================

/**
 * Data source types
 */
export const DataSourceTypeSchema = z.enum([
  'api',        // REST API endpoint
  'graphql',    // GraphQL query
  'static',     // Static data
  'context',    // From app context/state
  'parameter',  // From URL/navigation parameters
])

/**
 * Data binding configuration
 * Allows components to bind to data sources
 */
export const DataBindingSchema = z.object({
  /**
   * Unique identifier for this binding
   */
  id: z.string(),
  
  /**
   * Type of data source
   */
  type: DataSourceTypeSchema,
  
  /**
   * For API: endpoint URL (relative or absolute)
   * For GraphQL: query string
   * For context: context path
   * For parameter: parameter name
   */
  source: z.string(),
  
  /**
   * HTTP method for API calls
   */
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  
  /**
   * Headers for API calls
   */
  headers: z.record(z.string(), z.string()).optional(),
  
  /**
   * Request body schema
   */
  body: z.any().optional(),
  
  /**
   * Response data path (JSONPath-like)
   * e.g., "data.items" or "response.user.profile"
   */
  responsePath: z.string().optional(),
  
  /**
   * Transform function name to apply to data
   */
  transform: z.string().optional(),
  
  /**
   * Refresh interval in milliseconds (0 = no auto-refresh)
   */
  refreshInterval: z.number().optional(),
  
  /**
   * Whether to cache the response
   */
  cache: z.boolean().optional(),
  
  /**
   * Cache TTL in seconds
   */
  cacheTTL: z.number().optional(),
  
  /**
   * Pagination configuration
   */
  pagination: z.object({
    type: z.enum(['offset', 'cursor', 'page']),
    pageSize: z.number(),
    pageParam: z.string().optional(),
    limitParam: z.string().optional(),
    offsetParam: z.string().optional(),
    cursorParam: z.string().optional(),
  }).optional(),
})

export type DataBinding = z.infer<typeof DataBindingSchema>

// ============================================================================
// Action Schema
// ============================================================================

/**
 * Action types for user interactions
 */
export const ActionTypeSchema = z.enum([
  'navigate',     // Navigate to another screen/page
  'api',          // Make an API call
  'openUrl',      // Open external URL
  'share',        // Share content
  'refresh',      // Refresh data
  'submit',       // Submit form
  'custom',       // Custom action handler
  'showModal',    // Show modal/dialog
  'hideModal',    // Hide modal/dialog
  'showToast',    // Show toast notification
  'setContext',   // Update app context/state
])

/**
 * Action configuration
 */
export interface Action {
  type: 'navigate' | 'api' | 'openUrl' | 'share' | 'refresh' | 'submit' | 'custom' | 'showModal' | 'hideModal' | 'showToast' | 'setContext'
  target?: string
  params?: Record<string, any>
  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  confirmation?: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
  }
  onSuccess?: Action
  onError?: Action
  handler?: string
}

export const ActionSchema: z.ZodType<Action> = z.lazy(() => z.object({
  type: ActionTypeSchema,
  target: z.string().optional(),
  params: z.record(z.string(), z.any()).optional(),
  endpoint: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  body: z.any().optional(),
  confirmation: z.object({
    title: z.string(),
    message: z.string(),
    confirmText: z.string().optional(),
    cancelText: z.string().optional(),
  }).optional(),
  onSuccess: z.lazy(() => ActionSchema).optional(),
  onError: z.lazy(() => ActionSchema).optional(),
  handler: z.string().optional(),
}))

// ============================================================================
// Component Types
// ============================================================================

/**
 * All supported component types
 */
export const ComponentTypeSchema = z.enum([
  // Layout
  'container',
  'row',
  'column',
  'stack',
  'grid',
  'scrollView',
  'safeArea',
  
  // Basic
  'text',
  'image',
  'icon',
  'button',
  'link',
  'divider',
  'spacer',
  
  // Input
  'textInput',
  'textArea',
  'select',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'datePicker',
  'timePicker',
  'filePicker',
  
  // Data Display
  'list',
  'table',
  'card',
  'badge',
  'avatar',
  'chip',
  'progress',
  'skeleton',
  
  // Navigation
  'tabs',
  'bottomNav',
  'drawer',
  'appBar',
  'breadcrumb',
  
  // Feedback
  'modal',
  'toast',
  'alert',
  'tooltip',
  
  // Charts (for dashboards)
  'lineChart',
  'barChart',
  'pieChart',
  'areaChart',
  
  // Media
  'video',
  'audio',
  'webView',
  'map',
  
  // Custom
  'custom',
])

export type ComponentType = z.infer<typeof ComponentTypeSchema>

// ============================================================================
// Base Component Schema
// ============================================================================

/**
 * Base component properties shared by all components
 */
export const BaseComponentSchema = z.object({
  /**
   * Unique identifier for the component
   */
  id: z.string(),
  
  /**
   * Component type
   */
  type: ComponentTypeSchema,
  
  /**
   * Human-readable name (for debugging/admin)
   */
  name: z.string().optional(),
  
  /**
   * Platform-specific visibility
   */
  platforms: z.array(PlatformSchema).optional(),
  
  /**
   * Condition for rendering (expression string)
   * e.g., "user.role === 'admin'" or "data.items.length > 0"
   */
  condition: z.string().optional(),
  
  /**
   * Style configuration
   */
  style: StyleSchema.optional(),
  
  /**
   * Responsive styles
   */
  responsiveStyle: ResponsiveStyleSchema.optional(),
  
  /**
   * Data bindings
   */
  dataBindings: z.array(DataBindingSchema).optional(),
  
  /**
   * Event handlers
   */
  events: z.object({
    onPress: ActionSchema.optional(),
    onLongPress: ActionSchema.optional(),
    onChange: ActionSchema.optional(),
    onFocus: ActionSchema.optional(),
    onBlur: ActionSchema.optional(),
    onLoad: ActionSchema.optional(),
    onError: ActionSchema.optional(),
    onRefresh: ActionSchema.optional(),
    onEndReached: ActionSchema.optional(),
  }).optional(),
  
  /**
   * Accessibility properties
   */
  accessibility: z.object({
    label: z.string().optional(),
    hint: z.string().optional(),
    role: z.string().optional(),
    hidden: z.boolean().optional(),
  }).optional(),
  
  /**
   * Test ID for automated testing
   */
  testId: z.string().optional(),
  
  /**
   * Child components
   */
  children: z.lazy(() => z.array(ComponentSchema)).optional(),
  
  /**
   * Component-specific properties
   */
  props: z.record(z.string(), z.any()).optional(),
})

export const ComponentSchema: z.ZodType<any> = BaseComponentSchema

export type Component = z.infer<typeof ComponentSchema>

// ============================================================================
// Page Schema
// ============================================================================

/**
 * Page configuration
 */
export const PageSchema = z.object({
  /**
   * Unique page identifier
   */
  id: z.string(),
  
  /**
   * Page name/slug for routing
   */
  name: z.string(),
  
  /**
   * Display title
   */
  title: z.string(),
  
  /**
   * Page description
   */
  description: z.string().optional(),
  
  /**
   * Route path (e.g., "/users/:id")
   */
  path: z.string(),
  
  /**
   * Page icon
   */
  icon: z.string().optional(),
  
  /**
   * Page components (the actual UI tree)
   */
  components: z.array(ComponentSchema),
  
  /**
   * Page-level data bindings
   */
  dataBindings: z.array(DataBindingSchema).optional(),
  
  /**
   * Page-level styles
   */
  style: StyleSchema.optional(),
  
  /**
   * Background configuration
   */
  background: z.object({
    type: z.enum(['color', 'image', 'gradient']),
    color: ColorSchema.optional(),
    image: z.string().optional(),
    gradient: z.object({
      colors: z.array(ColorSchema),
      angle: z.number(),
    }).optional(),
  }).optional(),
  
  /**
   * Header configuration
   */
  header: z.object({
    visible: z.boolean(),
    title: z.string().optional(),
    showBackButton: z.boolean().optional(),
    rightActions: z.array(z.object({
      icon: z.string(),
      action: ActionSchema,
    })).optional(),
    style: StyleSchema.optional(),
  }).optional(),
  
  /**
   * Pull-to-refresh configuration
   */
  refreshable: z.boolean().optional(),
  
  /**
   * Page transition animation
   */
  transition: z.enum(['slide', 'fade', 'none', 'modal']).optional(),
  
  /**
   * Authentication required
   */
  requiresAuth: z.boolean().optional(),
  
  /**
   * Required roles/permissions
   */
  permissions: z.array(z.string()).optional(),
  
  /**
   * SEO metadata (for web)
   */
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }).optional(),
  
  /**
   * Created timestamp
   */
  createdAt: z.string(),
  
  /**
   * Last updated timestamp
   */
  updatedAt: z.string(),
  
  /**
   * Version number
   */
  version: z.number().optional(),
})

export type Page = z.infer<typeof PageSchema>

// ============================================================================
// Navigation Schema
// ============================================================================

/**
 * Navigation item
 */
export interface NavigationItem {
  id: string
  type: 'page' | 'link' | 'divider' | 'group'
  label?: string
  icon?: string
  pageId?: string
  url?: string
  children?: NavigationItem[]
  badge?: {
    text: string
    color: string
  }
  condition?: string
}

export const NavigationItemSchema: z.ZodType<NavigationItem> = z.lazy(() => z.object({
  id: z.string(),
  type: z.enum(['page', 'link', 'divider', 'group']),
  label: z.string().optional(),
  icon: z.string().optional(),
  pageId: z.string().optional(),
  url: z.string().optional(),
  children: z.array(NavigationItemSchema).optional(),
  badge: z.object({
    text: z.string(),
    color: ColorSchema,
  }).optional(),
  condition: z.string().optional(),
}))

/**
 * Navigation configuration
 */
export const NavigationSchema = z.object({
  /**
   * Bottom tab bar items
   */
  bottomTabs: z.array(NavigationItemSchema).optional(),
  
  /**
   * Drawer/sidebar items
   */
  drawer: z.array(NavigationItemSchema).optional(),
  
  /**
   * Initial/default page
   */
  initialPage: z.string(),
  
  /**
   * Login page ID
   */
  loginPage: z.string().optional(),
  
  /**
   * Deep link configuration
   */
  deepLinks: z.array(z.object({
    pattern: z.string(),
    pageId: z.string(),
    params: z.record(z.string(), z.string()).optional(),
  })).optional(),
})

export type Navigation = z.infer<typeof NavigationSchema>

// ============================================================================
// App Schema (Complete Mobile App Configuration)
// ============================================================================

/**
 * Theme configuration
 */
export const ThemeConfigSchema = z.object({
  mode: z.enum(['light', 'dark', 'auto']),
  colors: z.object({
    primary: ColorSchema,
    secondary: ColorSchema,
    background: ColorSchema,
    surface: ColorSchema,
    text: ColorSchema,
    textSecondary: ColorSchema,
    border: ColorSchema,
    error: ColorSchema,
    warning: ColorSchema,
    success: ColorSchema,
    info: ColorSchema,
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontFamilyMono: z.string().optional(),
    baseFontSize: z.number(),
    headingScale: z.number(),
  }).optional(),
  spacing: z.object({
    base: z.number(),
    scale: z.number(),
  }).optional(),
  borderRadius: z.object({
    small: z.number(),
    medium: z.number(),
    large: z.number(),
    full: z.number(),
  }).optional(),
})

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>

/**
 * Complete mobile app schema
 * This is what mobile apps receive from the API
 */
export const MobileAppSchema = z.object({
  /**
   * Schema version for compatibility checking
   */
  schemaVersion: z.string(),
  
  /**
   * App identifier
   */
  appId: z.string(),
  
  /**
   * App display name
   */
  name: z.string(),
  
  /**
   * App description
   */
  description: z.string().optional(),
  
  /**
   * App version
   */
  version: z.string(),
  
  /**
   * Build number
   */
  buildNumber: z.number().optional(),
  
  /**
   * Organization/tenant ID
   */
  organizationId: z.string().optional(),
  
  /**
   * Space ID (for multi-tenant)
   */
  spaceId: z.string().optional(),
  
  /**
   * Theme configuration
   */
  theme: z.object({
    light: ThemeConfigSchema,
    dark: ThemeConfigSchema.optional(),
  }),
  
  /**
   * Navigation configuration
   */
  navigation: NavigationSchema,
  
  /**
   * All pages
   */
  pages: z.array(PageSchema),
  
  /**
   * Global data bindings (available to all pages)
   */
  globalDataBindings: z.array(DataBindingSchema).optional(),
  
  /**
   * API configuration
   */
  api: z.object({
    baseUrl: z.string(),
    headers: z.record(z.string(), z.string()).optional(),
    timeout: z.number().optional(),
    retryCount: z.number().optional(),
  }),
  
  /**
   * Authentication configuration
   */
  auth: z.object({
    type: z.enum(['jwt', 'oauth2', 'apiKey', 'none']),
    loginEndpoint: z.string().optional(),
    refreshEndpoint: z.string().optional(),
    logoutEndpoint: z.string().optional(),
    tokenStorage: z.enum(['secure', 'memory']).optional(),
  }).optional(),
  
  /**
   * Feature flags
   */
  features: z.record(z.string(), z.boolean()).optional(),
  
  /**
   * Localization
   */
  localization: z.object({
    defaultLocale: z.string(),
    supportedLocales: z.array(z.string()),
    stringsUrl: z.string().optional(),
  }).optional(),
  
  /**
   * Analytics configuration
   */
  analytics: z.object({
    enabled: z.boolean(),
    providers: z.array(z.object({
      name: z.string(),
      config: z.record(z.string(), z.any()),
    })),
  }).optional(),
  
  /**
   * Offline support configuration
   */
  offline: z.object({
    enabled: z.boolean(),
    syncInterval: z.number().optional(),
    cachePages: z.array(z.string()).optional(),
  }).optional(),
  
  /**
   * Assets manifest
   */
  assets: z.object({
    images: z.record(z.string(), z.string()).optional(),
    icons: z.record(z.string(), z.string()).optional(),
    fonts: z.array(z.object({
      family: z.string(),
      url: z.string(),
      weight: z.string().optional(),
      style: z.string().optional(),
    })).optional(),
  }).optional(),
  
  /**
   * Last updated timestamp
   */
  updatedAt: z.string(),
  
  /**
   * Content hash for cache invalidation
   */
  contentHash: z.string().optional(),
})

export type MobileApp = z.infer<typeof MobileAppSchema>

// ============================================================================
// Export Schema (For Page Builder Export)
// ============================================================================

/**
 * Export options
 */
export const ExportOptionsSchema = z.object({
  /**
   * Format: full app or single page
   */
  format: z.enum(['full', 'page', 'component']),
  
  /**
   * Include all pages or specific page IDs
   */
  pageIds: z.array(z.string()).optional(),
  
  /**
   * Include data bindings
   */
  includeDataBindings: z.boolean().optional(),
  
  /**
   * Include navigation
   */
  includeNavigation: z.boolean().optional(),
  
  /**
   * Include theme
   */
  includeTheme: z.boolean().optional(),
  
  /**
   * Minify output
   */
  minify: z.boolean().optional(),
  
  /**
   * Target platform (for platform-specific optimizations)
   */
  targetPlatform: PlatformSchema.optional(),
})

export type ExportOptions = z.infer<typeof ExportOptionsSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateComponent(data: unknown): Component {
  return ComponentSchema.parse(data)
}

export function validatePage(data: unknown): Page {
  return PageSchema.parse(data)
}

export function validateMobileApp(data: unknown): MobileApp {
  return MobileAppSchema.parse(data)
}

export function safeParseComponent(data: unknown) {
  return ComponentSchema.safeParse(data)
}

export function safeParsePage(data: unknown) {
  return PageSchema.safeParse(data)
}

export function safeParseMobileApp(data: unknown) {
  return MobileAppSchema.safeParse(data)
}

// ============================================================================
// Schema Version
// ============================================================================

export const MOBILE_SCHEMA_VERSION = '1.0.0'
