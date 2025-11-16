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
    // Show all TypeScript errors during build
    ignoreBuildErrors: false,
  },
  // Disable output file tracing for local builds to avoid Windows permission issues
  output: process.env.NODE_ENV === 'production' && process.env.DOCKER_BUILD ? 'standalone' : undefined,
  // Add empty turbopack config to silence Next.js 16 warning (we use webpack)
  turbopack: {},
  webpack: (config, { isServer, webpack }) => {
    // Show all build errors instead of stopping at the first one
    config.bail = false
    
    // Configure stats to show all errors and warnings with full details
    if (!config.stats) {
      config.stats = {}
    }
    config.stats.errors = true
    config.stats.warnings = true
    config.stats.errorDetails = true
    config.stats.errorStack = true
    config.stats.colors = true
    config.stats.modules = false
    config.stats.chunks = false
    config.stats.assets = false
    
    // Ensure TypeScript errors are shown
    config.infrastructureLogging = {
      level: 'error',
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
}

module.exports = nextConfig
