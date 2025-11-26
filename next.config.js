/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
  typescript: {
    // Show all TypeScript errors during build (don't ignore, but don't stop)
    ignoreBuildErrors: false,
    // TypeScript will show all errors, build will continue to collect all errors
  },
  // Disable output file tracing for local builds to avoid Windows permission issues
  output: process.env.NODE_ENV === 'production' && process.env.DOCKER_BUILD ? 'standalone' : undefined,
  // Add empty turbopack config to silence Next.js 16 warning (we use webpack)
  turbopack: {},
  webpack: (config, { isServer, webpack }) => {
    // Exclude plugin-hub directory from build analysis (it's a separate service)
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
        '**/plugin-hub/**',
      ],
    }
    
    // CRITICAL: Don't bail on first error - show all errors
    config.bail = false
    
    // Configure stats to show all errors and warnings with full details
    if (!config.stats) {
      config.stats = {}
    }
    config.stats.errors = true
    config.stats.warnings = true
    config.stats.errorDetails = true
    config.stats.errorStack = true
    config.stats.warningsFilter = [] // Show all warnings
    config.stats.colors = true
    config.stats.modules = false
    config.stats.chunks = false
    config.stats.assets = false
    config.stats.all = false // Don't show everything, just errors/warnings
    config.stats.preset = false // Disable presets to use custom config
    
    // Enhanced error reporting - show all errors
    config.infrastructureLogging = {
      level: 'error',
    }
    
    // Collect all errors before failing
    config.optimization = config.optimization || {}
    config.optimization.removeAvailableModules = false
    config.optimization.removeEmptyChunks = false
    
    // Custom error handling to collect all errors
    const originalEmit = config.plugins?.find(p => p.constructor.name === 'ForkTsCheckerWebpackPlugin')
    if (originalEmit) {
      // If ForkTsCheckerWebpackPlugin exists, configure it to collect all errors
      originalEmit.options = originalEmit.options || {}
      originalEmit.options.async = true // Don't block build, collect all errors
      originalEmit.options.typescript = {
        ...originalEmit.options.typescript,
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      }
    }
    
    // Override webpack's error handling to collect all errors
    const originalOnError = config.infrastructureLogging
    if (config.plugins) {
      // Add a plugin to collect all compilation errors
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.done.tap('CollectAllErrors', (stats) => {
            if (stats.hasErrors()) {
              const errors = stats.compilation.errors
              if (errors.length > 0) {
                console.error(`\n\n=== Found ${errors.length} error(s) ===\n`)
              }
            }
          })
        },
      })
    }
    
    if (isServer) {
      // Ignore client-only packages on server
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@openai\/chatkit-react$/,
        })
      )
      // Ignore plugin-hub directory (separate service) - prevent any resolution attempts
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /plugin-hub/,
        })
      )
      // Also add to externals to prevent any module resolution
      if (!Array.isArray(config.externals)) {
        config.externals = [config.externals].filter(Boolean)
      }
      config.externals.push(({ request }, callback) => {
        if (request && request.includes('plugin-hub')) {
          return callback(null, 'commonjs ' + request)
        }
        callback()
      })
      // Exclude native modules from server bundle - mark Node.js built-ins as external
      config.externals = config.externals || []
      config.externals.push('ssh2-sftp-client', 'ftp', 'ssh2', 'child_process')
      // Mark Node.js built-in modules as external (they're available at runtime)
      const nodeBuiltins = ['crypto', 'fs', 'path', 'util', 'stream', 'os', 'net', 'tls', 'http', 'https', 'zlib', 'url', 'assert']
      nodeBuiltins.forEach(module => {
        if (!config.externals.includes(module)) {
          config.externals.push(module)
        }
      })
    } else {
      // For client-side builds, configure fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        util: false,
      }
      // Ignore child_process and util on client side
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(child_process|util)$/,
        })
      )
    }
    
    // Handle mqtt and socket.io-client - they use dynamic imports
    // Use IgnorePlugin to prevent webpack from trying to resolve them during build
    // Dynamic imports at runtime will still work because they bypass webpack
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(mqtt|socket\.io-client)$/,
        contextRegExp: /src\/features\/api-client/,
      })
    )
    
    // Suppress critical dependency warnings for external-plugin-loader.ts
    // These warnings are expected because we intentionally use dynamic requires for plugin loading
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /external-plugin-loader\.ts/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ]
    
    return config
  },
  // Experimental: Continue build even with errors
  // Note: turbo config removed - use --webpack flag to avoid Turbopack
  // Logging configuration - disable request logs
  logging: {
    fetches: {
      fullUrl: false,
    },
    incomingRequests: false,
  },
}

module.exports = nextConfig
