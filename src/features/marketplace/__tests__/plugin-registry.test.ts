import { PluginRegistry } from '../lib/plugin-registry'
import { PluginDefinition } from '../types'

describe('PluginRegistry', () => {
  let registry: PluginRegistry

  beforeEach(() => {
    registry = new PluginRegistry()
  })

  describe('register', () => {
    it('should register a plugin', () => {
      const plugin: PluginDefinition = {
        id: 'test-plugin',
        name: 'Test Plugin',
        slug: 'test-plugin',
        version: '1.0.0',
        provider: 'Test Provider',
        category: 'other',
        status: 'approved',
        capabilities: {},
      }

      registry.register(plugin)

      const registered = registry.get('test-plugin')
      expect(registered).toEqual(plugin)
    })

    it('should throw error if plugin already exists', () => {
      const plugin: PluginDefinition = {
        id: 'test-plugin',
        name: 'Test Plugin',
        slug: 'test-plugin',
        version: '1.0.0',
        provider: 'Test Provider',
        category: 'other',
        status: 'approved',
        capabilities: {},
      }

      registry.register(plugin)

      expect(() => registry.register(plugin)).toThrow()
    })
  })

  describe('get', () => {
    it('should return plugin by slug', () => {
      const plugin: PluginDefinition = {
        id: 'test-plugin',
        name: 'Test Plugin',
        slug: 'test-plugin',
        version: '1.0.0',
        provider: 'Test Provider',
        category: 'other',
        status: 'approved',
        capabilities: {},
      }

      registry.register(plugin)

      const result = registry.get('test-plugin')
      expect(result).toEqual(plugin)
    })

    it('should return undefined for non-existent plugin', () => {
      const result = registry.get('non-existent')
      expect(result).toBeUndefined()
    })
  })

  describe('list', () => {
    it('should return all plugins', () => {
      const plugin1: PluginDefinition = {
        id: 'plugin-1',
        name: 'Plugin 1',
        slug: 'plugin-1',
        version: '1.0.0',
        provider: 'Provider',
        category: 'other',
        status: 'approved',
        capabilities: {},
      }

      const plugin2: PluginDefinition = {
        id: 'plugin-2',
        name: 'Plugin 2',
        slug: 'plugin-2',
        version: '1.0.0',
        provider: 'Provider',
        category: 'other',
        status: 'approved',
        capabilities: {},
      }

      registry.register(plugin1)
      registry.register(plugin2)

      const plugins = registry.list()
      expect(plugins).toHaveLength(2)
    })

    it('should filter plugins by category', () => {
      const plugin1: PluginDefinition = {
        id: 'plugin-1',
        name: 'Plugin 1',
        slug: 'plugin-1',
        version: '1.0.0',
        provider: 'Provider',
        category: 'other',
        status: 'approved',
        capabilities: {},
      }

      const plugin2: PluginDefinition = {
        id: 'plugin-2',
        name: 'Plugin 2',
        slug: 'plugin-2',
        version: '1.0.0',
        provider: 'Provider',
        category: 'other',
        status: 'approved',
        capabilities: {},
      }

      registry.register(plugin1)
      registry.register(plugin2)

      const plugins = registry.list({ category: 'other' })
      expect(plugins).toHaveLength(1)
      expect(plugins[0].slug).toBe('plugin-1')
    })
  })
})
