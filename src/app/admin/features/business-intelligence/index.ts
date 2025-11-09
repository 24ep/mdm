/**
 * Business Intelligence Feature
 * Main export file for the business intelligence feature
 */

// Components
export { BusinessIntelligence } from './components/BusinessIntelligence'
export { MergedBIReports } from './components/MergedBIReports'
export { AIAnalyst } from './components/AIAnalyst'
export { AIChatUI } from './components/AIChatUI'
export { KernelManagement } from './components/KernelManagement'
export { BigQueryInterface } from './components/BigQueryInterface'
export { BigQueryInterfaceGranular } from './components/BigQueryInterfaceGranular'
export { DataScienceNotebook } from './components/DataScienceNotebook'

// Types
export type {
  Dashboard,
  DashboardWidget,
  FilterConfig,
  Report,
  DataSource,
  ChartTemplate,
  KernelServer,
  KernelTemplate,
} from './types'

// Utils
export {
  isDashboardPublic,
  filterDashboardsBySpace,
  sortDashboardsByName,
  isReportActive,
  isReportScheduled,
  filterReportsBySpace,
  formatReportFormat,
  isDataSourceActive,
  filterDataSourcesByType,
  getKernelStatusColor,
  isKernelOnline,
  filterKernelsByStatus,
  filterKernelsByLanguage,
} from './utils'

