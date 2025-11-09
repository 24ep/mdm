/**
 * Analytics Feature
 * Main export file for the analytics feature
 */

// Components
export { AnalyticsDashboard } from './components/AnalyticsDashboard'
export { SystemHealthDashboard } from './components/SystemHealthDashboard'
export { PerformanceMonitoring } from './components/PerformanceMonitoring'
export { LogManagement } from './components/LogManagement'

// Types
export type {
  SystemMetrics,
  ActivityData,
  StorageData,
  HealthStatus,
  PerformanceMetric,
  DatabaseMetric,
  Alert,
  PerformanceSettings,
  LogEntry,
  LogStats,
  LogFilter,
  LogRetention,
} from './types'

// Utils
export {
  getHealthStatusColor,
  getLogLevelColor,
  getAlertSeverityColor,
  formatUptime,
  formatResponseTime,
  calculateStoragePercentage,
  formatStorageSize,
  filterLogs,
  filterLogsByLevel,
  filterLogsByService,
  sortLogsByTimestamp,
  isAlertActive,
  getMetricTrend,
  calculateErrorRate,
} from './utils'

