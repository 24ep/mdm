// Types
export * from './types'

// Hooks
export { useMarketplacePlugins } from './hooks/useMarketplacePlugins'
export type { UseMarketplacePluginsResult } from './hooks/useMarketplacePlugins'
export { usePluginInstallation } from './hooks/usePluginInstallation'
export type { UsePluginInstallationResult } from './hooks/usePluginInstallation'

// Components
export { MarketplaceHome } from './components/MarketplaceHome'
export { PluginCard } from './components/PluginCard'
export { InstallationWizard } from './components/InstallationWizard'
export { PluginRenderer } from './components/PluginRenderer'
export { PluginReviews } from './components/PluginReviews'
export { PluginHub } from './components/PluginHub'

// Lib
export { PluginRegistry } from './lib/plugin-registry'
export { PluginLoader, pluginLoader } from './lib/plugin-loader'
// PluginGateway is server-only (uses credential-manager which uses encryption)
// Only import it in API routes, not client components
// export { PluginGateway } from './lib/plugin-gateway'

