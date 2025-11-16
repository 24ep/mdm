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
  },
  // Disable output file tracing for local builds to avoid Windows permission issues
  output: process.env.NODE_ENV === 'production' && process.env.DOCKER_BUILD ? 'standalone' : undefined,
  // Add empty turbopack config to silence Next.js 16 warning (we use webpack)
  turbopack: {},
  webpack: (config, { isServer, webpack }) => {
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
    
    // Enhanced error reporting
    config.infrastructureLogging = {
      level: 'error',
    }
    
    // Override optimization to not fail on errors
    if (config.optimization) {
      config.optimization.removeAvailableModules = false
      config.optimization.removeEmptyChunks = false
    }
    
    // Custom error handling to collect all errors
    const originalEmit = config.plugins?.find(p => p.constructor.name === 'ForkTsCheckerWebpackPlugin')
    if (originalEmit) {
      // If ForkTsCheckerWebpackPlugin exists, configure it to not fail the build
      originalEmit.options = originalEmit.options || {}
      originalEmit.options.async = true // Don't block build
    }
    
    if (isServer) {
      // Ignore client-only packages on server
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@openai\/chatkit-react$/,
        })
      )
      // Exclude native modules from server bundle
      config.externals = config.externals || []
      config.externals.push('ssh2-sftp-client', 'ftp', 'ssh2')
    }
    return config
  },
  // Experimental: Continue build even with errors
  experimental: {
    // This helps show all errors
  },
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig
