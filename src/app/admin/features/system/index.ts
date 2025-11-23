/**
 * System Feature
 * Main export file for the system feature
 */

// Components
export { SystemSettings } from './components/SystemSettings'

export { ThemeManager } from './components/theme-manager/ThemeManager'
export { PageTemplatesAdmin } from './components/PageTemplatesAdmin'
export { NotificationCenter } from './components/NotificationCenter'

// Types
export type {
  SystemSettings as SystemSettingsType,
  Theme,
  BrandingConfig,
  TemplateItem,
  NotificationTemplate,
  NotificationSettings,
} from './types'

// Utils
export {
  isThemeActive,
  filterThemesByType,
  sortThemesByName,
  filterTemplatesByScope,
  filterTemplatesByCategory,
  getAllTemplateCategories,
  isNotificationTemplateActive,
  filterNotificationTemplatesByType,
  sortNotificationTemplatesByName,
  formatNotificationType,
} from './utils'

