/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  output: 'standalone',
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    webpackBuildWorker: true,
    optimizeCss: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // Ignore @openai/chatkit-react on server-side
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@openai\/chatkit-react$/,
        })
      )
    }
    
    // Use stub for react-query-devtools if not installed
    try {
      require.resolve('@tanstack/react-query-devtools')
    } catch {
      try {
        const stubPath = require.resolve('./src/lib/providers/react-query-devtools-stub.ts')
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            /^@tanstack\/react-query-devtools$/,
            stubPath
          )
        )
      } catch {}
    }
    
    // Exclude native modules from server bundle
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push(
        'ssh2-sftp-client',
        'ftp',
        'ssh2'
      )
    }
    
    return config
  },
}

module.exports = nextConfig
