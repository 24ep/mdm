/**
 * Asset Management Utilities
 * Helper functions to fetch and work with assets from the asset management system
 */

export interface Asset {
  id: string
  code: string
  name: string
  description?: string
  logo?: string
  icon?: string
  color?: string
  isActive: boolean
  metadata?: any
}

export interface AssetType {
  id: string
  code: string
  name: string
  category: string
}

/**
 * Fetch assets by type code (e.g., 'database_type', 'system_type')
 */
export async function getAssetsByType(
  assetTypeCode: string,
  languageCode?: string
): Promise<Asset[]> {
  try {
    const url = languageCode
      ? `/api/admin/assets?assetTypeCode=${assetTypeCode}&language=${languageCode}`
      : `/api/admin/assets?assetTypeCode=${assetTypeCode}`
    const response = await fetch(url)
    if (!response.ok) {
      console.error('Failed to fetch assets')
      return []
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching assets:', error)
    return []
  }
}

/**
 * Fetch a single asset by code and type
 */
export async function getAsset(
  assetTypeCode: string,
  assetCode: string,
  languageCode?: string
): Promise<Asset | null> {
  const assets = await getAssetsByType(assetTypeCode, languageCode)
  return assets.find((a) => a.code === assetCode) || null
}

/**
 * Get database type assets
 */
export async function getDatabaseTypes(
  languageCode?: string
): Promise<Asset[]> {
  return getAssetsByType('database_type', languageCode)
}

/**
 * Get system type assets
 */
export async function getSystemTypes(languageCode?: string): Promise<Asset[]> {
  return getAssetsByType('system_type', languageCode)
}

/**
 * Get CMS type assets
 */
export async function getCMSTypes(languageCode?: string): Promise<Asset[]> {
  return getAssetsByType('cms_type', languageCode)
}

/**
 * Format database type display name with icon
 */
export function formatDatabaseType(asset: Asset | null): string {
  if (!asset) return 'Unknown'
  return asset.icon ? `${asset.icon} ${asset.name}` : asset.name
}

/**
 * Get asset logo URL or fallback
 */
export function getAssetLogo(asset: Asset | null): string | null {
  if (!asset) return null
  return asset.logo || null
}

/**
 * Get asset icon (emoji or logo)
 */
export function getAssetIcon(asset: Asset | null): string | null {
  if (!asset) return null
  return asset.icon || asset.logo || null
}

