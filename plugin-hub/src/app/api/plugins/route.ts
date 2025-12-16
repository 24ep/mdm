import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import { PluginDefinition } from '@/types'

const PLUGIN_HUB_DIR = process.env.PLUGIN_HUB_DIR || join(process.cwd(), 'plugins')

/**
 * GET /api/plugins
 * List all plugins in the hub
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')

    const plugins = await loadPluginsFromHub()

    // Apply filters
    let filteredPlugins = plugins
    if (category) {
      filteredPlugins = filteredPlugins.filter(p => p.category === category)
    }
    if (status) {
      filteredPlugins = filteredPlugins.filter(p => p.status === status)
    }
    if (verified !== null) {
      const verifiedBool = verified === 'true'
      filteredPlugins = filteredPlugins.filter(p => p.verified === verifiedBool)
    }

    return NextResponse.json({ plugins: filteredPlugins })
  } catch (error) {
    console.error('Error fetching plugins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugins', plugins: [] },
      { status: 500 }
    )
  }
}

/**
 * Load plugins from hub directory
 */
async function loadPluginsFromHub(): Promise<PluginDefinition[]> {
  const hubPath = resolve(PLUGIN_HUB_DIR)

  try {
    await fs.access(hubPath)
  } catch {
    console.warn(`Plugin hub directory not found: ${hubPath}`)
    return []
  }

  const pluginDirs = await fs.readdir(hubPath, { withFileTypes: true })
  const plugins: PluginDefinition[] = []

  for (const dir of pluginDirs) {
    if (!dir.isDirectory()) continue

    const pluginPath = join(hubPath, dir.name)
    const pluginFile = join(pluginPath, 'plugin.ts')

    try {
      await fs.access(pluginFile)

      // Dynamic loading disabled
      // const dynamicRequire = eval('require');
      // // @ts-ignore
      // delete dynamicRequire.cache[dynamicRequire.resolve(pluginFile)]
      // const pluginModule = dynamicRequire(pluginFile)

      // // Extract plugin definition
      // const plugin = pluginModule.default ||
      //   pluginModule[Object.keys(pluginModule).find((k: string) => k.endsWith('Plugin'))] ||
      //   Object.values(pluginModule).find((v: any) => v && typeof v === 'object' && v.slug)

      // if (plugin) {
      //   plugins.push(plugin)
      // }
      console.warn('Plugin loading disabled during build fix');
    } catch (error) {
      console.warn(`Failed to load plugin from ${pluginFile}:`, error)
      continue
    }
  }

  return plugins
}

