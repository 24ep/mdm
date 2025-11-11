/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  output: 'standalone', // Enable for Docker builds - reduces image size significantly
  
  // Optimize build performance and reduce resource usage
  swcMinify: true, // Use SWC minifier (faster than Terser)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Reduce memory usage during build
  experimental: {
    webpackBuildWorker: true, // Enable webpack build worker for parallel processing
    optimizeCss: true, // Optimize CSS during build
  },
  
  // Optimize webpack configuration
  webpack: (config, { isServer, webpack, dev }) => {
    // Reduce memory usage
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      }
      
      // Limit parallel processing to reduce memory usage
      config.parallelism = 2
      // Reduce memory usage by limiting cache
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        maxMemoryGenerations: 1, // Limit cache generations
      }
    }
    
    // Make react-icons optional - don't fail build if not installed
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
      }
    }
    // Ignore react-icons modules if they don't exist
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    // Ignore @openai/chatkit-react only on server-side to prevent SSR issues
    // Allow client-side dynamic imports to work properly
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@openai\/chatkit-react$/,
        })
      )
    }
    // Make @tanstack/react-query-devtools optional - use stub if package not found
    try {
      require.resolve('@tanstack/react-query-devtools')
      // Package exists, don't replace it
    } catch (e) {
      // Package doesn't exist, use stub
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^@tanstack\/react-query-devtools$/,
          require.resolve('./src/lib/providers/react-query-devtools-stub.ts')
        )
      )
    }
    // Exclude native modules from webpack processing
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push({
        'ssh2-sftp-client': 'commonjs ssh2-sftp-client',
        'ftp': 'commonjs ftp',
        'ssh2': 'commonjs ssh2'
      })
    }
    return config
  },
}

module.exports = nextConfig
