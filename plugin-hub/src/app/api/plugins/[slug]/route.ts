import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import { PluginDefinition } from '@/types'

const PLUGIN_HUB_DIR = process.env.PLUGIN_HUB_DIR || join(process.cwd(), 'plugins')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const plugin = await loadPluginFromHub(slug)

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ plugin })
  } catch (error) {
    console.error('Error fetching plugin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function loadPluginFromHub(slug: string): Promise<PluginDefinition | null> {
  const hubPath = resolve(PLUGIN_HUB_DIR)
  const pluginPath = join(hubPath, slug)
  const pluginFile = join(pluginPath, 'plugin.ts')

  try {
    await fs.access(pluginFile)

    // Dynamic loading disabled
    // // Use eval('require') to bypass Webpack static analysis
    // const dynamicRequire = eval('require');
    // // @ts-ignore
    // delete dynamicRequire.cache[dynamicRequire.resolve(pluginFile)]
    // const pluginModule = dynamicRequire(pluginFile)

    // const plugin = pluginModule.default ||
    //   pluginModule[Object.keys(pluginModule).find((k: string) => k.endsWith('Plugin'))] ||
    //   Object.values(pluginModule).find((v: any) => v && typeof v === 'object' && v.slug)

    // return plugin || null
    console.warn('Plugin loading disabled during build fix');
    return null;
  } catch {
    return null
  }
}

